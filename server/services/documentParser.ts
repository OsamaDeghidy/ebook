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
        const uint8Data = (buffer instanceof Uint8Array && !Buffer.isBuffer(buffer))
          ? buffer
          : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        pdfParser = new PDFParse(uint8Data as any);
        const parsed = await pdfParser.getText();
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

  let pdfParser: PDFParse | null = null;
  try {
    const uint8Data = (buffer instanceof Uint8Array && !Buffer.isBuffer(buffer))
      ? buffer
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    pdfParser = new PDFParse(uint8Data as any);
    const textProbe = await pdfParser.getText({ partial: [1] } as any).catch(() => ({ text: "", total: 0 }));
    const pageMatch = (textProbe.text || "").match(/--\s*\d+\s*of\s*(\d+)\s*--/i);
    const totalPages = (textProbe as any)?.total || (pageMatch ? parseInt(pageMatch[1], 10) : 20);

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

    const shotResult = await pdfParser.getScreenshot({
      partial: pagesToRender,
      scale: 0.85,
    } as any);

    const renderedPages: any[] = shotResult?.pages || [];
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
