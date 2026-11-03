import { detectTeacherPersona } from "./teacherPersonas";

export type QuestionFormat = 'mcq' | 'true_false_justify' | 'fill_blank' | 'matching' | 'reasoning';

export interface EducationalQuizQuestion {
  id?: string;
  question: string;
  type?: QuestionFormat;
  options: string[]; // Strict: Full substantive text, NEVER just letters or "أ/ب/ج"
  correctOptionIndex: number;
  explanation: string;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate";
  difficulty?: "easy" | "medium" | "hard";
  trapWarning?: string;
  // Specific type fields
  correctTerm?: string; // For fill_blank
  justification?: string; // For true_false_justify
  matchingPairs?: { item: string; match: string }[]; // For matching
  modelAnswer?: string; // For reasoning
  points?: number; // Marks for this question in exams
}

export interface ComprehensiveExam {
  id: string;
  book_id: string;
  title: string;
  scope: 'lesson' | 'unit' | 'full_curriculum';
  target_title: string; // e.g. "الوحدة الأولى: المادة والطاقة" or "الفصل الثالث"
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  questions: EducationalQuizQuestion[];
  instructions: string[];
  created_at: string;
}

/**
 * Builds Master Prompt for Bloom's Taxonomy Multi-Tiered Quiz Questions
 * Supports source language auto-detection (Arabic vs English/Target) and math symbol/LaTeX mandate
 */
export function buildEducationalQuizPrompt(params: {
  chapterTitle: string;
  chapterContent: string;
  bookTitle?: string;
  category?: string;
  grade_level?: string;
  count?: number;
}): string {
  const count = params.count || 5;
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  // BUG-2: Auto-detect source language
  const combinedSource = `${params.chapterTitle} ${params.chapterContent} ${params.bookTitle || ''}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedSource);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic. Output all questions, options, explanations, and warnings exclusively in Arabic. ZERO mixed languages.`
    : `TARGET LANGUAGE: English (or match textbook source language). The source material is in English/non-Arabic. You MUST generate ALL questions, options, explanations, and warnings strictly in English. STRICT BAN on generating Arabic text or mixed languages.`;

  const exampleQuestion = isArabic
    ? {
        question: "إذا كانت المصفوفة A = \\begin{bmatrix} 4 & 2 \\\\ 6 & 3 \\end{bmatrix}، فما هي النتيجة الرياضية الدقيقة لحساب محددها |A|، وما أثر ذلك على إمكانية إيجاد معكوسها الضربي A^{-1}؟",
        options: [
          "قيمة المحدد تساوي صفراً؛ وبالتالي المصفوفة منفردة (شاذة) ولا يمكن إيجاد معكوس ضربي لها.",
          "حساب المعكوس مباشرة لأن محددها ≠ صفراً وتطبيق قانون المعكوس بالقسمة على المحدد.",
          "استبدال عناصر القطر الرئيسي بالثانوي لإيجاد المعكوس دون الحاجة لحساب قيمة المحدد.",
          "قسمة جميع عناصر المصفوفة على قيمة المحدد للحصول على مصفوفة الوحدة."
        ],
        explanation: "التحليل البيداغوجي: محدد المصفوفة |A| = (4 × 3) - (2 × 6) = 12 - 12 = 0. وبما أن قانون المعكوس يتطلب القسمة على المحدد (1/|A|)، والقسمة على صفر غير معرفة رياضياً؛ فإن المصفوفة منفردة (Singular Matrix) ولا تمتلك معكوساً ضربياً.",
        trapWarning: "فخ الامتحان: تجنب التسرع في استبدال القطرين قبل حساب المحدد؛ فأي مصفوفة محددها صفر تكون شاذة ومنفردة ولا تمتلك معكوساً ضربياً!",
        difficulty: "exam_trap",
        bloomLevel: "analyze"
      }
    : {
        question: "Given matrix A = \\begin{bmatrix} 4 & 2 \\\\ 6 & 3 \\end{bmatrix}, what is the exact mathematical outcome of calculating its determinant |A|, and how does it govern the existence of its inverse A^{-1}?",
        options: [
          "The determinant is exactly zero; therefore, the matrix is singular and has no multiplicative inverse.",
          "Compute the inverse directly because its determinant is non-zero.",
          "Swap the primary and secondary diagonal elements to find the inverse without evaluating the determinant.",
          "Divide all matrix elements by the determinant value to yield the identity matrix."
        ],
        explanation: "Pedagogical Breakdown: Determinant |A| = (4*3) - (2*6) = 12 - 12 = 0. Since the inverse formula requires dividing by the determinant (1/|A|), and division by zero is undefined, the matrix is singular with no inverse.",
        trapWarning: "Exam Trap Alert: Never apply the diagonal swap rule before verifying that the determinant is strictly non-zero!",
        difficulty: "exam_trap",
        bloomLevel: "analyze"
      };

  return `
${persona.pedagogicalSystemPrompt}
You are the Senior Educational Assessment Specialist & Chief Examiner (Osera Diagnostic Engine).

TASK:
Create a rich, multi-dimensional diagnostic quiz of exactly ${count} diverse questions based on the lesson:
- Lesson Title: "${params.chapterTitle}"
- Course/Book: "${params.bookTitle || (isArabic ? 'المقرر التعليمي' : 'Academic Course')}"
- Textbook Content Slice:
"""
${params.chapterContent.substring(0, 25000)}
"""

🚨 CRITICAL ASSESSMENT INTEGRITY MANDATES (P0):
0. 🎯 STRICT HIGH-ORDER BLOOM TAXONOMY & ANTI-LAZINESS MANDATE:
   You are an elite, cunning national examination committee director.
   STRICT PROHIBITION: NEVER generate direct recall questions or trivial copy-paste questions! Every question must force the student to think, compute, contrast, or avoid a trap.

   MANDATORY QUESTION DISTRIBUTION (for exactly ${count} questions):
   - [30% CONCEPTUAL GRASP (فهم واستيعاب عميق)]:
     Questions testing underlying mechanisms, cause-effect, and rules (e.g., "What happens to variable Y if X doubles while Z is constant?").
   - [40% APPLICATION & PROBLEM SOLVING (تطبيق وحل مسائل ومواقف)]:
     Real numerical problems, code tracking, or grammatical analysis requiring multi-step thinking.
   - [30% HIGHER-ORDER ANALYSIS & EXAM TRAPS (تحليل وفخاخ استنتاجية)]:
     Questions featuring smart distractors based on the most common student misconceptions.
     MANDATORY: The 'explanation' field MUST explain WHY the correct answer is right AND explicitly analyze why each of the other three distractors is wrong!
     MANDATORY: The 'trapWarning' field MUST highlight the exact pitfall intended by the exam question!

1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE (P0):
   - Math expressions MUST use standard mathematical symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words.
     * NEVER write words like "أكبر من" or "greater than" inside mathematical expressions; write ">" instead.
     * NEVER write "أصغر من" or "less than"; write "<" instead.
   - Equations and formulas MUST be formatted in LaTeX:
     * Inline equations use $...$ (e.g. $x > 5$ or $E = mc^2$).
     * Block equations use $$...$$.
   - Numbers in formulas and equations MUST be Western digits (0-9).
   - 🚫 STRICT MATHEMATICAL LOGIC & BOUNDS CONSISTENCY:
     * Double check all numerical bounds and inequalities! NEVER write impossible bounds like $\sqrt{16} < x < \sqrt{9}$ (which is mathematically invalid because 4 cannot be less than 3).
     * Lower bounds MUST strictly precede upper bounds: $\sqrt{9} < x < \sqrt{16} \implies 3 < x < 4$.
     * Verify all algebraic solution sets, signs, and domains (ℝ vs ℚ vs ℚ') before finalizing.

3. 🚫 STRICT BAN ON LITERAL LABELS & SINGLE LETTERS IN OPTIONS:
   - 🚫 NEVER output options like ["أ", "ب", "ج", "د"], ["A", "B", "C", "D"], ["Option A", "Option B"], or ["True", "False"]!
   - Every single option MUST be a COMPLETE, DETAILED, SUBSTANTIVE MATHEMATICAL/CONCEPTUAL STATEMENT (e.g., "$x = 2 \\pm \\sqrt{5}$ وكلاهما عددان حقيقيان غير نسبيين ينتميان إلى $\\mathbb{R}$").
   - Exactly 4 fully formulated, distinct choices per question. Zero single-letter placeholders!

4. DIVERSE QUESTION TYPES:
   Provide an engaging mix of questions across multiple formats:
   - "mcq": Multiple choice with 4 full substantive options.
   - "true_false_justify": A precise statement where options provide full substantive statements.
   - "fill_blank": A sentence with a blank (.....) testing a core scientific law, rule, or concept, with 4 full completion options.
   - "reasoning": A causal thinking question with 4 detailed analytical interpretations.

5. COGNITIVE BLOOM PROGRESSION:
   - Test understanding, practical application, relationship analysis, and common exam traps.

OUTPUT MUST BE VALID JSON ONLY:
{
  "questions": [
    {
      "question": "${exampleQuestion.question}",
      "type": "mcq",
      "options": ${JSON.stringify(exampleQuestion.options, null, 8)},
      "correctOptionIndex": 0,
      "explanation": "${exampleQuestion.explanation}",
      "bloomLevel": "apply",
      "difficulty": "medium",
      "trapWarning": "${exampleQuestion.trapWarning}"
    }
  ]
}
`;
}

/**
 * Builds Master Prompt for a Full Exam (Lesson, Unit, or Complete Curriculum)
 * Supports source language auto-detection and math formatting
 */
export function buildComprehensiveExamPrompt(params: {
  bookTitle: string;
  scope: 'lesson' | 'unit' | 'full_curriculum';
  targetTitle: string;
  contextText: string;
  questionCount?: number;
  grade_level?: string;
  category?: string;
}): string {
  const count = params.questionCount || 10;
  const duration = count <= 5 ? 15 : count <= 10 ? 30 : 45;
  const totalMarks = count * 2;

  const combinedSource = `${params.targetTitle} ${params.bookTitle} ${params.contextText}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedSource);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic. Generate all exam titles, instructions, questions, options, and explanations in Arabic.`
    : `TARGET LANGUAGE: English (or match source). Generate all exam titles, instructions, questions, options, and explanations strictly in English with ZERO Arabic text.`;

  return `
You are the National Educational Examination Board Director & Senior Curriculum Evaluator.
Generate a formal, balanced, high-stakes EXAM for:
- Course: "${params.bookTitle}"
- Exam Scope: "${params.scope === 'full_curriculum' ? (isArabic ? 'امتحان شامل على كامل المنهج' : 'Comprehensive Curriculum Exam') : params.scope === 'unit' ? (isArabic ? `امتحان على الوحدة: ${params.targetTitle}` : `Unit Exam: ${params.targetTitle}`) : (isArabic ? `امتحان على درس: ${params.targetTitle}` : `Lesson Exam: ${params.targetTitle}`)}"
- Grade / Level: "${params.grade_level || 'General'}"
- Content Blueprint & Material:
"""
${params.contextText.substring(0, 15000)}
"""

REQUIREMENTS:
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE:
   - Math expressions MUST use standard mathematical symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words.
     * NEVER write "أكبر من" or "greater than" in mathematical expressions; write ">" instead.
   - Equations and formulas MUST be formatted in LaTeX: $...$ for inline, $$...$$ for block.
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. Generate exactly ${count} rigorous diagnostic questions.
4. Mix formats: 60% MCQ (with 4 FULL informative choices), 20% True/False with Justification, 20% Cause-and-Effect / Reasoning.
5. 🚫 ZERO LITERAL LETTERS in options: Never write "أ أو ب" or "A or B".
6. Assign 2 marks per question.
7. Provide detailed model answer explanations for grading.

OUTPUT JSON FORMAT:
{
  "title": "${isArabic ? `امتحان رسمي معتمد: ${params.targetTitle || params.bookTitle}` : `Official Examination: ${params.targetTitle || params.bookTitle}`}",
  "scope": "${params.scope}",
  "target_title": "${params.targetTitle || params.bookTitle}",
  "duration_minutes": ${duration},
  "total_marks": ${totalMarks},
  "passing_marks": ${Math.round(totalMarks * 0.6)},
  "instructions": [
    "${isArabic ? 'اقرأ الأسئلة بتركيز ودقة قبل اختيار الإجابة.' : 'Read questions carefully before selecting your answer.'}",
    "${isArabic ? `الزمن المحدد للاختبار هو ${duration} دقيقة.` : `Allocated test duration is ${duration} minutes.`}",
    "${isArabic ? 'يتم حساب النتيجة والتصنيف المعرفي فور الانتهاء من الإجابات.' : 'Instant scoring and cognitive grading upon submission.'}"
  ],
  "questions": [
    {
      "question": "${isArabic ? 'نص السؤال الامتحاني الصريح والدقيق؟' : 'Clear and rigorous exam question statement?'}",
      "type": "mcq",
      "options": [
        "${isArabic ? 'الإجابة النموذجية الأولى كاملة الصياغة' : 'First complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الثانية كاملة الصياغة (فخ محتمل)' : 'Second complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الثالثة كاملة الصياغة' : 'Third complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الرابعة كاملة الصياغة' : 'Fourth complete substantive answer choice'}"
      ],
      "correctOptionIndex": 0,
      "explanation": "${isArabic ? 'التعليل النموذجي لصحة هذا الاختيار وخطأ البدائل الأخرى.' : 'Model explanation detailing why this option is correct.'}",
      "bloomLevel": "analyze",
      "difficulty": "medium",
      "points": 2,
      "trapWarning": "${isArabic ? 'تنبيه: راجع المعطيات جيداً قبل الاستقرار على الحل' : 'Notice: Check all constraints before finalizing your choice'}"
    }
  ]
}
`;
}
