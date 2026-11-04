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

  // Track 5: Pure Mathematics & Geometry
  const isMath = !isKindergarten && !isComputerScience && !isArabicOrLanguages && !isSocialStudies && /رياضيات|ماث|math|جبر|هندسة|تفاضل|تكامل|حساب|احصاء|إحصاء|مثلثات|trigonometry|algebra|geometry|calculus/.test(metaLower);

  // Track 6: Natural Sciences (Physics, Chemistry, Biology, General Science)
  const isScience = !isKindergarten && !isComputerScience && !isArabicOrLanguages && !isSocialStudies && !isMath && /علوم|science|فيزياء|physics|كيمياء|chemistry|أحياء|biology|جيولوجيا|geology/.test(metaLower);

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
  } else if (isMath) {
    pedagogicalStructurePrompt = `
5. MANDATORY MATHEMATICS & RIGOROUS PROBLEM-SOLVING ARCHITECTURE:
   🚫 STRICT BAN on trivial toy math ($x=3, y=5, x+y=5$) for Prep and Secondary stages!
   All problems, definitions, and theorems MUST reflect the authentic academic grade level (${grade_level || 'Prep/Sec'}) and be directly grounded in the provided source text.

   Each chapter's 'content' field MUST strictly follow this structured math architecture:
   - \`## [اسم الدرس الرياضي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض التعريفات أو النظريات أو المسائل كما وردت في المذكرة المرفوعة بدقة وأمانة)

   - \`### 🔍 المفهوم الرياضي والتأسيس المنطقي\`
     (تفكيك المعنى الرياضي بعمق: لماذا وضع العلماء هذا المفهوم، وكيف نربطه بالمنطق والأشكال الهندسية أو التطبيقات الحياتية)

   - \`### 📐 النظريات والقوانين الحاكمة (Theorems & Mathematical Laws)\`
     (صياغة النظريات والقوانين بترميز LaTeX نقي واضح داخل كتل رياضية $...$ أو $$...$$ مع ذكر الشروط والقيود الرياضية بدقة)

   - \`### 🎯 منظومة المسائل المتدرجة والحلول النموذجية (تأسيس -> ربط -> مهارات عليا)\`
     (إلزامي صارم: تقديم 3 مسائل رياضية نموذجية حقيقية مناسبة لمرحلة ${grade_level || 'الإعدادي والثانوي'}:
      * المسألة 1 (تطبيق مباشر لتثبيت القاعدة): قياس فهم التعريف أو القانون.
      * المسألة 2 (مسألة ربط وتفكير مركب): دمج قاعدتين أو خطوات جبرية وهندسية متتالية.
      * المسألة 3 (مسألة مهارات عليا وفخ امتحاني): حالة خاصة تتطلب انتباهاً رياضياً دقيقاً مثل القسمة على صفر أو شروط المجالات والجذور.

      كل مسألة تتبع هذا الهيكل المنهجي الصارم:
      1. المعطيات والمطلوب (Given & Required).
      2. القانون أو النظرية المستخدمة (Theorems / Rules).
      3. خطوات الحل والبرهان الجبري/الهندسي خطوة بخطوة بالتفصيل.
      4. الناتج النهائي مع التمييز).

   - \`### 💡 كبسولة سر التفوق ومصائد الامتحانات الرياضية\`
     (أشهر الأخطاء الشائعة التي يقع فيها الطلاب في هذا الدرس: مثل إشارات السالب والموجب، إهمال أحد الحلين في المعادلات التربيعية، أو مغالطات الفترات والجذور).
`;
  } else if (isScience) {
    pedagogicalStructurePrompt = `
5. MANDATORY NATURAL SCIENCES ARCHITECTURE (PHYSICS, CHEMISTRY, BIOLOGY):
   🚫 STRICT BAN on fabricated algebraic equations (like $A \\times B = C$ or meaningless numbers) on descriptive chemical or biological topics!
   Natural science is rooted in: PHENOMENA, LAB EXPERIMENTS, OBSERVATIONS, AND REAL CHEMICAL/PHYSICAL EQUATIONS.

   Each chapter's 'content' field MUST strictly follow this empirical scientific structure:
   - \`## [اسم الدرس العلمي الأصلي المعتمد]\`

   - \`> ### 📜 نص المذكرة الأصلي المعتمد\`
     (عرض النص أو التعريفات العلمية كما وردت في المذكرة المرفوعة دون تحريف)

   - \`### 🔍 التفسير والتشريح العلمي للظاهرة (Scientific Inquiry & Concepts)\`
     (تفكيك علمي رصين يجيب عن: ماذا يحدث؟ ولماذا يحدث؟ مع ذكر أسباب الظاهرة الطبيعية أو التفاعل الكيميائي)

   - \`### 🧪 التجارب المعملية والمشاهدات التطبيقية (Hands-on Lab Experiments)\`
     (عرض تجربة عملية معملية حقيقية مقررة في المنهج):
     * **الأدوات والمواد:** (قائمة محددة بالأدوات المعملية).
     * **خطوات العمل:** (تسلسل إجرائي علمي واضح).
     * **المشاهدة والملاحظة:** (ماذا يرى الطالب بالعين المجردة أو التغير الحادث).
     * **الاستنتاج والمعادلة:** (القاعدة العلمية المستنبطة أو المعادلة الكيميائية الرمزية الموزونة مثل: $2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow$).

   - \`### 📊 التطبيقات الحسابية والقوانين الفيزيائية\`
     (فقط إذا كان الدرس يحتوي على قوانين فيزيائية واقعية مثل: السرعة، الكثافة، الضغط، التردد، العجلة - مع تطبيق قانون فيزيائي حقيقي بوحدات النظام الدولي SI، وممنوع منعاً باتاً اختراع قوانين وهمية).

   - \`### ⚡ تصحيح المفاهيم العلمية المغلوطة وفخاخ الامتحانات\`
     (توضيح اللبس الشائع بين المفاهيم: مثل الفرق بين الوزن والكتلة، أو التبخر والغليان، مع تلخيص مركّز لأهم علل وأسئلة 'علل لما يأتي' الخاصة بهذا الدرس).
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
