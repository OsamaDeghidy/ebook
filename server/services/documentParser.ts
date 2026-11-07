import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
  mimeType: string;
  fileName?: string;
  metadata?: Record<string, any>;
}

/**
 * Safely creates an isolated, non-detached Uint8Array copy from any Buffer or Uint8Array.
 * Prevents "TypeError: Cannot perform Construct on a detached ArrayBuffer" across multi-step PDF operations.
 */
export function toSafeUint8Array(input: Buffer | Uint8Array): Uint8Array {
  if (!input) return new Uint8Array(0);
  if (Buffer.isBuffer(input)) {
    const copy = Buffer.alloc(input.length);
    input.copy(copy);
    return new Uint8Array(copy.buffer, copy.byteOffset, copy.byteLength);
  }
  if (input instanceof Uint8Array) {
    const fresh = new Uint8Array(input.byteLength);
    fresh.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
    return fresh;
  }
  return new Uint8Array(0);
}

/**
 * Normalizes Unicode Arabic Presentation Forms (Forms-A \uFB50-\uFDFF and Forms-B \uFE70-\uFEFF)
 * and Egyptian Ministry PDF ligatures (e.g., ﻻ, ﻷ, ﻹ, ﻵ) into standard Arabic Unicode (\u0621-\u064A).
 */
export function normalizeArabicPresentationForms(text: string): string {
  if (!text) return "";

  // 1. Unicode Compatibility Canonical Decomposition & Recomposition (NFKC)
  let normalized = text.normalize("NFKC");

  // 2. Explicit ligature & lam-alef decomposition/cleanup
  normalized = normalized
    .replace(/\u0644\u0627\u0654/g, "لأ")
    .replace(/\u0644\u0627\u0655/g, "لإ")
    .replace(/\u0644\u0627\u0653/g, "لآ")
    .replace(/\u0644\u0627/g, "لا")
    .replace(/[\uFEF5\uFEF6]/g, "لآ")
    .replace(/[\uFEF7\uFEF8]/g, "لأ")
    .replace(/[\uFEF9\uFEFA]/g, "لإ")
    .replace(/[\uFEFB\uFEFC]/g, "لا");

  // 3. Remove zero-width non-joiners/joiners and Byte Order Mark if used for legacy visual shaping
  normalized = normalized.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, "");

  // 4. Clean vector replacement glyphs and orphan control pictures often embedded in educational PDFs
  normalized = normalized.replace(/[\uFFFD\u2400-\u243F]/g, " ");

  return normalized;
}

/**
 * Safely executes a PDF operation while suppressing harmless canvas/font warnings
 * like "Knockout groups not supported" and "TT: undefined function" from flooding the terminal.
 */
export async function withSilencedPdfWarnings<T>(fn: () => Promise<T>): Promise<T> {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Knockout groups not supported') ||
      msg.includes('TT: undefined function') ||
      msg.includes('Ensure that the `standardFontDataUrl`')
    ) {
      return; // Ignore harmless vector/font rendering noise
    }
    originalWarn.apply(console, args);
  };
  try {
    return await fn();
  } finally {
    console.warn = originalWarn;
  }
}

/**
 * Clean & normalize raw extracted text from PDFs, DOCX, or text files
 */
export function normalizeExtractedText(rawText: string): string {
  if (!rawText) return "";

  // 0. Normalize Arabic Presentation Forms and Ministry Ligatures first
  let cleaned = normalizeArabicPresentationForms(rawText);

  // 1. Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Strip pdf-parse v2 page separator markers (e.g., "-- 1 of 102 --")
  cleaned = cleaned.replace(/^--\s*\d+\s*of\s*\d+\s*--$/gmi, "");
  cleaned = cleaned.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "");

  // 3. Remove null bytes and non-printable control characters (except tabs and newlines)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 4. Normalize multiple blank lines to at most two
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 5. Remove excessive horizontal whitespace
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // 6. Trim lines
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Checks whether extracted text contains real readable Arabic or Latin text
 * rather than empty scanned pages or corrupted custom-font glyphs (\uFFFD / Private Use Area)
 */
export function isMeaningfulExtractedText(text: string): boolean {
  if (!text || text.trim().length < 150) return false;
  const trimmed = normalizeArabicPresentationForms(text).trim();
  // Base letters only (Arabic letters \u0621-\u064A without diacritics, plus Latin a-zA-Z)
  const baseLetters = (trimmed.match(/[\u0621-\u064Aa-zA-Z]/g) || []).length;
  const diacritics = (trimmed.match(/[\u064B-\u065F\u0670]/g) || []).length;
  const brokenGlyphs = (trimmed.match(/[\uFFFD\u2400-\u243F\uE000-\uF8FF]/g) || []).length;
  
  // If we have at least 150 real base letters (authentic curriculum words):
  if (baseLetters >= 150) {
    // Only reject if unrecoverable broken glyphs completely overwhelm the text
    if (brokenGlyphs > baseLetters * 1.2) return false;
    // For Arabic KG / early-childhood / Quranic texts, diacritics can be abundant, so we allow up to 2.5x base letters
    if (diacritics > baseLetters * 2.5) return false;
    return true;
  }
  return false;
}

/**
 * Detects whether extracted text suffers from reversed/scrambled glyph streams
 * or disconnected Arabic character encoding (common in ministry/educational PDFs)
 * Example from corrupted extraction: "ع ي تَّ وَ تَّ هُ ن آ قَّ رِ يَّ ت كلام"
 */
export function detectReversedOrBrokenArabic(text: string): boolean {
  if (!text || text.length < 80) return false;
  const sample = text.substring(0, 10000);
  
  // 1. Isolated single Arabic letters followed by spaces: e.g. "ع ي ت و ت ه ن"
  const isolatedLetters = sample.match(/(?:^|\s)[\u0621-\u064A][\u064B-\u065F\u0670]?(?=\s|$)/g) || [];
  const words = sample.split(/\s+/).filter(Boolean);
  
  if (words.length >= 15) {
    const isolatedRatio = isolatedLetters.length / words.length;
    // In standard Arabic, isolated single-letter words (only 'و' and rarely 'ف') account for < 5%.
    // If > 12% of words are single isolated Arabic letters, it's a corrupted disconnected glyph stream.
    if (isolatedRatio > 0.12) {
      return true;
    }
  }

  // 2. 3 or more consecutive single Arabic letters separated by spaces:
  // e.g. "ق ت ر" or "ع ي ت و ت ه ن"
  const consecutiveIsolated = sample.match(/(?:[\u0621-\u064A][\u064B-\u065F\u0670]?\s+){3,}/g);
  if (consecutiveIsolated && consecutiveIsolated.length >= 1) {
    return true;
  }

  // 3. Reversed common Arabic educational words (typical of Adobe InDesign / Ministry PDFs reversed encoding)
  // e.g. "ةرازو" (وزارة), "ةيبرتلا" (التربية), "ميلعتلا" (التعليم), "يساردلا" (الدراسي), "فصلا" (الصف), "سردلا" (الدرس), "ةغللا" (اللغة)
  const reversedIndicators = sample.match(/\b(?:ةرازو|ةيبرتلا|ميلعتلا|يساردلا|فصلا|سردلا|ةغللا|لولأا|يناثلا|ةطشنلأا)\b/g);
  if (reversedIndicators && reversedIndicators.length >= 2) {
    return true;
  }

  return false;
}

/**
 * Universal Document Parser supporting PDF, DOCX, TXT, MD
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string = "document"
): Promise<ParsedDocument> {
  const lowerName = fileName.toLowerCase();
  const isDocx =
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc");

  const isPdf =
    mimeType.includes("pdf") || lowerName.endsWith(".pdf");

  let extractedText = "";
  let pageCount: number | undefined = undefined;

  try {
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (isPdf) {
      let pdfParser: PDFParse | null = null;
      try {
        const uint8Data = toSafeUint8Array(buffer);
        pdfParser = new PDFParse(uint8Data as any);
        // ⚡ Memory shield for large PDF files (> 10MB):
        // Parse the essential front-matter pages (first 35 pages) needed for TOC & syllabus
        // to prevent V8 heap explosion and server OOM crashes!
        const isLargeFile = buffer.length > 10 * 1024 * 1024;
        const parsed = await pdfParser.getText(isLargeFile ? { first: 35 } : {});
        const rawPdfText = parsed.text || "";
        const pageMatch = rawPdfText.match(/--\s*\d+\s*of\s*(\d+)\s*--/i);
        pageCount =
          (parsed as any)?.total ||
          (parsed as any)?.numpages ||
          (pageMatch ? parseInt(pageMatch[1], 10) : undefined);
        extractedText = rawPdfText;
      } catch (pdfErr) {
        console.warn("[Document Parser] PDF text parsing fallback attempt:", pdfErr);
        extractedText = "";
      } finally {
        if (pdfParser && typeof (pdfParser as any).destroy === 'function') {
          try { await (pdfParser as any).destroy(); } catch (e) {}
        }
      }
    } else {
      // Plain text or Markdown
      extractedText = buffer.toString("utf-8");
    }
  } catch (err: any) {
    console.error(`[Document Parser] Failed to parse document (${fileName}):`, err);
    throw new Error(`فشل استخراج النصوص من المستند (${fileName}): ${err.message}`);
  }

  let normalized = normalizeExtractedText(extractedText);
  const isCorruptedGlyphStream = isPdf && detectReversedOrBrokenArabic(normalized);
  if (isPdf && (!isMeaningfulExtractedText(normalized) || isCorruptedGlyphStream)) {
    console.log(
      `[Document Parser] PDF "${fileName}" has non-readable or corrupted/reversed text layer (normalized len: ${normalized.length}, corruptedGlyphs: ${isCorruptedGlyphStream}, pages: ${pageCount || "?"}). Marking for Vision OCR.`
    );
    normalized = "";
  }

  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: normalized,
    pageCount,
    wordCount,
    mimeType: isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : isPdf
      ? "application/pdf"
      : "text/plain",
    fileName,
  };
}

export const extractTextFromFileBuffer = parseDocumentBuffer;

/**
 * High-Speed Vision OCR Extractor for Scanned or Unmapped-Font PDFs
 * Renders target PDF pages to lightweight PNG buffers via PDFParse.getScreenshot
 * and transcribes authentic curriculum text via Gemini Flash-Lite Vision.
 */
export async function extractPdfTextViaVisionPages(
  buffer: Buffer,
  generateFn: (params: any) => Promise<any>,
  options?: {
    startPage?: number;
    maxPagesToScan?: number;
    maxPages?: number;
    includeTocEndPages?: boolean;
  }
): Promise<{
  text: string;
  totalPages: number;
  lastScannedPage: number;
  lastPageScanned?: number;
}> {
  const startPage = Math.max(1, options?.startPage || 1);
  const maxPagesToScan = options?.maxPagesToScan || options?.maxPages || 14;
  const includeTocEndPages = options?.includeTocEndPages ?? (startPage === 1);

  try {
    let totalPages = 20;
  let probeParser: PDFParse | null = null;
  try {
    probeParser = new PDFParse(toSafeUint8Array(buffer) as any);
    const textProbe = await probeParser.getText({ partial: [1] } as any).catch(() => ({ text: "", total: 0 }));
    const pageMatch = (textProbe.text || "").match(/--\s*\d+\s*of\s*(\d+)\s*--/i);
    totalPages = (textProbe as any)?.total || (pageMatch ? parseInt(pageMatch[1], 10) : 20);
  } catch (e) {
  } finally {
    if (probeParser) { try { await probeParser.destroy(); } catch (e) {} }
  }

  const endPage = Math.min(totalPages, startPage + maxPagesToScan - 1);
  const pagesToRender: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    pagesToRender.push(p);
  }

  // Also include the last 2 pages on initial scan in case the Arabic Table of Contents (الفهرس) is at the end of the book
  if (includeTocEndPages && totalPages > endPage + 2) {
    pagesToRender.push(totalPages - 1, totalPages);
  }

  console.log(
    `[Vision OCR] Rendering ${pagesToRender.length} pages (${pagesToRender.join(", ")}) of ${totalPages} total pages...`
  );

  let shotParser: PDFParse | null = null;
  let renderedPages: any[] = [];
  try {
    shotParser = new PDFParse(toSafeUint8Array(buffer) as any);
    const shotResult = await withSilencedPdfWarnings(() =>
      shotParser!.getScreenshot({
        partial: pagesToRender,
        scale: 0.85,
      } as any)
    );
    renderedPages = shotResult?.pages || [];
  } catch (shotErr) {
    console.warn("[Vision OCR] Screenshot render warning:", shotErr);
  } finally {
    if (shotParser) { try { await shotParser.destroy(); } catch (e) {} }
  }

  if (renderedPages.length === 0) {
    return { text: "", totalPages, lastScannedPage: endPage };
  }

    // Group into batches of 5 pages per Gemini Vision call for fast parallel transcription
    const BATCH_SIZE = 5;
    const batches: any[][] = [];
    for (let i = 0; i < renderedPages.length; i += BATCH_SIZE) {
      batches.push(renderedPages.slice(i, i + BATCH_SIZE));
    }

    const batchPromises = batches.map(async (batch, bIdx) => {
      const pageNums = batch.map((p: any, idx: number) => p.pageNumber || pagesToRender[bIdx * BATCH_SIZE + idx]);
      const parts: any[] = [];

      for (const pageObj of batch) {
        let base64Png = "";
        if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
          base64Png = pageObj.dataUrl.replace(/^data:image\/\w+;base64,/, "");
        } else if (pageObj.data) {
          base64Png = Buffer.from(pageObj.data).toString("base64");
        }
        if (base64Png) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Png,
            },
          });
        }
      }

      parts.push({
        text: `أنت محرك قراءة واستخراج مناهج تعليمية فائق الدقة (High-Precision Academic OCR).
استخرج كافة النصوص التعليمية الواردة في هذه الصفحات (الصفحات: ${pageNums.join("، ")}) بنفس لغتها الأصلية بدقة 100% دون أي اختصار أو حذف.
- اكتب عناوين الوحدات والدروس والفهرس (إن وجد) بوضوح تام.
- استخرج جميع الشروحات، التعريفات، القوانين العلمية والرياضية، الأمثلة المحلولة، الجداول، والأسئلة كما وردت في الكتاب.
- تجاهل فقط العلامات المائية أو أرقام الهواتف الإعلانية الجانبية.`,
      });

      try {
        const res = await generateFn({
          contents: [{ parts }],
          config: {
            temperature: 0.1,
          },
        });
        return `\n\n--- [صفحات المستند: ${pageNums.join(" - ")}] ---\n` + (res?.text || "");
      } catch (ocrErr: any) {
        console.warn(`[Vision OCR] Batch ${bIdx + 1} (pages ${pageNums.join(",")}) warning:`, ocrErr?.message || ocrErr);
        return "";
      }
    });

    const batchTexts = await Promise.all(batchPromises);
    const combinedText = normalizeExtractedText(batchTexts.join("\n\n"));

    console.log(
      `[Vision OCR] Extracted ${combinedText.length} characters of authentic text from ${renderedPages.length} pages.`
    );

    return {
      text: combinedText,
      totalPages,
      lastScannedPage: endPage,
      lastPageScanned: endPage,
    };
  } catch (err: any) {
    console.warn("[Vision OCR] Failed to extract via vision screenshots:", err?.message || err);
    return { text: "", totalPages: 0, lastScannedPage: startPage, lastPageScanned: startPage };
  }
}

/**
 * Targeted Page-Range Extractor for Specific Lessons
 * Renders only the exact pages assigned to a lesson (e.g. pages 15 to 22)
 * and extracts authentic lesson text, vocabulary, exercises, and grammar rules.
 */
export async function extractPdfPageRange(
  buffer: Buffer,
  startPage: number,
  endPage: number,
  generateFn: (params: any) => Promise<any>
): Promise<string> {
  const safeStart = Math.max(1, startPage);
  // Cap at 10 pages maximum per single lesson request to guarantee speed & avoid timeout
  const safeEnd = Math.max(safeStart, Math.min(endPage, safeStart + 9));
  const pagesToRender: number[] = [];
  for (let p = safeStart; p <= safeEnd; p++) {
    pagesToRender.push(p);
  }

  console.log(`[Targeted Page Range] Extracting specific pages [${pagesToRender.join(", ")}] for lesson...`);

  let pdfParser: PDFParse | null = null;
  try {
    const uint8Data = toSafeUint8Array(buffer);
    pdfParser = new PDFParse(uint8Data as any);

    const shotResult = await withSilencedPdfWarnings(() =>
      pdfParser!.getScreenshot({
        partial: pagesToRender,
        scale: 0.85,
      } as any)
    );

    const renderedPages: any[] = shotResult?.pages || [];
    if (renderedPages.length === 0) return "";

    const parts: any[] = [];
    for (const pageObj of renderedPages) {
      let base64Png = "";
      if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
        base64Png = pageObj.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      } else if (pageObj.data) {
        base64Png = Buffer.from(pageObj.data).toString("base64");
      }
      if (base64Png) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64Png,
          },
        });
      }
    }

    parts.push({
      text: `أنت محرك قراءة واستخراج مناهج تعليمية موجه وفائق الدقة (Precision Curriculum Extractor).
المطلوب استخراج النصوص الحرفية الكاملة من هذه الصفحات المخصصة للدرس (الصفحات: ${pagesToRender.join("، ")}):
1. نص الدرس الأصلي الكامل (سواء كان نص قراءة، أو نص شعري بأبياته الشعرية، أو قصة استماع، أو تجربة علمية، أو نظريات رياضية).
2. معاني المفردات والمضادات والتراكيب المذكورة في هوامش أو جداول الصفحات.
3. القواعد النحوية أو الإملائية أو القوانين والنظريات المشروحة في هذه الصفحات.
4. التدريبات والأنشطة والمسائل والأسئلة الواردة في نهاية الصفحات.
5. لقوانين ورموز ومسائل الرياضيات والعلوم:
   - اكتب الصيغ والمعادلات الرياضية بصيغة LaTeX محاطة بـ $ أو $$.
   - اكتب الرموز الرياضية مقرونة بنطقها العربي السليم:
     ∈ (ينتمي إلى)، ∉ (لا ينتمي إلى)، ⊂ (مجموعة جزئية من)، ⊄ (ليست مجموعة جزئية من)،
     √x (الجذر التربيعي لـ)، ∛x (الجذر التكعيبي لـ)، [a, b] (الفترة المغلقة)، ]a, b[ (الفترة المفتوحة)،
     ح (مجموعة الأعداد الحقيقية)، ن (مجموعة الأعداد النسبية)، نَ (مجموعة الأعداد غير النسبية).
اكتب النص بدقة وأمانة علمية تامة دون تلخيص أو تأليف من خارج الصفحات.`,
    });

    const res = await generateFn({
      contents: [{ parts }],
      config: {
        temperature: 0.1,
      },
    });

    return normalizeExtractedText(res?.text || "");
  } catch (err: any) {
    console.warn(`[Targeted Page Range] Warning for pages ${safeStart}..${safeEnd}:`, err?.message || err);
    return "";
  } finally {
    if (pdfParser) {
      try { await pdfParser.destroy(); } catch (e) {}
    }
  }
}

/**
 * Visual Table of Contents Syllabus Extractor
 * Renders pages 2 through 8 to capture authentic ministry curriculum TOC with high visual fidelity.
 */
export async function extractVisualSyllabusFromToc(
  buffer: Buffer,
  generateFn: (params: any) => Promise<any>
): Promise<any> {
  let pdfParser: PDFParse | null = null;
  try {
    const uint8Data = toSafeUint8Array(buffer);
    pdfParser = new PDFParse(uint8Data as any);

    // Render TOC candidate pages (2 to 8)
    const tocPages = [2, 3, 4, 5, 6, 7];
    const shotResult = await withSilencedPdfWarnings(() =>
      pdfParser!.getScreenshot({
        partial: tocPages,
        scale: 0.85,
      } as any)
    );

    const renderedPages: any[] = shotResult?.pages || [];
    if (renderedPages.length === 0) return null;

    const parts: any[] = [];
    for (const pageObj of renderedPages) {
      let base64Png = "";
      if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
        base64Png = pageObj.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      } else if (pageObj.data) {
        base64Png = Buffer.from(pageObj.data).toString("base64");
      }
      if (base64Png) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64Png,
          },
        });
      }
    }

    if (parts.length === 0) return null;

    parts.push({
      text: `أنت خبير فحص مناهج ومذكرات تعليمية وكتب مدرسية معتمد.
المهمة: طالع صفحات الفهرس (المحتويات) المرفقة بدقة بصرية متناهية:
1. استخرج اسم المنهج/الكتاب، وقائمة الوحدات، وجميع الدروس بدون استثناء بترتيبها الصارم.
2. لكل درس: استخرج عنوانه الحرفي، اسم وحدته، ورقم صفحة بدايته start_page، ورقم صفحة نهايته end_page قبل بداية الدرس التالي مباشرة.
3. استخرج 3 إلى 5 مفاهيم أساسية متوقعة لكل درس في sub_topics.

أخرج النتيجة ككائن JSON فقط بدون أي علامات markdown:
{
  "book_title": "اسم المقرر الرسمي",
  "detected_units": ["الوحدة 1...", "الوحدة 2..."],
  "lessons": [
    {
      "lesson_order": 1,
      "lesson_title": "الدرس الأول: ...",
      "unit_title": "الوحدة ...",
      "start_page": 2,
      "end_page": 9,
      "sub_topics": ["المفهوم 1", "المفهوم 2"]
    }
  ]
}`
    });

    const res = await generateFn({
      contents: [{ parts }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const text = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    if (parsed && Array.isArray(parsed.lessons) && parsed.lessons.length > 0) {
      console.log(`[Visual TOC Extractor] Discovered ${parsed.lessons.length} authentic lessons directly from visual TOC!`);
      return parsed;
    }
    return null;
  } catch (err: any) {
    console.warn("[Visual TOC Extractor] Warning:", err?.message || err);
    return null;
  } finally {
    if (pdfParser) {
      try { await pdfParser.destroy(); } catch (e) {}
    }
  }
}

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  pageType: 'study' | 'exercise';
}

/**
 * 🏛️ Global Front-Matter Offset Detector for Egyptian Curricula & School Booklets
 * Scans the front matter (pages 1 to 25) of the PDF to pinpoint where the Table of Contents / Intro ends
 * and Lesson 1 actually starts in the physical PDF pages, compared to its printed page number in the TOC.
 * 
 * Example:
 * - Table of Contents lists Lesson 1 on printed page 2.
 * - Physical front matter (cover, blank, intro, TOC, unit cover) occupies pages 1..8.
 * - Lesson 1 actually begins on physical PDF page 9.
 * - Calculated Global Offset = 9 - 2 = +7.
 */
export async function detectBookGlobalOffset(
  buffer: Buffer,
  lesson1Title: string,
  lesson1PrintedStartPage: number = 1,
  generateFn?: (params: any) => Promise<any>
): Promise<number> {
  const printedStart = Math.max(1, Number(lesson1PrintedStartPage) || 1);
  let pdfParser: PDFParse | null = null;

  try {
    const uint8Data = toSafeUint8Array(buffer);
    pdfParser = new PDFParse(uint8Data as any);

    // 1. Fast text-layer scan on the first 25 pages
    try {
      const textResult = await pdfParser.getText({ first: 25 });
      const cleanTitle = lesson1Title
        .replace(/الدرس\s*(الأول|الثاني|الثالث|\d+)[:\s]*/g, "")
        .replace(/[^\u0621-\u064A0-9a-zA-Z\s]/g, " ")
        .trim();
      const titleKeywords = cleanTitle.split(/\s+/).filter(w => w.length >= 3);

      if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
        for (let p = 1; p <= textResult.pages.length; p++) {
          const pgText = textResult.pages[p - 1]?.text || "";
          const isTocPage = /محتويات|فهرس|الفهرس|دليل الكتاب|خطة توزيع/i.test(pgText);
          const hasTitle = cleanTitle.length > 2 && (
            pgText.includes(cleanTitle) ||
            (titleKeywords.length >= 2 && titleKeywords.every(kw => pgText.includes(kw)))
          );

          // We want the physical page where the lesson starts in the body (after TOC)
          if (hasTitle && !isTocPage && p >= 3) {
            const offset = p - printedStart;
            console.log(`[Global Offset Text] Found Lesson 1 "${cleanTitle}" on physical page ${p} (TOC printed: ${printedStart}) -> Calibrated Offset: ${offset}`);
            return offset;
          }
        }
      }
    } catch (e) {}

    // 2. Vision OCR scan across front-matter candidates (pages 4 to 20)
    if (generateFn) {
      const candidatePages: number[] = [];
      for (let p = 4; p <= 20; p++) candidatePages.push(p);

      const shotResult = await withSilencedPdfWarnings(() =>
        pdfParser!.getScreenshot({
          partial: candidatePages,
          scale: 0.5,
        } as any)
      );

      const renderedPages: any[] = shotResult?.pages || [];
      if (renderedPages.length > 0) {
        const parts: any[] = [];
        for (let i = 0; i < renderedPages.length; i++) {
          const pageObj = renderedPages[i];
          const pageNum = candidatePages[i];
          let base64Png = "";
          if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
            base64Png = pageObj.dataUrl.replace(/^data:image\/\w+;base64,/, "");
          } else if (pageObj.data) {
            base64Png = Buffer.from(pageObj.data).toString("base64");
          }
          if (base64Png) {
            parts.push({ inlineData: { mimeType: "image/png", data: base64Png } });
            parts.push({ text: `رقم الصفحة الفيزيائية في الـ PDF: ${pageNum}` });
          }
        }

        const cleanTitle = lesson1Title.replace(/الدرس\s*(الأول|\d+)[:\s]*/g, "").trim();
        parts.push({
          text: `أمامك صفحات البداية لمذكرة دراسية مصرية (الصفحات من 4 إلى 20).
المطلوب: حدد رقم الصفحة الفيزيائية الدقيق الذي يبدأ عنده شرح الدرس الأول: "${cleanTitle}" (بعد انتهاء الغلاف والمقدمة والفهرس وغلاف الوحدة).
علماً بأن الفهرس يذكر أن الدرس يبدأ عند صفحة ${printedStart}.
أخرج كائن JSON فقط: { "exact_physical_page": رقم_الصفحة }`
        });

        const resp = await generateFn({
          contents: [{ parts }],
          config: { responseMimeType: "application/json", temperature: 0.1 }
        });

        const text = resp?.text || resp?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
          const exactPhys = Number(parsed?.exact_physical_page);
          if (exactPhys >= 4 && exactPhys <= 25) {
            const offset = exactPhys - printedStart;
            console.log(`[Global Offset Vision] Pinpointed Lesson 1 on physical page ${exactPhys} -> Global Offset: ${offset}`);
            return offset;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[Global Offset] Error during auto-calibration:", err?.message || err);
  } finally {
    if (pdfParser && typeof (pdfParser as any).destroy === 'function') {
      try { await (pdfParser as any).destroy(); } catch (e) {}
    }
  }

  // Fallback standard Egyptian curriculum offset
  return 7;
}

/**
 * 🎯 AutoAnchor: Fast Optical Lesson Anchor Page Detector
 * Automatically scans a narrow micro-window around the estimated page
 * to pinpoint the exact physical PDF page where the lesson title banner begins.
 * Eliminates manual offset calibration across all booklets!
 */
export async function detectLessonAnchorPage(
  buffer: Buffer,
  estimatedPhysicalPage: number,
  lessonTitle: string,
  generateFn?: (params: any) => Promise<any>
): Promise<number> {
  const safeEst = Math.max(1, estimatedPhysicalPage);
  // Search window [-3, +6] to handle section dividers and unit covers
  const candidatePages: number[] = [];
  for (let p = Math.max(1, safeEst - 3); p <= safeEst + 6; p++) {
    candidatePages.push(p);
  }

  let pdfParser: PDFParse | null = null;
  try {
    const uint8Data = toSafeUint8Array(buffer);
    pdfParser = new PDFParse(uint8Data as any);

    // Fast check: if PDF has clean text layer, check directly via text!
    try {
      const textResult = await pdfParser.getText();
      if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
        const cleanTitle = lessonTitle.replace(/الدرس\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|\d+)[:\s]*/g, "").trim();
        for (const pageNum of candidatePages) {
          const pgText = textResult.pages[pageNum - 1]?.text || "";
          if (cleanTitle.length > 2 && pgText.includes(cleanTitle)) {
            console.log(`[AutoAnchor Text] Found title "${cleanTitle}" on physical page ${pageNum}`);
            return pageNum;
          }
        }
      }
    } catch (e) {}

    // If scanned/vectorized and generateFn provided, do a lightweight vision scan of candidate thumbnails
    if (generateFn) {
      const shotResult = await withSilencedPdfWarnings(() =>
        pdfParser!.getScreenshot({
          partial: candidatePages,
          scale: 0.6, // Lightweight fast thumbnail
        } as any)
      );

      const renderedPages: any[] = shotResult?.pages || [];
      if (renderedPages.length > 0) {
        const parts: any[] = [];
        for (let i = 0; i < renderedPages.length; i++) {
          const pageObj = renderedPages[i];
          const pageNum = candidatePages[i];
          let base64Png = "";
          if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
            base64Png = pageObj.dataUrl.replace(/^data:image\/\w+;base64,/, "");
          } else if (pageObj.data) {
            base64Png = Buffer.from(pageObj.data).toString("base64");
          }
          if (base64Png) {
            parts.push({
              inlineData: { mimeType: "image/png", data: base64Png }
            });
            parts.push({
              text: `صورة رقم الصفحة في الملف: ${pageNum}`
            });
          }
        }

        parts.push({
          text: `حدد رقم الصفحة الدقيق الذي تبدأ فيه لافتة وعنوان درس "${lessonTitle}".
أخرج كائن JSON فقط: { "exact_start_page": رقم_الصفحة }`
        });

        const resp = await generateFn({
          contents: [{ parts }],
          config: { responseMimeType: "application/json", temperature: 0.1 }
        });

        const text = resp?.text || resp?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
          if (parsed && Number(parsed.exact_start_page) > 0) {
            const exact = Number(parsed.exact_start_page);
            console.log(`[AutoAnchor Vision] Pinpointed lesson "${lessonTitle}" to exact physical page ${exact}`);
            return exact;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AutoAnchor] Notice:", err);
  } finally {
    if (pdfParser) {
      try { await pdfParser.destroy(); } catch (e) {}
    }
  }

  return safeEst;
}

/**
 * Dynamic Page Offset Calibrator
 * Computes the exact delta between the printed book page number and the PDF physical page index.
 */
export function calculatePhysicalPage(
  logicalPage: number, 
  pageOffset: number = 0, 
  maxPages: number = 1000
): number {
  const target = Math.max(1, (Number(logicalPage) || 1) + (Number(pageOffset) || 0));
  return Math.min(target, maxPages);
}

/**
 * High-Resolution Page Renderer for Dual-Canvas Lesson View
 * Returns high-fidelity visual page slides for authentic textbook display.
 * Calibrates physical PDF pages with printed booklet pageOffset.
 */
export async function renderPdfPagesToImages(
  buffer: Buffer,
  startPage: number,
  endPage: number,
  pageOffset: number = 0
): Promise<RenderedPageImage[]> {
  const offset = Number(pageOffset) || 0;
  const safeLogicalStart = Math.max(1, startPage);
  const safeLogicalEnd = Math.max(safeLogicalStart, Math.min(endPage, safeLogicalStart + 11));

  // Compute physical pages in the PDF file
  const physicalStart = calculatePhysicalPage(safeLogicalStart, offset);
  const physicalEnd = calculatePhysicalPage(safeLogicalEnd, offset);

  const physicalPagesToRender: number[] = [];
  for (let p = physicalStart; p <= physicalEnd; p++) {
    physicalPagesToRender.push(p);
  }

  console.log(`[renderPdfPagesToImages] Rendering printed pages ${safeLogicalStart}..${safeLogicalEnd} -> Physical PDF pages ${physicalStart}..${physicalEnd} (Offset: ${offset})`);

  let pdfParser: PDFParse | null = null;
  try {
    const uint8Data = toSafeUint8Array(buffer);
    pdfParser = new PDFParse(uint8Data as any);

    const shotResult = await withSilencedPdfWarnings(() =>
      pdfParser!.getScreenshot({
        partial: physicalPagesToRender,
        scale: 1.1,
      } as any)
    );

    const renderedPages: any[] = shotResult?.pages || [];
    const results: RenderedPageImage[] = [];

    for (let i = 0; i < renderedPages.length; i++) {
      const pageObj = renderedPages[i];
      // Display logical printed page number to the student matching printed page on image
      const physPageNum = physicalPagesToRender[i] || (physicalStart + i);
      const logicalPageNum = Math.max(1, physPageNum - offset);

      let dataUrl = "";
      if (pageObj.dataUrl && typeof pageObj.dataUrl === "string") {
        dataUrl = pageObj.dataUrl.startsWith("data:")
          ? pageObj.dataUrl
          : `data:image/png;base64,${pageObj.dataUrl}`;
      } else if (pageObj.data) {
        const base64 = Buffer.from(pageObj.data).toString("base64");
        dataUrl = `data:image/png;base64,${base64}`;
      }
      if (dataUrl) {
        // Last page of a lesson block is standardly the exercises page in Egyptian booklets
        const isExercise = renderedPages.length > 1 && i === renderedPages.length - 1;
        results.push({ 
          pageNumber: logicalPageNum, 
          dataUrl,
          pageType: isExercise ? 'exercise' : 'study'
        });
      }
    }
    return results;
  } catch (err: any) {
    console.warn(`[renderPdfPagesToImages] Error rendering pages ${safeLogicalStart}..${safeLogicalEnd}:`, err?.message || err);
    return [];
  } finally {
    if (pdfParser) {
      try { await pdfParser.destroy(); } catch (e) {}
    }
  }
}

/**
 * Recursive Pedagogical Text Splitter
 * Splits long text at natural semantic boundaries (Units, Chapters, Headings, Paragraphs)
 */
export function splitTextPedagogically(
  text: string,
  chunkSize: number = 4000,
  overlap: number = 200
): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const separators = [
    "\n# ",
    "\n## ",
    "\n### ",
    "\n\n",
    "\nالوحدة ",
    "\nالفصل ",
    "\nالدرس ",
    "\n",
    ". ",
    " ",
    "",
  ];

  function recursiveSplit(currentText: string, sepIndex: number): string[] {
    if (currentText.length <= chunkSize) {
      return [currentText];
    }
    if (sepIndex >= separators.length) {
      // Hard split
      const result: string[] = [];
      for (let i = 0; i < currentText.length; i += chunkSize - overlap) {
        result.push(currentText.slice(i, i + chunkSize));
      }
      return result;
    }

    const sep = separators[sepIndex];
    const parts = currentText.split(sep);
    const result: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const piece = currentChunk ? currentChunk + sep + part : part;

      if (piece.length <= chunkSize) {
        currentChunk = piece;
      } else {
        if (currentChunk) {
          result.push(currentChunk);
          currentChunk = "";
        }
        if (part.length > chunkSize) {
          const subSplits = recursiveSplit(part, sepIndex + 1);
          result.push(...subSplits);
        } else {
          currentChunk = part;
        }
      }
    }

    if (currentChunk) {
      result.push(currentChunk);
    }

    return result;
  }

  return recursiveSplit(text, 0);
}
