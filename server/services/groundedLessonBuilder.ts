import { SyllabusLessonBlueprint } from "./documentBlueprint";
import { TeacherPersona } from "./teacherPersonas";

/**
 * Builds the Master Grounded Prompt for High-Fidelity Faithful Document Transcription (Digital Twin)
 * Strips headers, footers, exam year tags, and exercise banks, producing pure authentic booklet text.
 */
export function buildGroundedBatchPrompt(params: {
  lessons: SyllabusLessonBlueprint[];
  persona: TeacherPersona;
  bookTitle: string;
  grade_level?: string;
  category?: string;
  semester?: string;
  language?: string;
  academic_system?: string;
  pedagogicalGuardrails?: string;
}): string {
  const { lessons, persona, bookTitle, grade_level, category, semester, language, academic_system, pedagogicalGuardrails } = params;

  // Auto-detect language
  const isExplicitArabic = language === 'ar' || academic_system === 'general_arabic' || academic_system === 'technical';
  const isExplicitEnglish = language === 'en' || academic_system?.includes('international') || academic_system === 'general_languages';
  const combinedText = `${bookTitle} ${lessons.map(l => `${l.lesson_title} ${l.raw_text_snippet}`).join(' ')}`;
  const hasArabicChar = /[\u0600-\u06FF]/.test(combinedText);
  const isArabic = isExplicitArabic || (!isExplicitEnglish && hasArabicChar);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic (اللغة العربية الفصحى). All titles, headings, explanations, tables, and audio scripts MUST be in Arabic. (Western digits 0-9 and LaTeX symbols are used for math formulas).`
    : `TARGET LANGUAGE: English (or match source). All titles, content, tables, and scripts must match source language.`;

  const lessonsContext = lessons.map((l) => `
===================================================================
📖 LESSON ${l.lesson_order}: "${l.lesson_title}"
${l.unit_title ? `Unit: "${l.unit_title}"` : ''}

AUTHENTIC SOURCE TEXTBOOK / BOOKLET PAGES FOR LESSON ${l.lesson_order}:
"""
${l.raw_text_snippet.substring(0, 35000)}
"""
===================================================================
`).join('\n\n');

  return `
${persona.pedagogicalSystemPrompt}

🎯 HIGH-FIDELITY DOCUMENT TRANSCRIPTION & AUTHENTIC DIGITAL TWIN (المحرر والموثق الرقمي الأمين):
You are transcribing and digitizing ${lessons.length} lesson(s) directly from the uploaded booklet for the curriculum: "${bookTitle}".
Target Audience / Grade: "${grade_level || 'عام'}" - Category: "${category || 'academic_curriculum'}"

SOURCE BOOKLET SLICES:
${lessonsContext}

🚨 CRITICAL MANDATORY TRANSCRIPTION RULES (P0):
${pedagogicalGuardrails ? `${pedagogicalGuardrails}\n` : ''}
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 🚫 STRICT PROHIBITION ON ARTIFICIAL BOILERPLATE & PEDAGOGICAL FABRICATIONS:
   - 🚫 DO NOT invent fake UI menus, buttons, or simulated paths (e.g. NEVER write "افتح قائمة File ثم اضغط New Project" or "ابدأ > كافة البرامج > الحاسبة" or create fake code blocks for buttons).
   - 🚫 DO NOT generate artificial boilerplate wrappers like:
     * "> ### 📜 نص المذكرة الأصلي المعتمد (المصدر النصي الموثق)"
     * "### 🔍 التشريح المفاهيمي والأسس الهندسية"
     * "### 💡 كبسولة سر التفوق"
     * "### 🎯 بنك الأسئلة والمسائل"
   - The generated 'content' field IS THE PURE TRANSCRIPTION OF THE BOOKLET ITSELF!

3. 🧹 AUTOMATIC RUNNING HEADER & FOOTER STRIPPING:
   - 🚫 STRIP all running headers at the top of pages (e.g. series titles "سلسلة ...", teacher name "الأستاذ ...", teacher phone numbers, publication slogans).
   - 🚫 STRIP all running footers at the bottom of pages (e.g. standalone page numbers "ص 15", "صفحة 24", "[12]", printing press credits, contact details).
   - 🚫 STRIP OCR scanning bullet artifacts (▲, ▼, ◆, ◇, ■, ★).
   - 🚫 STRIP parenthetical exam notes and year tags (e.g. "(دور أول 2022)" or "(امتحان 2021)").
   - 🚫 STRIP redundant English translations in parentheses inside Arabic prose if they clutter reading.

4. 🚫 EXCLUDE EXERCISE BANKS & END-OF-LESSON QUESTIONS (تلاشي بنك الأسئلة والتمارين):
   - Transcribe ONLY the explanatory lesson content, rules, concepts, definitions, and worked examples.
   - STOP transcribing as soon as an end-of-lesson exercise section appears (e.g. "تمارين الدرس", "تدريبات الفصل", "واجب منزلي", "اختبر نفسك", "أسئلة للمناقشة"). DO NOT include these test questions in the reading text!

5. 📐 STRUCTURE, TABLES & MATHEMATICAL NOTATION:
   - Preserve original headings and subheadings naturally with Markdown (##, ###).
   - Render genuine concepts and definitions clearly (e.g. "**المفهوم:** [التعريف]").
   - Preserve genuine tables in the booklet by transcribing them as clean, properly aligned GitHub Flavored Markdown pipe tables.
   - Format all mathematical and chemical formulas in LaTeX:
     * Inline formulas MUST strictly use single dollar signs: $ ... $ (NEVER put double $$ inline with text).
     * Block / standalone display formulas MUST be isolated on their own lines with blank lines:
       $$
       X \\cup Y = \\{x \\mid x \\in X \\lor x \\in Y\\}
       $$
     * Numbers in math expressions must use Western digits (0-9).

6. 🎙️ SPOKEN NARRATION SCRIPT (audioNarration):
   - You MUST generate an 'audioNarration' field for each chapter.
   - This field is the verbatim/flowing spoken version of the transcribed lesson text for audio narration (TTS).
   - It must be in natural, fluent Arabic.
   - Transliterate all math, scientific, and technical terms into their clear spoken Arabic words (e.g. pronounce $X \\cup Y$ as "سين اتحاد صاد", $\\sqrt{x}$ as "الجذر التربيعي لـ س", and Half Adder as "نصف الجامع").
   - ZERO markdown symbols, hashes, or code brackets in this narration field.
`;
}
