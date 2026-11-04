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
  
  // Track 1: Early Childhood / Kindergarten / Foundation
  const isKindergarten = /kg|kindergarten|رياض\s*الأطفال|روضة|حضانة|تمهيدي|أولى\s*ابتدائي|الصف\s*الأول\s*الابتدائي|الثاني\s*الابتدائي|الثالث\s*الابتدائي|تأسيس|حروف\s|أبجدية|حرف\s/.test(metaLower);

  // Track 2: Computer Science, ICT & Programming
  const isComputerScience = !isKindergarten && /حاسب|كمبيوتر|تكنولوجيا\s*المعلومات|ict|برمجة|خوارزمي|ذكاء\s*اصطناعي|computer|coding|python|scratch|office|excel|access|شبكات|قواعد\s*بيانات|ويب|web/.test(metaLower);

  // Track 3: Arabic Language, English & Languages
  const isArabicOrLanguages = !isKindergarten && !isComputerScience && /عربي|لغة\s*عربية|نحو|بلاغة|نصوص|قراءة|أدب|إملاء|مطالعة|تعبير|صرف|english|french|deutsch|لغات|لغة\s*أجنبية/.test(metaLower);

  // Track 4: Social Studies, History & Geography
  const isSocialStudies = !isKindergarten && !isComputerScience && !isArabicOrLanguages && /دراسات|تاريخ|جغرافيا|social\s*studies|مواطنة|تربية\s*وطنية|جغرافية/.test(metaLower);

  // Track 5: STEM (Mathematics, Physics, Chemistry, Biology, General Science)
  const isStem = !isKindergarten && !isComputerScience && !isArabicOrLanguages && !isSocialStudies && /رياضيات|ماث|math|فيزياء|physics|كيمياء|chemistry|جبر|هندسة|تفاضل|تكامل|حساب|علوم|science|احصاء|إحصاء/.test(metaLower);

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
     (عرض نص الدرس أو الحرف أو الأنشطة كما وردت في المذكرة بدقة وأمانة دون اختصار)

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
      1. لعبة "أين يختبئ الحرف؟": ابحث عن الحرف في الكلمات التالية.
      2. لعبة "صل الصوت بالصورة": ربط صوت الحرف بالصورة المناسبة.
      3. لعبة "صائد الكلمات اللذيذة": مساعدة الشخصية في جمع الكلمات التي تبدأ بالحرف)

   - \`### 🌟 همسة ذهبية للبطل الصغير\`
     (تشجيع تربوي محبب وجميل للطفل، مع نصيحة ذكية للتفريق اللطيف بين الأصوات، دون أي ذكر لكلمة امتحان أو فخ).
`;
  } else if (isComputerScience) {
    pedagogicalStructurePrompt = `
5. MANDATORY COMPUTER SCIENCE & ICT PRACTICAL ARCHITECTURE (ZERO FLUFF & ZERO NARRATIVE ESSAYS):
   🚫 STRICT BAN on long, abstract narrative essays! Computer Science is a HANDS-ON, ACTION-ORIENTED discipline!
   Every concept must translate into actionable UI steps, commands, or code.

   Each chapter's 'content' field MUST strictly follow this practical lab structure:
   - \`## [اسم الدرس أو المهارة التقنية الأصلية المعتمدة]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض الخطوات والمفاهيم كما وردت في المذكرة بدقة وأمانة)

   - \`### 🎯 الهدف الإجرائي والبيئة البرمجية / التقنية\`
     (تحديد النتيجة العملية الملموسة التي سينجزها الطالب بنهاية الدرس + المتطلبات والبرامج المستخدمة: مثل Scratch, Python, HTML, Excel, Windows OS)

   - \`### 🛠️ المسار العملي التطبيقي (خطوة بخطوة بالصور والأزرار)\`
     (شرح خطوات التنفيذ بنظام القوائم والمسارات الدقيقة:
      1. افتح قائمة [File] ثم اختر [New Project].
      2. انقر على أداة [...] واضبط الخاصية [Value] على [...].
      3. اضغط على مفتاح الاختصار [Ctrl + S] للحفظ.
      مع إبراز المسارات الدقيقة في صناديق كود أو مسارات مميزة: \`القائمة > الخيار > الإجراء\`)

   - \`### 💻 شفرة الكود / الكتل البرمجية والأوامر (Interactive Code & Scripting)\`
     (عرض الأكواد البرمجية داخل Markdown Code Blocks منسقة مع تعليقات توضيحية بالعربية تشرح وظيفة كل سطر برمجياً):
     \`\`\`python
     # مثال عملي لتطبيق المفهوم في الدرس
     \`\`\`

   - \`### 🧪 معمل التحدي البرمجي (Hands-on Lab Exercise)\`
     (مشروع عملي مصغر يطلب من الطالب تنفيذه على جهازه فوراً لحل مشكلة واقعية، مع إرشادات التحقق الذاتي من صحة التنفيذ).

   - \`### ⚡ فخاخ تقنية وأخطاء تشغيلية شائعة (Troubleshooting Guide)\`
     (أشهر الأخطاء التي تظهر للمبتدئين: مثل أخطاء المسارات Syntax Errors، نسيان الحفظ، مشاكل الترميز UTF-8، وكيفية تصحيحها فوراً).
`;
  } else if (isArabicOrLanguages) {
    pedagogicalStructurePrompt = `
5. MANDATORY ARABIC LANGUAGE & LINGUISTIC PEDAGOGICAL STRUCTURE (TABULAR RIGOR & RHETORICAL ANALYSIS):
   🚫 STRICT BAN on mixing grammar with poetry or treating linguistic analysis as generic prose!
   Arabic requires tabular vocabulary, poetic stanzas formatting, and structural grammar parsing.

   Each chapter's 'content' field MUST follow this master linguistic structure:
   - \`## [اسم النص القرائي / الشعري أو الدرس النحوي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض النص الأدبي أو الآيات أو القواعد النحوية كما وردت في المذكرة الأصلية بالتشكيل الصحيح)

   - \`### 📖 معجم المفردات والتراكيب اللغوية (جدول المعاني والمضادات والجموع الإلزامي)\`
     (إلزامي: توليد جدول Markdown محكم ومشكول لجميع الكلمات الصعبة الواردة في الدرس):
     | الكلمة | معناها وسياقها | المضاد | المفرد / الجمع |
     | :--- | :--- | :--- | :--- |
     | ... | ... | ... | ... |

   - \`### 🎨 التذوق البلاغي والجمالي (للأدب والنصوص الشعرية والقرائية)\`
     (تحليل الجماليات البلاغية بأسلوب منهجي دقيق):
     * **الألوان البيانية:** التشبيه، الاستعارة، الكناية وسر جمالها (التوضيح، التشخيص، التجسيم).
     * **المحسنات البديعية:** الطباق، الجناس، السجع وأثرها الموسيقي.
     * **الأساليب ودلالاتها:** أساليب التوكيد، والأساليب الإنشائية (أمر، نهي، استفهام، نداء) والغرض البلاغي لكل أسلوب.

   - \`### 📐 القواعد النحوية والإعراب التطبيقي (منظومة التحليل النحوي)\`
     1. **الشاهد والمثال:** تقديم الجملة المحورية.
     2. **القاعدة المستنبطة:** صياغة القانون النحوي بوضوح تام.
     3. **جدول الإعراب النموذجي الإلزامي:**
        | الكلمة | الموقع الإعرابي | الحالة الإعرابية | العلامة والسبب |
        | :--- | :--- | :--- | :--- |
        | ... | ... | ... | ... |

   - \`### 🔥 فخ امتحاني وإعرابي شائع (مصيدة الدرجات النحوية)\`
     (تنبيه على اللبس بين الكلمات المتشابهة: مثل الفرق بين التمييز والحال، أو المفعول به والمفعول لأجله، أو كان الناقصة والتامة).
`;
  } else if (isSocialStudies) {
    pedagogicalStructurePrompt = `
5. MANDATORY SOCIAL STUDIES & GEOGRAPHY PEDAGOGICAL STRUCTURE (CAUSALITY NETWORK & EXAM REASONING):
   🚫 STRICT BAN on unorganized storytelling! Social studies is built on: CAUSALITY (الأسباب والنتائج) + GEOGRAPHICAL CONTEXT.

   Each chapter's 'content' field MUST strictly follow this analytical structure:
   - \`## [اسم الدرس التاريخي أو الجغرافي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض فقرة الدرس كما وردت في المذكرة المدرسية دون تحريف)

   - \`### 🗺️ الإطار المكاني والزماني (الموقع والخريطة / التسلسل التاريخي)\`
     (تحديد الموقع الجغرافي، الحدود، المظاهر الطبيعية، أو الخط الزمني لترتيب الأحداث التاريخية من الأقدم للأحدث)

   - \`### 🔗 شبكة السببية التاريخية والجغرافية (الأسباب -> الأحداث -> النتائج)\`
     (تفكيك الدرس في شكل متوالية تحليلية واضحة):
     * **المقدمات والأسباب:** العوامل الاقتصادية أو السياسية أو الطبيعية التي أدت للحدث أو الظاهرة.
     * **سير الأحداث والمحاور الرئيسية:** الوقائع والقرارات الفاصلة.
     * **الآثار والنتائج المترتبة:** التغيرات الدائمة على المجتمع أو البيئة.

   - \`### ❓ بنك أسئلة الفهم والتعليل الامتحاني الإلزامي (بم تفسر؟ / ما النتائج؟)\`
     (تقديم الإجابات النموذجية المفصلة للأنماط الامتحانية التالية):
     * **بم تفسر؟** (1-2 سؤال مع ذكر كافة الأسباب المعتمدة بالترقيم).
     * **ما النتائج المترتبة على؟** (1-2 سؤال مع توضيح الأثر المباشر والبعيد).
     * **دلل تاريخياً / جغرافياً على صحة العبارة:** (تقديم الدليل المادي الملموس).
     * **ماذا يحدث إذا؟** (تفكير افتراضي يقيس استيعاب القواعد).

   - \`### 💡 كبسولة التفوق والمقارنة الشاملة\`
     (مقارنة ملخصة في جدول Markdown بين المعركتين، أو الإقليمين المناخيين، أو الدولتين لتثبيت الحفظ ليلة الامتحان).
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
5. FIVE MANDATORY PEDAGOGICAL PILLARS (HUMANITIES, LITERATURE, RELIGION & PHILOSOPHY):
   Each chapter's 'content' field MUST be an extensive, master-crafted educational chapter in GitHub Flavored Markdown:
   - \`## [اسم الدرس أو النص القرائي/الشرعي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض الآيات الكريمة أو النص القرائي أو الفقرة الفكرية الكاملة المستخرجة من المذكرة)

   - \`### 🔍 تفكيك الأفكار والتحليل السياقي والمفاهيمي\`
     (تحليل سياقي وموضوعي متكامل ومفصل: شرح أسباب النزول أو البعد الفكري، مع تفكيك دلالات التراكيب والمعاني الجوهرية)

   - \`### 📚 معجم المفردات والمفاهيم اللغوية والفكرية\`
     (جدول غني بالكلمات والتراكيب الجديدة ومعانيها في سياقها، مع ذكر المرادفات والأضداد، وتوضيح المصطلحات المفتاحية)

   - \`### 🎯 التدريبات التطبيقية وأسئلة الفهم الاستيعابي المتدرجة\`
     * التدريب 1 (الفهم المباشر والمعنى الإجمالي): أسئلة استخراجية تثبت فهم النص.
     * التدريب 2 (التحليل والاستنتاج والعبر): أسئلة ربط وتفكير تتناول الدلالات غير المباشرة والحكمة المستفادة.
     * التدريب 3 (التدبر والتفكير الناقد): إبراز الجماليات والمقارنات الفكرية مع الإجابة النموذجية.

   - \`### 💡 الدروس المستفادة والكبسولة التوجيهية الذهبية\`
     (القيم الأخلاقية، المبادئ التوجيهية، والتطبيقات الواقعية في حياة الطالب).
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

6. CLEAN MARKDOWN TABLES FOR VOCABULARY & GRAMMAR:
   - When presenting vocabulary dictionaries, grammar parsing tables (جدول الإعراب), or feature comparisons, format them as clean, well-aligned GitHub Flavored Markdown pipe tables:
     | الكلمة | المعنى السياقي | المضاد | الجمع / المفرد |
     | :--- | :--- | :--- | :--- |

7. ACCURATE BLOOM QUIZZES & GROUNDED FLASHCARDS:
   - Generate 4 to 6 diagnostic quiz questions per chapter directly referencing the source text.
   - For each quiz question, provide the cognitive level (تذكر، فهم، تطبيق، تحليل) and a detailed explanation of why the correct answer is true.
   - Generate 4 to 6 high-rigor flashcards per chapter:
     * Front: Authentic curriculum concept with clear Tashkeel.
     * Back: Rigorous definition or explanation.
`;
}
