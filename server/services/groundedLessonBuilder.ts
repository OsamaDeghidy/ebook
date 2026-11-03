import { SyllabusLessonBlueprint } from "./documentBlueprint";
import { TeacherPersona } from "./teacherPersonas";

/**
 * Builds the Master Grounded Prompt for a specific batch of lessons
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

  // Auto-detect language with explicit preference & taxonomy awareness
  const isExplicitArabic = language === 'ar' || academic_system === 'general_arabic' || academic_system === 'technical';
  const isExplicitEnglish = language === 'en' || academic_system?.includes('international') || academic_system === 'general_languages';
  const combinedText = `${bookTitle} ${lessons.map(l => `${l.lesson_title} ${l.raw_text_snippet}`).join(' ')}`;
  const hasArabicChar = /[\u0600-\u06FF]/.test(combinedText);

  const isArabic = isExplicitArabic || (!isExplicitEnglish && hasArabicChar);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic (اللغة العربية الفصحى). Output all chapter titles, content explanations, vocabulary, laws, summaries, quizzes, and flashcards STRICTLY in Arabic. ZERO English translation or English language paragraphs! (Western numbers 0-9 and LaTeX symbols are allowed only for math/formulas).`
    : `TARGET LANGUAGE: English (or match source). Output all titles, content, summaries, quizzes, and flashcards strictly in English with ZERO Arabic text.`;

  const metaLower = `${bookTitle} ${category || ''} ${grade_level || ''} ${lessons.map(l => l.lesson_title).join(' ')}`.toLowerCase();
  
  // Track 1: Early Childhood / Kindergarten / Foundation (KG1, KG2, Primary 1-3, nursery, letters, phonics)
  const isKindergarten = /kg|kindergarten|رياض\s*الأطفال|روضة|حضانة|تمهيدي|أولى\s*ابتدائي|الصف\s*الأول\s*الابتدائي|الثاني\s*الابتدائي|الثالث\s*الابتدائي|تأسيس|حروف\s|أبجدية|حرف\s/.test(metaLower);

  // Track 2: STEM (Mathematics, Physics, Chemistry, Engineering, Computer Science coding)
  const isStem = !isKindergarten && /رياضيات|ماث|math|فيزياء|physics|كيمياء|chemistry|جبر|هندسة|تفاضل|تكامل|حساب|علوم|science|خوارزمي|برمجة|احصاء|إحصاء/.test(metaLower);

  let pedagogicalStructurePrompt = "";

  if (isKindergarten) {
    pedagogicalStructurePrompt = `
5. MANDATORY EARLY CHILDHOOD PEDAGOGICAL STRUCTURE (STRICT BAN ON MATH/EXAM JARGON):
   🚫 ABSOLUTE PROHIBITION of: ("القانون الحاكم", "المعطيات والتحويلات", "التعويض الجبري", "خطوات التعويض والتحليل", "مصيدة الامتحان", "المسائل الثلاثية", "منظومة المسائل").
   This course is for YOUNG CHILDREN / KINDERGARTEN (رياض الأطفال والتأسيس)!
   The tone must be warm, enthusiastic, engaging, and rich in sensory imagination.

   Each chapter's 'content' field MUST strictly follow this child-friendly structure:
   - \`## [اسم الدرس أو الحرف الأصلي]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض نص الدرس أو الحرف أو الأنشطة كما وردت في المذكرة المستخرجة بدقة وأمانة دون اختصار)

   - \`### 🎈 حكاية ممتعة واكتشاف بصري\`
     (قصة طفولية واقعية ومشوقة جداً تدور حول الحرف أو المفهوم من بيئة الطفل، غنية بالإيموجي الملونة والمواقف المحببة)

   - \`### 🔤 أصوات الحروف وحركاتها السحرية\`
     (نطق الحرف بالحركات الأربع: الفتحة والضمة والكسرة والسكون، مع أمثلة كلمات واضحة مشكولة بالكامل 100% ومقرونة بإيموجي مميز لكل كلمة:
      * الفَتْحَة (أَ): أَسَدٌ 🦁، أَرْنَبٌ 🐇
      * الضَّمَّة (أُ): أُذُنٌ 👂، أُمِّي 👩
      * الكَسْرَة (إِ): إِبْرِيقٌ 🫖، إِبْرَةٌ 🪡
      * السُّكُون (أْ): رَأْسٌ 🧑، فَأْسٌ 🪓)

   - \`### 🎮 ألعاب وتحديات بصرية للعباقرة الصغار\`
     (ألعاب تفاعلية طفولية خفيفة بدون مصطلحات جافة:
      1. لعبة "أين يختبئ الحرف؟": ابحث عن الحرف في الكلمات التالية وضع حوله دائرة ملونة.
      2. لعبة "صل الصوت بالصورة": ربط صوت الحرف بالصورة المناسبة.
      3. لعبة "صائد الكلمات اللذيذة": مساعدة الشخصية في جمع الكلمات التي تبدأ بالحرف)

   - \`### 🌟 همسة ذهبية للبطل الصغير\`
     (تشجيع تربوي محبب وجميل للطفل، مع نصيحة ذكية للتفريق اللطيف بين الأصوات، مثل الفرق بين صوت الألف المفتوحة والمضمومة، دون أي ذكر لكلمة امتحان أو فخ).
`;
  } else if (isStem) {
    pedagogicalStructurePrompt = `
5. FIVE MANDATORY PEDAGOGICAL PILLARS (STEM ACADEMIC RIGOR & ZERO LAZINESS):
   Each chapter's 'content' field MUST be an extensive, master-crafted educational chapter in GitHub Flavored Markdown:
   - \`## [اسم الدرس الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض الفقرة أو النص الأصلي الكامل المستخرج من المذكرة دون حذف أو اختصار، ووضعه داخل صندوق اقتباس موثق)

   - \`### 🔍 التشريح العلمي وتفكيك المعنى\`
     (كتابة فقرتين كاملتين ودسمتين تشرحان "لماذا وكيف" بالتفصيل والبرهان لكل فكرة ومفهوم فرعي في الدرس، مع ربطها بالأسباب والعلل والواقع)

   - \`### 📚 معجم القواعد والمصطلحات الحاكمة\`
     (تفكيك دقيق لكافة المصطلحات والقوانين مع ذكر وحدات القياس والشروط الرياضية الحاكمة)

   - \`### 📐 المسائل التدريبية والحلول النموذجية (منظومة المسائل الثلاثية الإلزامية المتدرجة)\`
      (إلزامي صارم: تقديم 3 مسائل نموذجية متدرجة تغطي صلب الدرس:
       * المسألة 1 (التأسيسية المباشرة): لتثبيت القاعدة وقراءة الرموز والتطبيق الأولي المباشر.
       * المسألة 2 (الربط والتحليل): فكرة مركبة تجمع بين مفهومين في الدرس أو حالة ربط بين متغيرين.
       * المسألة 3 (فخ الامتحان وسر التفوق): مسألة تحتوي على مغالطة شائعة أو حالة خاصة يقع فيها أغلب الطلاب.

       كل مسألة من المسائل الثلاث تبدأ بفقرة:
       \`#### 💭 كيف فكرنا في الحل؟ ولماذا اخترنا هذا القانون تحديداً؟\`
       يتبعها فوراً الهيكل الرباعي الصارم للحل:
       1. المعطيات والتحويلات: استخراج المتغيرات وضبط الوحدات للنظام الدولي SI.
       2. القانون الحاكم: كتابة الصيغة الرياضية بترميز LaTeX نقي.
       3. خطوات التعويض والتحليل الجبري: تعويض رقمي مفصل خطوة بخطوة.
       4. الناتج النهائي والتمييز: القيمة النهائية بوضوح مع تمييز وحدة القياس المناسبة).

   - \`### 💡 مصيدة الامتحان والقاعدة الذهبية\`
     (توضيح الفخ الذي يقع فيه معظم الطلاب في هذا الدرس تحديداً وكيف يتجنبه ليضمن الدرجة النهائية، مع كبسولة ذهبية للحل السريع).
`;
  } else {
    pedagogicalStructurePrompt = `
5. FIVE MANDATORY PEDAGOGICAL PILLARS (HUMANITIES, LITERATURE, RELIGION & SOCIAL STUDIES):
   Each chapter's 'content' field MUST be an extensive, master-crafted educational chapter in GitHub Flavored Markdown:
   - \`## [اسم الدرس أو النص القرائي/الشرعي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض الآيات الكريمة أو النص القرائي أو الفقرة التاريخية/الفكرية الكاملة المستخرجة من المذكرة)

   - \`### 🔍 تفكيك الأفكار والتحليل السياقي والمفاهيمي\`
     (تحليل سياقي وموضوعي متكامل ومفصل: شرح أسباب النزول أو الظروف التاريخية أو البعد الفكري، مع تفكيك دلالات التراكيب والمعاني الجوهرية بأسلوب تربوي ممتع)

   - \`### 📚 معجم المفردات والمفاهيم اللغوية والفكرية\`
     (جدول غني بالكلمات والتراكيب الجديدة ومعانيها في سياقها، مع ذكر المرادفات والأضداد، وتوضيح المصطلحات المفتاحية)

   - \`### 🎯 التدريبات التطبيقية وأسئلة الفهم الاستيعابي المتدرجة\`
     * التدريب 1 (الفهم المباشر والمعنى الإجمالي): أسئلة استخراجية تثبت فهم النص وظواهره.
     * التدريب 2 (التحليل والاستنتاج والعبر): أسئلة ربط وتفكير تتناول الدلالات غير المباشرة والحكمة المستفادة.
     * التدريب 3 (التذوق البلاغي والتفكير الناقد): إبراز الجماليات البلاغية والأساليب أو المقارنات الفكرية، مع تقديم الإجابة النموذجية التربوية المفصلة لكل سؤال.

   - \`### 💡 الدروس المستفادة والكبسولة التوجيهية الذهبية\`
     (القيم الأخلاقية، المبادئ التوجيهية، والتطبيقات الواقعية في حياة الطالب، مع التنبيه على الفروق اللغوية الدقيقة).
`;
  }

  const lessonsContext = lessons.map((l) => `
===================================================================
📖 LESSON ${l.lesson_order}: "${l.lesson_title}"
${l.unit_title ? `Unit: "${l.unit_title}"` : ''}
Internal Sub-Topics to thoroughly explain:
${(l.sub_topics || []).map(t => `  - ${t}`).join('\n')}

${l.key_terms && l.key_terms.length > 0 ? `Key Terms & Rules in Source:\n${l.key_terms.map(k => `  - ${k.term}: ${k.definition}`).join('\n')}` : ''}

AUTHENTIC SOURCE TEXTBOOK / BOOKLET SLICE FOR LESSON ${l.lesson_order}:
"""
${l.raw_text_snippet.substring(0, 35000)}
"""
===================================================================
`).join('\n\n');

  return `
${persona.pedagogicalSystemPrompt}

🎯 MASTER GROUNDED CURRICULUM SYNTHESIS MISSION:
You are generating ${lessons.length} distinct, deeply grounded interactive learning chapters for the course: "${bookTitle}".
Target Audience / Grade: "${grade_level || 'عام'}" - Category: "${category || 'academic_curriculum'}" - Term: "${semester || 'الفصل الدراسي الأول'}"
Teacher Persona: "${persona.name} (${persona.title})"

SOURCE MATERIAL FOR THIS BATCH:
${lessonsContext}

🚨 CRITICAL MANDATORY GENERATION RULES (P0):
${pedagogicalGuardrails ? `${pedagogicalGuardrails}\n` : ''}
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE (P0):
   - Math expressions MUST use symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words (NEVER write 'أكبر من' in math; use '>').
   - Equations and formulas MUST be formatted in LaTeX: $...$ for inline, $$...$$ for block.
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. 🧹 CLEAN CONTENT & ARTIFACT STRIPPING (P0):
   - 🚫 STRIP parenthetical exam notes and year tags (e.g. "(دور أول 2022)" or "(امتحان 2021)").
   - 🚫 STRIP OCR bullet symbols and scanning artifacts (▲, ▼, ◆, ◇, ■, ★).
   - 🚫 STRIP standalone page numbers (e.g. "ص 15", "صفحة 24", "[12]").
   - 🚫 STRIP redundant English translations in parentheses inside Arabic text paragraphs.

4. STRICT ANCHORING TO SOURCE TEXT (NO SUPERFICIAL HALLUCINATIONS):
   - Every single chapter MUST be built directly from its dedicated source text slice above.
   - Do NOT just look at the title and invent generic web content. You MUST include the actual explanations, reading passages, poems, vocabulary tables, scientific laws, and worked examples present in the booklet slice!

${pedagogicalStructurePrompt}

6. NO DASHED MARKDOWN TABLES:
   - 🚫 NEVER use markdown pipe tables with dashed rows (\`| ---: |\`). Format tables as clean text cards or bulleted key-value lists.

7. ACCURATE BLOOM QUIZZES & GROUNDED FLASHCARDS:
   - Generate 4 to 6 diagnostic quiz questions per chapter directly referencing the source text.
   - For each quiz question, provide the cognitive level (تذكر، فهم، تطبيق، تحليل) and a detailed explanation of why the correct answer is true.
   - Generate 4 to 6 high-rigor flashcards per chapter:
     * Front: Authentic curriculum concept with clear Tashkeel.
     * Back: Rigorous definition or explanation.
`;
}
