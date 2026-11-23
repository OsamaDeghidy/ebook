import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTestServer, TestServerInstance } from '../helpers/testServer';
import {
  buildEducationalQuizPrompt,
  buildComprehensiveExamPrompt,
  ComprehensiveExam,
  EducationalQuizQuestion,
} from '../../server/services/quizEngine';

describe('Exams & Bloom Taxonomy Integration Suite', () => {
  let serverInstance: TestServerInstance;
  const testBookId = 'exam-test-book-' + Date.now();

  before(async () => {
    serverInstance = await getTestServer();

    // Create a mock book to test exam persistence
    await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'كتاب اختبارات أنظمة المنطق الرقمي',
        category: 'حاسبات',
        chapters: [
          {
            id: 'ch-digital-logic',
            title: 'الوحدة الأولى: البوابات والدوائر الرقمية',
            content: 'شرح بوابات AND و OR و NOT ونصف الجامع Half Adder.',
          },
        ],
      }),
    });
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Exams Repository Endpoints (/api/ebooks/:id/exams)', () => {
    it('retrieves exam list for an existing book', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/exams`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.exams), 'Exams must be an array');
    });

    it('returns 404 when fetching exams for a non-existent book', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/non-existent-book-id/exams`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error, 'Ebook not found');
    });

    it('rejects saving exam when payload or exam.id is missing with 400 Bad Request', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/exams/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('Exam payload with valid id is required'));
    });

    it('saves and updates comprehensive exam structure with Bloom levels and marks', async () => {
      const examId = 'exam-comp-' + Date.now();
      const syntheticExam: ComprehensiveExam = {
        id: examId,
        book_id: testBookId,
        title: 'امتحان شامل على البوابات المنطقية',
        scope: 'unit',
        target_title: 'الوحدة الأولى: البوابات والدوائر الرقمية',
        duration_minutes: 45,
        total_marks: 30,
        passing_marks: 18,
        instructions: ['اقرأ كل سؤال بعناية', 'اختر الإجابة الأدق علمياً'],
        created_at: new Date().toISOString(),
        questions: [
          {
            id: 'q1',
            question: 'ما هي البوابة المنطقية التي تنتج 1 فقط عندما تختلف قيم المدخلين؟',
            type: 'mcq',
            options: ['بوابة AND', 'بوابة OR', 'بوابة XOR الاستبعادية', 'بوابة NOT'],
            correctOptionIndex: 2,
            explanation: 'بوابة XOR تعطي 1 عند اختلاف المدخلين (0,1 أو 1,0) و0 عند تطابقهما.',
            bloomLevel: 'understand',
            difficulty: 'easy',
            points: 5,
          },
          {
            id: 'q2',
            question: 'في دائرة نصف الجامع (Half Adder)، ما المعادلة البولية لناتج الجمع S؟',
            type: 'mcq',
            options: ['S = A . B', 'S = A + B', 'S = A XOR B', 'S = !A'],
            correctOptionIndex: 2,
            explanation: 'ناتج الجمع S في نصف الجامع ينفذ بواسطة بوابة XOR.',
            bloomLevel: 'apply',
            difficulty: 'medium',
            points: 5,
          },
        ],
      };

      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/exams/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam: syntheticExam }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.exams.some((x: any) => x.id === examId));

      // Verify retrieval
      const getRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/exams`);
      const getData = await getRes.json();
      const savedExam = getData.exams.find((x: any) => x.id === examId);
      assert.ok(savedExam);
      assert.strictEqual(savedExam.total_marks, 30);
      assert.strictEqual(savedExam.questions.length, 2);
    });
  });

  describe("Quiz & Exam Prompt Builders (Bloom's Taxonomy Integrity)", () => {
    it("builds quiz prompt with Bloom's taxonomy levels and formatting rules", () => {
      const prompt = buildEducationalQuizPrompt({
        chapterTitle: 'بوابات المنطق الرقمية',
        chapterContent: 'شرح بوابات AND و OR و NOT و XOR وتطبيقات نصف الجامع.',
        count: 5,
      });

      // Assert Higher-Order Bloom taxonomy mandates are enforced
      assert.ok(prompt.includes('BLOOM TAXONOMY'), 'Prompt must enforce Bloom taxonomy');
      assert.ok(prompt.includes('CONCEPTUAL GRASP') || prompt.includes('فهم واستيعاب'), 'Must require understanding tier');
      assert.ok(prompt.includes('APPLICATION') || prompt.includes('تطبيق'), 'Must require application tier');
      assert.ok(prompt.includes('ANALYSIS') || prompt.includes('تحليل'), 'Must require analysis tier');

      // Assert substantive options mandate
      assert.ok(
        prompt.includes('options') || prompt.includes('OPTIONS') || prompt.includes('خيارات'),
        'Prompt must enforce options structure'
      );
    });

    it('builds comprehensive exam prompt with scope and curriculum coverage', () => {
      const examPrompt = buildComprehensiveExamPrompt({
        bookTitle: 'منهج الدوائر المنطقية',
        targetTitle: 'المنهج الكامل للدوائر المنطقية',
        scope: 'full_curriculum',
        contextText: 'محتوى شامل لكل الفصول والوحدات التعليمية في أنظمة الحاسب.',
        questionCount: 15,
      });

      assert.ok(examPrompt.includes('full_curriculum'), 'Must specify curriculum scope');
      assert.ok(examPrompt.includes('15'), 'Must set question count');
      assert.ok(examPrompt.includes('duration_minutes') || examPrompt.includes('total_marks'), 'Must include exam metrics');
      assert.ok(examPrompt.includes('passing_marks'), 'Must enforce passing score threshold');
    });

    it('validates EducationalQuizQuestion contract integrity', () => {
      const question: EducationalQuizQuestion = {
        question: 'أي البوابات التالية تسمى البوابة العاكسة؟',
        options: ['بوابة AND', 'بوابة NOT', 'بوابة OR', 'بوابة NAND'],
        correctOptionIndex: 1,
        explanation: 'بوابة NOT تعكس إشارة الدخل.',
        bloomLevel: 'remember',
        difficulty: 'easy',
      };

      // Validations:
      assert.strictEqual(question.options.length, 4, 'MCQ must contain 4 options');
      question.options.forEach((opt, idx) => {
        assert.ok(opt.trim().length > 2, `Option ${idx} must contain substantive text`);
        assert.ok(!/^[أ-يa-zA-Z]$/.test(opt.trim()), `Option ${idx} must not be just a single letter`);
      });
      assert.ok(
        question.correctOptionIndex >= 0 && question.correctOptionIndex < question.options.length,
        'correctOptionIndex must point to a valid option'
      );
      const validBloom = ['remember', 'understand', 'apply', 'analyze', 'evaluate'];
      assert.ok(validBloom.includes(question.bloomLevel!), 'bloomLevel must match valid Bloom tiers');
    });
  });
});
