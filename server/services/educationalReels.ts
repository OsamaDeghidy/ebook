import { detectTeacherPersona } from "./teacherPersonas";

export interface EducationalReelPayload {
  title: string;
  topic: string;
  hook: string;
  explanation: string;
  examTip: string;
  interactiveChallenge: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  narrationScript: string;
  visualPrompt: string;
  tags: string[];
}

/**
 * Builds the Master Prompt for High-Yield Educational Micro-Learning Reels (Pillar 5)
 * 4-Phase Viral Loop (0-7s Shock Hook, 8-35s Core Deconstruction, 36-50s Exam Trap, 51-60s Interactive Challenge)
 */
export function buildEducationalReelPrompt(params: {
  bookTitle: string;
  chapterTitle: string;
  chapterContent: string;
  category?: string;
  grade_level?: string;
}): string {
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  return `
You are the world's finest Educational Micro-Learning Architect and Master Reel Producer (Osera Smart Reels Engine).
Your role: ${persona.name} (${persona.title}).

Transform this educational chapter into an ELITE 45-60 second viral educational reel:
- Book: "${params.bookTitle}"
- Chapter / Lesson: "${params.chapterTitle}"
- Teacher Persona: "${persona.name}" - Tone: "${persona.profile?.dialogueTone || 'تربوي مشوق ومحفز'}"
- Content Context (Authentic Textbook Material):
${params.chapterContent.substring(0, 10000)}

🌟 4-PHASE 60-SECOND VIRAL LOOP RULES (إلزامية صارمة):
1. 🎯 المرحلة الأولى (0 - 7 ثوانٍ) - الخطاف الذهني الصادم (Shock Hook):
   - سؤال غير مألوف أو مفارقة تثير الفضول فوراً وتصدم المشاهد (مثال: "ليه 90% من الطلاب بيخسروا الدرجة النهائية في النقطة دي بالذات؟" أو "لو شفت السؤال ده في الامتحان هتجاوبه غلط لو ما ركزتش معايا 7 ثواني!").
2. 💡 المرحلة الثانية (8 - 35 ثانية) - التشريح البيداغوجي العميق (Core Deconstruction):
   - تفكيك المفهوم الجوهري في 3 جمل محكمة خالية من الحشو. اشرح "السر" والسبب العلمي وليس مجرد سرد نصوص.
3. 🚨 المرحلة الثالثة (36 - 50 ثانية) - تفجير فخ الامتحان (Exam Trap Cracked):
   - كشف فخ الامتحانات الأكثر تكراراً، مع القاعدة الذهبية الصارمة للحل السريع المضمون.
4. 🎮 المرحلة الرابعة (51 - 60 ثانية) - التحدي التفاعلي اللحظي (Interactive Challenge):
   - سؤال اختبار سريع من متعدد يجيب عليه الطالب فوراً لتثبيت المعلومة.

🎙️ قواعد السرد الصوتي (Narration Script):
- كتابة النص الصوتي مشكولاً بدقة لضمان النطق العربي الفصيح الخالي من اللحن.
- 🚫 ممنوع نهائياً كتابة الرموز الرياضية أو النجوم أو الهاشتاجات أو الشرطات أو الإيموجي داخل نص السرد الصوتي (narrationScript) حتى لا تنطقها المحركات الصوتية وتفسد التجربة.

OUTPUT MUST BE VALID JSON ONLY:
{
  "title": "عنوان ريل جذاب وقصير للدرس",
  "topic": "${params.chapterTitle}",
  "hook": "الخطاف الذهني الصادم في أول 7 ثوانٍ",
  "explanation": "التشريح العلمي المبسط والمكثف في 25 ثانية",
  "examTip": "تريكة وفخ الامتحان والحل الذهبي",
  "interactiveChallenge": {
    "question": "سؤال التحدي التفاعلي السريع؟",
    "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
    "correctIndex": 0,
    "explanation": "تفسير سريع ومقنع للإجابة الصحيحة"
  },
  "narrationScript": "النص الصوتي المشكول الكامل الخالي تماما من الرموز والشرطات والإيموجي لضمان نطق صوتي فائق النقاء",
  "visualPrompt": "Detailed motion graphics and animated textbook slices description",
  "tags": ["تعليم", "ريلز_المذاكرة", "تريكات_امتحانات"]
}
`;
}
