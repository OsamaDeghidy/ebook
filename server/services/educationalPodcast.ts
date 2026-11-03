import { detectTeacherPersona } from "./teacherPersonas";

export interface PodcastDialogueExchange {
  speaker: "كريم" | "فرح" | "Alex" | "Farah";
  text: string;
}

export interface EducationalPodcastPayload {
  title: string;
  summary: string;
  transcript: PodcastDialogueExchange[];
  keyTakeaways: string[];
}

/**
 * Builds the Master Pedagogical Prompt for Two-Speaker Conversational Podcast
 */
export function buildEducationalPodcastPrompt(params: {
  chapterTitle: string;
  chapterContent: string;
  bookTitle?: string;
  category?: string;
  grade_level?: string;
}): string {
  const isArabic = /[\u0600-\u06FF]/.test(params.chapterContent);
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  const metaLower = `${params.bookTitle || ''} ${params.category || ''} ${params.grade_level || ''} ${params.chapterTitle || ''}`.toLowerCase();
  const isKG = /kg|kindergarten|رياض\s*الأطفال|روضة|حضانة|تمهيدي|أولى\s*ابتدائي|حرف\s|حروف\s|أبجدية/.test(metaLower);

  if (isArabic) {
    return `
أنت مخرج ومحرر بودكاست تعليمي وثقافي رفيع المستوى (Osera Pedagogical Podcast Studio).
تخصص الدرس: ${persona.name} (${persona.title}).

المهمة:
إنشاء حوار صوتي تعليمي دافئ، ذكي، وممتع جداً بين مقدمين متميزين:
1. "كريم": محاور ذكي وفضولي، يمثل عقلية الطالب الشغوف، يطرح أسئلة جوهرية ويبحث عن الفائدة والتطبيقات الواقعية.
2. "فرح": معلمة وخبيرة تربوية متمكنة، تشرح المفاهيم ببساطة وتضرب أمثلة عملية من واقع الحياة.

الموضوع: "${params.chapterTitle}"
مصدر المحتوى:
${params.chapterContent.substring(0, 20000)}

🌟 قواعد الحوار الصارمة:
1. 🚫 استئصال الحشو والمجاملات الزائفة: يُمنع منعاً باتاً تكرار المناداة بالأسماء في بداية كل سطر (مثل "يا أستاذتي فرح"، "سؤال عبقري يا كريم"). يدخل المتحاوران فوراً في الأفكار والتفاعل العفوي الطبيعي من اللحظة الأولى.
${isKG ? `2. 🎈 تخصيص رياض الأطفال والتأسيس: هذا المقرر لأطفال الروضة والصغار! اجعل الحوار كحكاية تمثيلية ممتعة جداً ومبهجة تحاكي عالم الطفل وأصوات الحروف، ومحظور تماماً ذكر كلمة 'امتحان' أو 'قوانين رياضية' أو 'مسائل'.` : `2. 💡 التدرج المنطقي:
   - البداية: ربط الدرس بسؤال مشوق أو مشهد من واقع الحياة.
   - الوسط: تفكيك الفكرة الأساسية مع مثال عملي وتوضيح تريكة أو خطأ يقع فيه معظم الطلاب.
   - الختام: ملخص في سطرين للقاعدة الذهبية.`}
3. ⏱️ اكتب حواراً تدريسياً عميقاً وممتعاً يتكون إجبارياً من 12 إلى 16 تبادلاً حوارياً ثرياً (transcript array).
4. 🎙️ التشكيل اللغوي البسيط على الكلمات المفتاحية لضمان نطق سليم وسلس.

OUTPUT FORMAT (VALID JSON ONLY):
{
  "title": "عنوان إذاعي جذاب للحلقة",
  "summary": "ملخص الحوار في سطرين يوضح القيمة المستفادة",
  "keyTakeaways": ["الفائدة الأولى", "الفائدة الثانية", "تريكة الامتحان"],
  "transcript": [
    { "speaker": "كريم", "text": "..." },
    { "speaker": "فرح", "text": "..." }
  ]
}
`;
  }

  return `
You are an elite educational podcast producer (Osera Pedagogical Podcast Studio).
Topic: "${params.chapterTitle}"
Content Source:
${params.chapterContent.substring(0, 20000)}

Create an engaging conversational dialogue between two hosts:
1. "Alex": Curious, inquisitive learner.
2. "Farah": Warm, knowledgeable expert educator.

Rules:
1. NO repetitive name-calling ("Hey Alex", "Hey Farah" on every sentence).
2. 12-16 rich, deeply pedagogical conversational exchanges breaking down complex concepts, addressing misconceptions, working through applied examples step-by-step, and synthesizing golden takeaways.

OUTPUT FORMAT (JSON ONLY):
{
  "title": "Catchy Podcast Title",
  "summary": "2-sentence executive summary",
  "keyTakeaways": ["Point 1", "Point 2"],
  "transcript": [
    { "speaker": "Alex", "text": "..." },
    { "speaker": "Farah", "text": "..." }
  ]
}
`;
}
