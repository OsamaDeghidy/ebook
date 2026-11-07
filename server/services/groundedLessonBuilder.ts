import { SyllabusLessonBlueprint } from "./documentBlueprint";
import { TeacherPersona } from "./teacherPersonas";

/**
 * Builds the Master Grounded Prompt for High-Fidelity Faithful Document Transcription & Deep Pedagogical Enrichment.
 * Combines authentic booklet text with thorough pedagogical depth without artificial fluff, comparison tables, or robot preambles.
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
    ? `TARGET LANGUAGE: Modern Standard Arabic (اللغة العربية الفصحى). All titles, headings, explanations, and audio scripts MUST be in Arabic. (Western digits 0-9 and LaTeX symbols are used for math formulas).`
    : `TARGET LANGUAGE: English (or match source). All titles, content, and scripts must match source language.`;

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

🎯 HIGH-FIDELITY PEDAGOGICAL DIGITIZATION (منظومة التحويل والتدريس الرقمي المعتمد):
You are generating exhaustive, high-yield educational lessons directly grounded in the uploaded booklet for: "${bookTitle}".
Target Audience / Grade: "${grade_level || 'عام'}" - Category: "${category || 'academic_curriculum'}"

SOURCE BOOKLET SLICES:
${lessonsContext}

🚨 CRITICAL MANDATORY RULES (P0):
${pedagogicalGuardrails ? `${pedagogicalGuardrails}\n` : ''}
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 🚫 STRICT PROHIBITION ON ROBOT PREAMBLES & META-TALK:
   - 🚫 NEVER begin the content with AI self-introductions or conversational greetings (e.g. NEVER write "بصفتي المحرر...", "أقدم لك...", "إليك محتوى الدرس...", "بناءً على التوجيهات...").
   - Output ONLY clean, polished Markdown starting directly with the lesson content or main title.
   - 🚫 DO NOT leave solitary dot, bullet, or stray punctuation lines (e.g., "." or "•" on a line by itself).

3. 🚫 PROHIBITION ON DASHES & SEPARATOR LINES BETWEEN WORDS:
   - 🚫 NEVER use dashes ("—", "–", "-", "/") between words, definitions, or vocabulary (e.g. NEVER write "البروتون — موجب" or "الكلمة - معناها").
   - Instead, use bold titles with parentheses or clean spacing:
     * ✅ **البروتون:** (موجب الشحنة الكهربية، وكتلته 1 u).
     * ✅ **الاستكشاف:** (البحث والتنقيب عن الحقائق الجديدة).

4. 🚫 STRICT BAN ON COMPARISON TABLES — USE CONCEPT CARDS INSTEAD:
   - 🚫 DO NOT generate comparison tables or pipe markdown tables for comparisons (جداول المقارنة)!
   - Present ALL comparisons, properties, and core elements as independent structured Concept Blocks (مفهوم وشرحه):
     ### 🔹 [المفهوم / العنصر الأول]
     **الشرح والخصائص:** تفصيل المفهوم وشرحه كاملاً...

     ### 🔹 [المفهوم / العنصر الثاني]
     **الشرح والخصائص:** تفصيل المفهوم وشرحه كاملاً...

5. 📏 LESSON DEPTH & EXHAUSTIVENESS (حظر التلخيص المخل لـ 6-8 صفحات إلى فقرة عابرة):
   - 🚫 FORBIDDEN: NEVER compress or summarize a 6 to 8 page lesson into a tiny paragraph! This is a complete educational failure.
   - You MUST thoroughly teach and explain EVERY single concept, experiment, law, observation, and derivation found across the source booklet pages without omission:
     * **المفاهيم والنظريات:** تفكيك كل مفهوم، وبيان علّة التسمية، وتفاصيل الاكتشاف (مثل نموذج رذرفورد، نموذج بور، شحنة النواة الموجبة، شحنة الإلكترونات السالبة، والكتل النسبية).
     * **التجارب والأنشطة العملية:** ذكر اسم التجربة، الأدوات، خطوات العمل، الملاحظة الدقيقة، والاستنتاج العلمي المستفاد.
     * **القوانين والتطبيقات الرياضية:** ذكر نص القانون، المعادلة بـ LaTeX ($2n^2$)، المعنى الفيزيائي لكل رمز، وحل أمثلة ومسائل رقمية متدرجة (المعطيات -> القانون -> التعويض -> الناتج مع وحدة القياس).
     * **التعليلات العلمية ("علل لما يأتي"):** شرح أسباب الظواهر (مثل: علل الذرة متعادلة كهربياً، علل لا تنطبق العلاقة $2n^2$ على المستويات الأعلى من الرابع).

6. 🚫 PROHIBITION ON EXERCISE BLANKS ("...........") & FILL-IN-THE-BLANKS:
   - When the booklet contains student worksheets or activities with dotted lines ("...........", "___", "أكمل ما يأتي:"), NEVER leave dots or blank lines!
   - You MUST solve, explain, and state the complete scientific fact in full clear educational sentences:
     * ❌ WRONG: "مستوى الطاقة الأول K: ....................."
     * ✅ CORRECT: "• **مستوى الطاقة الأول ($K$):** يحمل رقم ($n = 1$)، ويتشبع بـ **إلكترونين فقط ($2$)** تطبيقاً للعلاقة الرياضية ($2n^2 = 2(1)^2 = 2$)."
   - If a question appears in an activity (e.g. "ماذا يحدث لطاقة الإلكترون كلما ابتعد عن النواة؟"), provide the detailed scientific answer and explanation:
     "**تزداد طاقة الإلكترون كلما ابتعد عن النواة، وبذلك يكون مستوى الطاقة الأقرب للنواة ($K$) هو الأقل طاقة، والمستوى الأبعد ($Q$) هو الأعلى طاقة.**"

7. 📚 RICH HUMANITIES & ARABIC STRUCTURE:
   For Arabic Language, Religious Studies & Humanities (اللغة العربية والتربية الإسلامية والدراسات):
   - **النص الأصلي كاملاً**: (النص القرائي الأصلي كاملاً / القصيدة الشعرية بكامل أبياتها مضبوطة بالشكل / نص الاستماع كاملاً دون بتر).
   - **المعجم اللغوي والمفردات**:
     عرض كل مفردة بأسلوب الأقواس الواضحة:
     • **[الكلمة]:** (المعنى في السياق) | (المضاد: كذا) | (الجمع: كذا)
   - **الشرح التحليلي المفصل للدرس**:
     شرح تربوي وافٍ وممتع يتناول الأفكار الرئيسة والفرعية، يفسر المعاني والدلالات التربوية بعمق ووضوح.
   - **التذوق البلاغي ومواطن الجمال** (للنصوص الشعرية والنثرية) أو **القواعد النحوية والتطبيقات الإعرابية مع أمثلة معربة** (لقواعد النحو والصرف).

8. 🚫 PROHIBITION ON ARTIFICIAL BOILERPLATE & FAKE MENUS:
   - 🚫 DO NOT invent fake UI menus, buttons, or simulated paths (e.g. NEVER write "افتح قائمة File ثم اضغط New Project" or "ابدأ > كافة البرامج > الحاسبة").
   - 🚫 DO NOT generate artificial card wrappers like:
     * "> ### 📜 نص المذكرة الأصلي المعتمد"
     * "### 🔍 التشريح المفاهيمي والأسس الهندسية"
     * "### 💡 كبسولة سر التفوق"
     * "### 🎯 بنك الأسئلة والمسائل"
   - Write natural, high-quality textbook Markdown with clean headings (##, ###).

9. 🧹 AUTOMATIC RUNNING HEADER & FOOTER STRIPPING:
   - 🚫 STRIP running headers at the top of pages (e.g. series titles "سلسلة ...", teacher name "الأستاذ ...", phone numbers).
   - 🚫 STRIP running footers at the bottom of pages (e.g. standalone page numbers "ص 15", "[12]", printing credits).
   - 🚫 STRIP OCR bullet artifacts (▲, ▼, ◆, ◇, ■, ★).
   - 🚫 STRIP parenthetical exam notes and year tags (e.g. "(دور أول 2022)" or "(امتحان 2021)").

10. 🚫 EXCLUDE EXERCISE BANKS & END-OF-LESSON HOMEWORK:
    - The lesson reading text is for STUDYING and UNDERSTANDING.
    - STOP as soon as an end-of-lesson exercise bank or homework appears (e.g. "تمارين الدرس", "تدريبات الفصل", "واجب منزلي", "اختبر نفسك"). DO NOT clutter the reading text with test questions.

11. 🎙️ SPOKEN NARRATION SCRIPT (audioNarration):
    - Generate an 'audioNarration' field for each chapter.
    - This field is the natural spoken version of the lesson text for audio narration (TTS).
    - Fluent, natural spoken Arabic without markdown hashes, code symbols, or dashes.
    - Transliterate all math/STEM notations into spoken Arabic words (e.g. $X \\cup Y$ -> "سين اتحاد صاد", $\\sqrt{x}$ -> "الجذر التربيعي لـ س").
`;
}
