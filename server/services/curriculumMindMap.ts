export interface CurriculumMindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  chapterTitle?: string;
  chapterIndex?: number;
  level?: 'root' | 'unit' | 'chapter' | 'concept' | 'subtopic';
  description: string;
  keyTakeaway?: string;
  category?: string;
  color?: string;
  icon?: string;
  prerequisiteId?: string;
}

export interface CurriculumLearningMilestone {
  step: number;
  title: string;
  focus: string;
  keyConcepts: string[];
}

export interface CurriculumMindMapPayload {
  title: string;
  courseTitle: string;
  totalChapters: number;
  summary: string;
  mermaidSyntax: string;
  nodes: CurriculumMindMapNode[];
  learningPath: CurriculumLearningMilestone[];
  generatedAt: string;
}

/**
 * Builds the Master Mind Map prompt for the complete curriculum
 * Enforces a strict, Harvard/MIT-level Hierarchical Academic Knowledge Tree
 */
export function buildCurriculumMindMapPrompt(params: {
  bookTitle: string;
  category?: string;
  grade_level?: string;
  chapters: { id: string; title: string; summary?: string; content?: string; concepts?: any[] }[];
}): string {
  const chaptersSummary = params.chapters.map((ch, idx) => {
    const conceptList = Array.isArray(ch.concepts) 
      ? ch.concepts.map((c: any) => typeof c === 'string' ? c : `${c.concept || c.title}: ${c.explanation || c.description || ''}`).join(' | ')
      : '';
    const snippet = (ch.summary || ch.content || '').substring(0, 400).replace(/[\n\r]+/g, ' ');
    return `فصل ${idx + 1}: "${ch.title}"\n  ملخص: ${snippet}\n  مفاهيم: ${conceptList || 'مفاهيم الفصل الرئيسية'}`;
  }).join('\n\n');

  return `أنت كبير مهندسي الخرائط المعرفية والأنظمة الإدراكية (Cognitive Knowledge Graph Architect) لمنصة "ebook osera ai".
المهمة: هندسة خريطة ذهنية أكاديمية هرمية واضحة ومترابطة منطقياً 100% لمقرر: "${params.bookTitle}" (المرحلة/المستوى: ${params.grade_level || 'عام'} - التخصص: ${params.category || 'عام'}).

فصول ومحتوى المنهج المعتمد:
${chaptersSummary}

═══════════════════════════════════════════════════════════════
🚨 المعايير المعمارية الصارمة للخريطة الذهنية الهرمية (P0):
═══════════════════════════════════════════════════════════════

1. 🏛️ الهيكل الهرمي الأكاديمي الحتمي (Strict Hierarchical Tree):
   يُحظر تماماً إنشاء عقد عشوائية أو مبعثرة! يجب تنظيم الخريطة في 3 مستويات واضحة:
   - المستـوى 0 (Root Node): رأس الشجرة (اسم المقرر والمحور الاستراتيجي العام).
   - المستـوى 1 (Primary Branches / Units): الأبواب أو الوحدات الكبرى التي تقسم المنهج منطقياً.
   - المستـوى 2 (Chapters): فصول كل وحدة مرتبة بتسلسل منطقي بحيث يوضح السهم الانتقال من درس لآخر.
   - المستـوى 3 (Core Concepts & Takeaways): 2 إلى 3 مفاهيم جوهرية متفرعة من كل فصل تشرح "القاعدة الحاكمة" وسر الفهم.

2. 🔗 إبراز المسار السببي والترابط المنطقي (Causal & Prerequisite Links):
   - يجب أن توضح الخريطة كيف يمهد الفصل الأول للفصل الثاني، ولماذا لا يمكن فهم المفهوم اللاحق دون السابق.
   - كود Mermaid يجب أن يكون \`flowchart TD\` نظيفاً وصحيحاً 100%، مع أسهم دقيقة:
     root["📚 ${params.bookTitle}"] --> U1["الوحدة الأولى: ..."]
     U1 --> ch1["الفصل 1: ..."]
     ch1 --> ch2["الفصل 2: ..."]
     ch1 --> c1_1["المفهوم الجوهري"]
   - استخدم أسماء عقد خالية من الحروف الخاصة بالإنجليزية (مثل u1, ch1, c1_1) وضع النصوص العربية داخل أقواس واقتباسات صريحة ["نص العقدة"].

3. 🎯 عمق وفائدة وصف كل عقدة (Actionable Descriptions):
   - في مصفوفة "nodes"، كل عقدة يجب أن تحتوي على \`description\` يشرح باختصار شديد ووضوح تام: "لماذا ندرس هذا؟" و \`keyTakeaway\` يقدم الكبسولة الذهبية التي لا ينساها الطالب.

أخرج الناتج ككائن JSON صالح برمجياً فقط:
{
  "title": "الخريطة الذهنية الأكاديمية الشاملة لمقرر ${params.bookTitle}",
  "courseTitle": "${params.bookTitle}",
  "totalChapters": ${params.chapters.length},
  "summary": "الرؤية المعرفية المتكاملة لترابط فصول المقرر ومسار التعلم الهرمي...",
  "mermaidSyntax": "flowchart TD\\n  root[\\\"📚 ${params.bookTitle}\\\"]\\n  ...",
  "nodes": [
    {
      "id": "root",
      "label": "${params.bookTitle}",
      "parentId": null,
      "level": "root",
      "description": "المحور الأكاديمي الشامل لجميع وحدات وفصول المقرر",
      "keyTakeaway": "الإحاطة بالشجرة الهرمية تضمن ترسيخ المنهج وفهم العلاقات بين الدروس.",
      "color": "indigo"
    },
    {
      "id": "u-1",
      "label": "الوحدة الأولى: ...",
      "parentId": "root",
      "level": "unit",
      "description": "الهدف الاستراتيجي لهذه الوحدة...",
      "keyTakeaway": "حجر الأساس لباقي فصول المنهج",
      "color": "purple"
    },
    {
      "id": "ch-1",
      "label": "الفصل 1: ...",
      "parentId": "u-1",
      "chapterTitle": "الفصل 1",
      "chapterIndex": 1,
      "level": "chapter",
      "description": "مدخل وتأسيس المفاهيم المحورية...",
      "keyTakeaway": "القاعدة الأساسية المنطلقة للدروس التالية",
      "color": "teal"
    },
    {
      "id": "c1-1",
      "label": "المفهوم الحاكم",
      "parentId": "ch-1",
      "chapterTitle": "الفصل 1",
      "chapterIndex": 1,
      "level": "concept",
      "description": "تفكيك المفهوم وتطبيقه العملي...",
      "keyTakeaway": "السر الجوهري للتفوق في هذا المفهوم",
      "color": "cyan"
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "title": "المحطة التأسيسية الأولى",
      "focus": "إتقان الأساسيات ومفاهيم البداية",
      "keyConcepts": ["المفهوم 1", "المفهوم 2"]
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}
`;
}
