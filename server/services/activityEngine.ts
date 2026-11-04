import { Type } from "@google/genai";

export type ActivityArchetype =
  | 'categorization'
  | 'ordering'
  | 'case_study'
  | 'science_simulation'
  | 'phonics_matching';

export interface BaseActivity {
  id: string;
  archetype: ActivityArchetype;
  title: string;
  instructions: string;
  targetGrade: string;
  subjectDomain: string;
  estimatedMinutes: number;
  totalPoints: number;
  passPercentage: number;
  learningOutcome: string;
  userScore?: number;
  isPassed?: boolean;
  completedAt?: string;
  attemptsCount?: number;
}

export interface CategorizationActivity extends BaseActivity {
  archetype: 'categorization';
  buckets: Array<{
    id: string;
    title: string;
    color?: string;
    icon?: string;
  }>;
  items: Array<{
    id: string;
    text: string;
    correctBucketId: string;
    points: number;
    explanation?: string;
  }>;
}

export interface OrderingActivity extends BaseActivity {
  archetype: 'ordering';
  items: Array<{
    id: string;
    text: string;
    correctOrder: number;
    explanation?: string;
  }>;
}

export interface CaseStudyActivity extends BaseActivity {
  archetype: 'case_study';
  scenario: string;
  role: string;
  decisionDilemma: string;
  choices: Array<{
    id: string;
    text: string;
    isOptimal: boolean;
    points: number;
    consequence: string;
    feedback: string;
  }>;
}

export interface ScienceSimulationActivity extends BaseActivity {
  archetype: 'science_simulation';
  formulaLabel: string;
  variables: Array<{
    id: string;
    name: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  }>;
  formulaEquation: string;
  challengeQuestion: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
}

export interface PhonicsMatchingActivity extends BaseActivity {
  archetype: 'phonics_matching';
  targetSoundOrLetter: string;
  pairs: Array<{
    id: string;
    letterOrSound: string;
    word: string;
    emoji: string;
    isCorrectMatch: boolean;
  }>;
  encouragement: string;
}

export type GeneratedActivity =
  | CategorizationActivity
  | OrderingActivity
  | CaseStudyActivity
  | ScienceSimulationActivity
  | PhonicsMatchingActivity;

/**
 * Intelligent domain and stage detector to assign the most effective activity archetype
 */
export function detectActivityArchetype(params: {
  title: string;
  content: string;
  category?: string;
  grade_level?: string;
}): ActivityArchetype {
  const meta = `${params.title} ${params.category || ''} ${params.grade_level || ''} ${params.content.substring(0, 800)}`.toLowerCase();

  // 1. Kindergarten and Early Childhood Foundation
  if (/kg|kindergarten|رياض\s*الأطفال|روضة|حضانة|تمهيدي|أولى\s*ابتدائي|تأسيس|حرف\s|حروف|أصوات/.test(meta)) {
    return 'phonics_matching';
  }

  // 2. Science, Physics, Chemistry, Math Formula Simulations
  if (/فيزياء|physics|كيمياء|chemistry|رياضيات|math|قوة|سرعة|عجلة|حركة|كتلة|ضغط|طاقة|معادلة|نيوتن|جاذبية|كثافة|دائرة\s*كهرب|مقاومة/.test(meta)) {
    return 'science_simulation';
  }

  // 3. Professional Development, Humanities, Ethics, Management, Law Case Studies
  if (/معلم|تربية|إدارة|قيادة|قانون|أخلاق|فلسفة|موقف|سلوك|استراتيج|مهني|رخصة\s*مهنية|مكيافيلي|أمير|طبي|تمريض|دعوى/.test(meta)) {
    return 'case_study';
  }

  // 4. Chronological & Sequential Ordering
  if (/تاريخ|معركة|غزوة|تسلسل|خطوات|ترتيب|إجراء|خوارزم|برمجة|عصور|خلفاء|ثورة|مراحل/.test(meta)) {
    return 'ordering';
  }

  // 5. Default high-rigor categorization (Grammar, Geography, Biology, General classification)
  return 'categorization';
}

/**
 * Build structured Gemini schema for each specific archetype
 */
function getActivityResponseSchema(archetype: ActivityArchetype): any {
  const commonProperties: Record<string, any> = {
    title: { type: Type.STRING, description: "Engaging, authentic Arabic title of the activity" },
    instructions: { type: Type.STRING, description: "Clear, step-by-step instructions for the student" },
    estimatedMinutes: { type: Type.INTEGER, description: "Estimated completion time in minutes (typically 3-7)" },
    totalPoints: { type: Type.INTEGER, description: "Total achievable score, typically 10" },
    learningOutcome: { type: Type.STRING, description: "Specific pedagogical objective mastered by this activity" }
  };

  if (archetype === 'categorization') {
    return {
      type: Type.OBJECT,
      properties: {
        ...commonProperties,
        buckets: {
          type: Type.ARRAY,
          description: "2 or 3 distinct classification categories/containers",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              color: { type: Type.STRING, description: "Tailwind color key: blue, emerald, amber, purple, or rose" },
              icon: { type: Type.STRING, description: "Emoji icon" }
            },
            required: ["id", "title"]
          }
        },
        items: {
          type: Type.ARRAY,
          description: "6 to 8 items/cards to be sorted into the buckets",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              correctBucketId: { type: Type.STRING, description: "Matching bucket id" },
              points: { type: Type.INTEGER, description: "1 or 2 points" },
              explanation: { type: Type.STRING, description: "Why this item belongs here" }
            },
            required: ["id", "text", "correctBucketId", "points"]
          }
        }
      },
      required: ["title", "instructions", "buckets", "items", "learningOutcome"]
    };
  }

  if (archetype === 'ordering') {
    return {
      type: Type.OBJECT,
      properties: {
        ...commonProperties,
        items: {
          type: Type.ARRAY,
          description: "4 to 6 items to be ordered chronologically or procedurally",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              correctOrder: { type: Type.INTEGER, description: "1-based order index (1, 2, 3...)" },
              explanation: { type: Type.STRING }
            },
            required: ["id", "text", "correctOrder"]
          }
        }
      },
      required: ["title", "instructions", "items", "learningOutcome"]
    };
  }

  if (archetype === 'case_study') {
    return {
      type: Type.OBJECT,
      properties: {
        ...commonProperties,
        scenario: { type: Type.STRING, description: "Rich, realistic problem scenario or educational dilemma (2-3 paragraphs)" },
        role: { type: Type.STRING, description: "Student's assumed role (e.g., المعلم القائد، المحقق التاريخي، الخبير القانوني)" },
        decisionDilemma: { type: Type.STRING, description: "Core question or decision required" },
        choices: {
          type: Type.ARRAY,
          description: "3 to 4 decision alternatives",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING, description: "The decision option" },
              isOptimal: { type: Type.BOOLEAN, description: "True if this is the pedagogically superior decision" },
              points: { type: Type.INTEGER, description: "Points awarded (10 for optimal, 3-5 for acceptable, 0 for flawed)" },
              consequence: { type: Type.STRING, description: "Realistic outcome of this decision" },
              feedback: { type: Type.STRING, description: "Pedagogical commentary on why this choice is strong or weak" }
            },
            required: ["id", "text", "isOptimal", "points", "consequence", "feedback"]
          }
        }
      },
      required: ["title", "instructions", "scenario", "decisionDilemma", "choices", "learningOutcome"]
    };
  }

  if (archetype === 'science_simulation') {
    return {
      type: Type.OBJECT,
      properties: {
        ...commonProperties,
        formulaLabel: { type: Type.STRING, description: "Scientific Law or Relationship (e.g., قانون نيوتن الثاني: F = m × a)" },
        formulaEquation: { type: Type.STRING, description: "JS formula calculation expression e.g. var1 * var2" },
        variables: {
          type: Type.ARRAY,
          description: "2 interactive slider variables",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "var1 or var2" },
              name: { type: Type.STRING },
              unit: { type: Type.STRING },
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              step: { type: Type.NUMBER },
              defaultValue: { type: Type.NUMBER }
            },
            required: ["id", "name", "unit", "min", "max", "defaultValue"]
          }
        },
        challengeQuestion: { type: Type.STRING, description: "Hypothesis testing question based on the simulation" },
        options: {
          type: Type.ARRAY,
          description: "3-4 options for the challenge question",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              isCorrect: { type: Type.BOOLEAN }
            },
            required: ["id", "text", "isCorrect"]
          }
        },
        explanation: { type: Type.STRING, description: "Scientific explanation of the relationship and correct result" }
      },
      required: ["title", "instructions", "formulaLabel", "variables", "challengeQuestion", "options", "learningOutcome"]
    };
  }

  // phonics_matching (KG)
  return {
    type: Type.OBJECT,
    properties: {
      ...commonProperties,
      targetSoundOrLetter: { type: Type.STRING, description: "Target letter or phonics sound e.g. حرف الألف (أ)" },
      encouragement: { type: Type.STRING, description: "Warm, child-friendly encouragement" },
      pairs: {
        type: Type.ARRAY,
        description: "5 to 6 playful letter/sound word pairs",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            letterOrSound: { type: Type.STRING },
            word: { type: Type.STRING, description: "Word with accurate Tashkeel" },
            emoji: { type: Type.STRING, description: "Matching emoji e.g. 🦁 for أسد" },
            isCorrectMatch: { type: Type.BOOLEAN, description: "True if the word actually begins with or contains the target sound" }
          },
          required: ["id", "letterOrSound", "word", "emoji", "isCorrectMatch"]
        }
      }
    },
    required: ["title", "instructions", "targetSoundOrLetter", "pairs", "learningOutcome"]
  };
}

/**
 * Generates an authentic, age-adaptive educational activity for a given lesson
 */
export async function generateLessonActivity(
  generateContentFn: (params: any, modelFallbackChain?: string[]) => Promise<any>,
  params: {
    bookId: string;
    chapterId: string;
    title: string;
    content: string;
    category?: string;
    grade_level?: string;
    preferredArchetype?: ActivityArchetype;
  }
): Promise<GeneratedActivity> {
  const archetype = params.preferredArchetype || detectActivityArchetype(params);
  const responseSchema = getActivityResponseSchema(archetype);

  const prompt = `
أنت خبير تصميم الأنشطة التعليمية والتطبيقات التفاعلية للمناهج العربية (Interactive Activity & Simulation Designer).
المهمة: توليد نشاط تطبيقي تفاعلي علمي وبيداغوجي متقن ومحدد لدرس: "${params.title}".
المرحلة والفئة المستهدفة: "${params.grade_level || 'عام'}" - التخصص: "${params.category || 'عام'}".
نمط النشاط المطلوب حصراً: "${archetype}".

محتوى وسياق الدرس الأصلي:
"""
${params.content.substring(0, 10000)}
"""

قواعد التصميم الإلزامية الصارمة:
1. 🎯 المواءمة البيداغوجية والعمرية:
   - إذا كان النمط "phonics_matching" (رياض أطفال): لغة طفولية مشوقة مليئة بالإيموجي، كلمات واضحة مشكولة بالكامل (أَرْنَب 🐇، أُم 👩)، وتشجيع بدون أي تعقيد.
   - إذا كان النمط "case_study" (المعلم المتميز / مواد مهنية وفكرية): سيناريو واقعي حي ومحدد يضع الطالب في موقف اتخاذ قرار حقيقي مع عواقب ملموسة لكل خيار.
   - إذا كان النمط "categorization" (نحو / دراسات / علوم): تصنيف واضح المعالم بدقة 100% بدون أي تداخل أو غموض.
   - إذا كان النمط "ordering" (تاريخ / خطوات معملية / حاسب): تسلسل منطقي محكم من البداية للنهاية.
   - إذا كان النمط "science_simulation" (علوم / فيزياء / رياضيات): علاقة رياضية حقيقية ومتغيرات واقعية.
2. 🏆 معايير التقييم والدرجات (Rubric):
   - يجب أن يكون إجمالي الدرجات 10 درجات واضحة.
   - تقديم تفسير وتغذية راجعة تربوية لكل عنصر أو خيار.
3. 🚫 حظر النمطية وتجنب محاكيات الكود العامة إلا إذا كان المقرر برمجياً بحتاً.
`;

  const response = await generateContentFn({
    contents: [prompt],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2
    }
  }, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite-preview", "gemini-3-flash-preview", "gemini-3.5-flash"]);

  const rawJson = JSON.parse(response.text || "{}");

  const finalActivity: GeneratedActivity = {
    id: `act-${params.chapterId}-${Date.now()}`,
    archetype,
    title: rawJson.title || `نشاط تطبيقي: ${params.title}`,
    instructions: rawJson.instructions || "اتبع الخطوات التفاعلية التالية لإتمام النشاط وتحقيق أعلى الدرجات.",
    targetGrade: params.grade_level || "جميع المراحل",
    subjectDomain: params.category || "عام",
    estimatedMinutes: Number(rawJson.estimatedMinutes) || 5,
    totalPoints: Number(rawJson.totalPoints) || 10,
    passPercentage: 70,
    learningOutcome: rawJson.learningOutcome || `استيعاب وتطبيق مفاهيم ${params.title}.`,
    ...rawJson
  };

  return finalActivity;
}
