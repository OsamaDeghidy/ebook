import { Type } from "@google/genai";

export interface SyllabusLessonBlueprint {
  lesson_order: number;
  lesson_title: string;
  unit_title?: string;
  character_start?: number;
  character_end?: number;
  page_estimate?: string;
  sub_topics: string[];
  key_terms?: { term: string; definition: string }[];
  raw_text_snippet: string;
  status: "completed" | "pending";
}

export interface DocumentSyllabusBlueprint {
  book_title: string;
  total_lessons: number;
  detected_units: string[];
  lessons: SyllabusLessonBlueprint[];
  raw_full_text?: string;
  is_scanned_pdf?: boolean;
  total_pdf_pages?: number;
  last_scanned_page?: number;
  source_file_url?: string;
  createdAt: string;
}

/**
 * Fast LLM Blueprint Extraction Schema
 */
const blueprintResponseSchema = {
  type: Type.OBJECT,
  properties: {
    book_title: {
      type: Type.STRING,
      description: "Accurate course or booklet title inferred from source text."
    },
    detected_units: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of unit/module titles in the exact order they appear in the booklet."
    },
    lessons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lesson_order: { type: Type.INTEGER, description: "Strict sequential 1-based index from page 1 to the end" },
          lesson_title: { type: Type.STRING, description: "Exact authentic title of the lesson as written in the booklet" },
          unit_title: { type: Type.STRING, description: "Parent unit title if available" },
          sub_topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 to 6 distinct internal sub-topics, themes, or sections in this lesson"
          },
          key_terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            },
            description: "Core vocabulary, laws, or rules mentioned in this lesson"
          },
          starting_text_anchor: {
            type: Type.STRING,
            description: "First 8-15 exact words starting this lesson in the document text"
          },
          ending_text_anchor: {
            type: Type.STRING,
            description: "Last 8-15 exact words ending this lesson before the next one starts"
          }
        },
        required: ["lesson_order", "lesson_title", "sub_topics"]
      },
      description: "Exhaustive list of all lessons detected, strictly in document appearance order."
    }
  },
  required: ["book_title", "lessons"]
};

/**
 * Normalize Arabic text for robust fuzzy substring location
 */
function normalizeForSearch(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Detects if the first few thousand characters represent a Table of Contents (الفهرس / المحتويات)
 * and returns the offset after the TOC where body content actually starts.
 */
function detectTocBoundary(text: string): number {
  if (!text) return 0;
  const sample = text.substring(0, 6000);
  
  // Check for Table of Contents header keywords
  const tocMatch = sample.match(/(?:فهرس|المحتويات|جدول الدروس|محتويات المنهج|دليل المنهج)/i);
  if (!tocMatch) return 0;

  // Find where the actual content begins
  const tocIdx = tocMatch.index || 0;
  const afterToc = sample.indexOf("\n\n", tocIdx + 800);
  if (afterToc !== -1 && afterToc < 5000) {
    return afterToc;
  }
  return Math.min(2500, Math.floor(sample.length / 2));
}

/**
 * Finds the starting character position of a lesson in the document text
 */
function findLessonStartPosition(
  lesson: any,
  extractedText: string,
  normalizedDoc: string,
  searchOffset: number,
  tocBoundary: number
): number {
  const effectiveOffset = Math.max(searchOffset, tocBoundary);

  // 1. Try starting_text_anchor (Exact)
  if (lesson.starting_text_anchor && lesson.starting_text_anchor.trim().length >= 6) {
    const anchor = lesson.starting_text_anchor.trim();
    const exactIdx = extractedText.indexOf(anchor, effectiveOffset);
    if (exactIdx !== -1) return exactIdx;

    // Try first 25 chars of anchor
    const shortAnchor = anchor.substring(0, 25);
    const shortIdx = extractedText.indexOf(shortAnchor, effectiveOffset);
    if (shortIdx !== -1) return shortIdx;

    // Try normalized anchor
    const normAnchor = normalizeForSearch(anchor);
    if (normAnchor.length >= 6) {
      const normIdx = normalizedDoc.indexOf(normAnchor, effectiveOffset);
      if (normIdx !== -1) return normIdx;
    }
  }

  // 2. Try lesson_title (Exact or Normalized)
  if (lesson.lesson_title && lesson.lesson_title.trim().length >= 4) {
    const title = lesson.lesson_title.trim();
    const cleanTitle = title.replace(/^(الدرس|المفهوم|الوحدة|الفصل|نص|قصة|موضوع)\s+([الأول|الثاني|الثالث|الرابع|الخامس|السادس|\d]+)?[:：\-–\s]*/i, '').trim();
    
    // Exact title
    const titleIdx = extractedText.indexOf(title, effectiveOffset);
    if (titleIdx !== -1) return titleIdx;

    // Cleaned title (without "الدرس الأول:")
    if (cleanTitle.length >= 4) {
      const cleanIdx = extractedText.indexOf(cleanTitle, effectiveOffset);
      if (cleanIdx !== -1) return cleanIdx;

      const normClean = normalizeForSearch(cleanTitle);
      const normCleanIdx = normalizedDoc.indexOf(normClean, effectiveOffset);
      if (normCleanIdx !== -1) return normCleanIdx;
    }
  }

  // 3. Try first sub-topic or key term
  if (Array.isArray(lesson.sub_topics) && lesson.sub_topics.length > 0) {
    for (const sub of lesson.sub_topics) {
      if (sub && sub.length >= 6) {
        const subIdx = extractedText.indexOf(sub.trim(), effectiveOffset);
        if (subIdx !== -1) return subIdx;
      }
    }
  }

  return -1;
}

/**
 * Scans the entire extracted document text and builds an exact Curriculum Blueprint
 */
export async function extractDocumentBlueprint(
  extractedText: string,
  metadata: {
    fileName?: string;
    category?: string;
    grade_level?: string;
    semester?: string;
    language?: string;
    academic_system?: string;
    fileUri?: string;
    fileMimeType?: string;
  },
  generateFn: (params: any) => Promise<any>
): Promise<DocumentSyllabusBlueprint> {
  const isExplicitArabic = metadata.language === 'ar' || metadata.academic_system === 'general_arabic' || metadata.academic_system === 'technical';
  const isExplicitEnglish = metadata.language === 'en' || metadata.academic_system?.includes('international') || metadata.academic_system === 'general_languages';
  const hasArabicChar = /[\u0600-\u06FF]/.test(extractedText || metadata.fileName || '');
  const isArabic = isExplicitArabic || (!isExplicitEnglish && hasArabicChar);

  if ((!extractedText || extractedText.length < 50) && !metadata.fileUri) {
    return {
      book_title: metadata.fileName || (isArabic ? "المقرر التعليمي" : "Educational Course"),
      total_lessons: 1,
      detected_units: isArabic ? ["الوحدة الأولى"] : ["Unit 1"],
      lessons: [
        {
          lesson_order: 1,
          lesson_title: metadata.fileName || (isArabic ? "الدرس الأول" : "Lesson 1"),
          sub_topics: isArabic ? ["المفاهيم الأساسية", "الشرح والتطبيقات"] : ["Key Concepts", "Applications"],
          raw_text_snippet: extractedText || "",
          status: "pending"
        }
      ],
      raw_full_text: extractedText,
      createdAt: new Date().toISOString()
    };
  }

  // Scan full text (up to 300,000 characters for complete syllabus discovery)
  const previewText = extractedText ? extractedText.substring(0, 300000) : "";

  const blueprintPrompt = `
You are the Master Educational Document Architect.
Your mission is to perform a COMPLETE, EXHAUSTIVE, STRICTLY CHRONOLOGICAL DISCOVERY SCAN of the entire uploaded teacher booklet / textbook text below.

DOCUMENT METADATA:
- File Name: "${metadata.fileName || 'Document'}"
- Category: "${metadata.category || 'Curriculum'}"
- Grade / Level: "${metadata.grade_level || 'General'}"
- Semester: "${metadata.semester || 'Term 1'}"
- Required Language: "${isArabic ? 'Arabic (العربية)' : 'English (or source language)'}"

${previewText ? `DOCUMENT TEXT TO SCAN:
"""
${previewText}
"""` : 'NOTE: The complete document is attached as cloud file data. Perform exhaustive discovery scan across all units and lessons.'}

🚨 CRITICAL MANDATORY DISCOVERY & ORDERING RULES (P0):
0. 🌐 STRICT TARGET LANGUAGE MANDATE (P0):
   ${isArabic
     ? `The Target Language is Modern Standard Arabic (العربية). All book_title, detected_units, lesson_title, and sub_topics MUST be written strictly in Arabic. 🚫 NEVER translate Arabic curriculum, lessons, or concepts to English under any circumstances!`
     : `The Target Language is English (or textbook language). Output all titles in English without Arabic text.`
   }

1. STRICT SEQUENTIAL DOCUMENT ORDER (PAGE 1 TO END):
   - You MUST extract units and lessons in the EXACT ORDER they appear in the booklet from top to bottom.
   - 🚫 NEVER jump across the booklet.
   - 🚫 NEVER re-order lessons by topic, difficulty, or personal preference.
   - Lesson 1 MUST be the very first lesson appearing on the opening pages of the booklet, followed in exact order by Lesson 2, Lesson 3, etc.

2. EXHAUSTIVE COVERAGE (NO SKIPPING):
   - Identify EVERY single unit and EVERY distinct lesson/topic in the document.
   - 🚫 DO NOT skip any lessons.

3. AUTHENTIC LESSON TITLES:
   - Extract the EXACT authentic title written by the teacher or ministry (e.g. "الدرس الأول: النماذج الشريطية", "نص استماع: كل منا له حلم", "التركيب الضوئي").
   - 🚫 DO NOT invent artificial blended titles.

4. MULTI-PART LESSON NOMENCLATURE (P0):
   - If a lesson is extensive or subdivided into parts in the document, you MUST explicitly name them:
     e.g., "[اسم الدرس الأصلي] - (الجزء 1)", "[اسم الدرس الأصلي] - (الجزء 2)".
   - 🚫 NEVER invent synthetic or arbitrary names for sub-phases of the same lesson!

5. ANCHOR MAPPING:
   - Provide the starting and ending text anchors (8-15 exact words) for each lesson to guarantee precise text slicing.

6. SUB-TOPICS & CONCEPTS:
   - List the 3-6 internal sub-topics and extracted key terms directly from the text.

7. KINDERGARTEN & EARLY-CHILDHOOD DISCOVERY (KG1, KG2, رياض الأطفال):
   - For kindergarten (KG/رياض الأطفال) or early primary books:
     * Discover every distinct Alphabet Letter unit (e.g. "حرف الألف", "حرف الميم", "حرف الباء"), Listening Story ("قصة الاستماع"), Phonics & Phonemic Awareness ("الوعي الصوتي", "الوعي البصري"), and Theme/Unit ("المحور الأول: من أكون", "المحور الثاني: العالم من حولي").
     * 🚫 NEVER condense an entire 50-100+ page kindergarten booklet into 1 or 2 generic lessons! Extract all distinct interactive educational lessons (typically 8 to 25 distinct chapters).
`;

  try {
    const promptContents: any[] = [];
    if (metadata.fileUri) {
      promptContents.push({
        fileData: {
          fileUri: metadata.fileUri,
          mimeType: metadata.fileMimeType || 'application/pdf'
        }
      });
    }
    promptContents.push(blueprintPrompt);

    const response = await generateFn({
      contents: promptContents,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintResponseSchema,
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const rawLessons: any[] = Array.isArray(parsed.lessons) && parsed.lessons.length > 0 ? parsed.lessons : [];

    const normalizedDoc = normalizeForSearch(extractedText);
    const tocBoundary = detectTocBoundary(extractedText);

    // Step 1: Find start position for each detected lesson
    const locatedLessons: Array<{
      raw: any;
      startOffset: number;
    }> = [];

    let currentOffset = tocBoundary;
    for (let i = 0; i < rawLessons.length; i++) {
      const l = rawLessons[i];
      let pos = findLessonStartPosition(l, extractedText, normalizedDoc, currentOffset, tocBoundary);
      
      // If not found after current offset, search from beginning of body
      if (pos === -1 && currentOffset > tocBoundary) {
        pos = findLessonStartPosition(l, extractedText, normalizedDoc, tocBoundary, tocBoundary);
      }

      // If still not found, estimate proportionally
      if (pos === -1) {
        pos = Math.floor((i / rawLessons.length) * extractedText.length);
      }

      locatedLessons.push({
        raw: l,
        startOffset: pos
      });

      if (pos > currentOffset) {
        currentOffset = pos;
      }
    }

    // Step 2: STRICTLY SORT all lessons by their actual appearance offset in the document
    locatedLessons.sort((a, b) => a.startOffset - b.startOffset);

    // Step 3: Slice contiguous, complete raw text slices for each lesson
    const mappedLessons: SyllabusLessonBlueprint[] = locatedLessons.map((item, idx) => {
      const l = item.raw;
      const startPos = Math.max(0, item.startOffset);
      const nextItem = locatedLessons[idx + 1];
      const endPos = nextItem ? Math.max(startPos + 100, nextItem.startOffset) : extractedText.length;

      let lessonRawText = extractedText.substring(startPos, endPos).trim();

      // Ensure snippet is sufficiently comprehensive (at least 150 chars or proportional slice)
      if (lessonRawText.length < 150) {
        const sliceSize = Math.floor(extractedText.length / Math.max(1, locatedLessons.length));
        const pStart = idx * sliceSize;
        const pEnd = idx === locatedLessons.length - 1 ? extractedText.length : (idx + 1) * sliceSize;
        lessonRawText = extractedText.substring(pStart, pEnd).trim();
      }

      return {
        lesson_order: idx + 1, // Re-assign strict 1, 2, 3... order
        lesson_title: (l.lesson_title || `الدرس ${idx + 1}`).trim(),
        unit_title: l.unit_title || undefined,
        character_start: startPos,
        character_end: endPos,
        sub_topics: Array.isArray(l.sub_topics) && l.sub_topics.length > 0 ? l.sub_topics : ["الشرح والمفاهيم", "التطبيقات والتدريبات"],
        key_terms: Array.isArray(l.key_terms) ? l.key_terms : [],
        raw_text_snippet: lessonRawText,
        status: "pending"
      };
    });

    console.log(`[Document Blueprint] Successfully discovered and sequentially ordered ${mappedLessons.length} lessons from page 1 to end.`);

    return {
      book_title: (parsed.book_title || metadata.fileName || "المقرر التعليمي المعتمد").trim(),
      total_lessons: mappedLessons.length,
      detected_units: Array.isArray(parsed.detected_units) ? parsed.detected_units : [],
      lessons: mappedLessons,
      raw_full_text: extractedText,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn("[Document Blueprint] Extraction error, generating heuristic sequential blueprint:", err);

    // Heuristic Fallback based on text size (e.g. 1 lesson per ~4,500 chars)
    const chunkSize = 4500;
    const totalCount = Math.max(1, Math.min(15, Math.ceil(extractedText.length / chunkSize)));
    const heuristicLessons: SyllabusLessonBlueprint[] = [];

    for (let i = 0; i < totalCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(extractedText.length, (i + 1) * chunkSize);
      const textSlice = extractedText.substring(start, end).trim();
      
      heuristicLessons.push({
        lesson_order: i + 1,
        lesson_title: `الدرس ${i + 1}: ${metadata.fileName || 'الموضوع التعليمي'} (الجزء ${i + 1})`,
        character_start: start,
        character_end: end,
        sub_topics: ["المفاهيم والنصوص الأساسية", "المفردات والشروحات", "التمارين والتقويم"],
        raw_text_snippet: textSlice,
        status: "pending"
      });
    }

    return {
      book_title: metadata.fileName || "المقرر التعليمي المعتمد",
      total_lessons: heuristicLessons.length,
      detected_units: ["الوحدة الأولى"],
      lessons: heuristicLessons,
      raw_full_text: extractedText,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * Returns the next batch of pending lessons to generate
 */
export function getPendingLessons(
  blueprint: DocumentSyllabusBlueprint,
  batchSize: number = 4
): SyllabusLessonBlueprint[] {
  if (!blueprint || !Array.isArray(blueprint.lessons)) return [];
  return blueprint.lessons
    .filter(l => l.status === "pending")
    .slice(0, batchSize);
}

/**
 * Marks given lesson orders as completed in the blueprint
 */
export function markLessonsCompleted(
  blueprint: DocumentSyllabusBlueprint,
  completedOrders: number[]
): DocumentSyllabusBlueprint {
  const completedSet = new Set(completedOrders);
  return {
    ...blueprint,
    lessons: blueprint.lessons.map(l =>
      completedSet.has(l.lesson_order) ? { ...l, status: "completed" } : l
    )
  };
}
