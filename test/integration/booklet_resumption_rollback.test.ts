import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTestServer, TestServerInstance } from '../helpers/testServer';

describe('Booklet Resumption & Rollback Integration Suite', () => {
  let serverInstance: TestServerInstance;
  const testBookId = 'booklet-test-m1-' + Date.now();

  before(async () => {
    serverInstance = await getTestServer();
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Sequential State Tracking & Rollback on Chapter Deletion', () => {
    it('initializes a multi-chapter booklet with strict sequential boundaries and blueprint', async () => {
      const initialBookPayload = {
        title: 'كتاب العلوم المتكاملة للشهادة الإعدادية',
        category: 'علوم',
        grade_level: 'الصف الثالث الإعدادي',
        total_pdf_pages: 50,
        total_pages: 50,
        last_processed_page: 20,
        is_fully_completed: false,
        chapters: [
          {
            id: 'ch-m1-1',
            title: 'الوحدة الأولى: القوى والحركة',
            content: 'شرح مفصل للحركة والسرعة والعجلة في خط مستقيم.',
            summary: 'ملخص قوانين الحركة والعجلة المنتظمة.',
            start_page: 1,
            end_page: 10,
            pages: [
              { pageNumber: 1, dataUrl: 'https://example.com/p1.png', pageType: 'study' },
              { pageNumber: 2, dataUrl: 'https://example.com/p2.png', pageType: 'study' },
            ],
            quiz: [
              {
                id: 'q-1',
                question: 'ما هي وحدة قياس العجلة في النظام الدولي؟',
                options: ['م/ث2', 'م/ث', 'نيوتن', 'جول'],
                correctOptionIndex: 0,
                explanation: 'تقاس العجلة بمتر لكل ثانية مربعة.',
              },
            ],
          },
          {
            id: 'ch-m1-2',
            title: 'الوحدة الثانية: الطاقة الضوئية والمرايا',
            content: 'شرح انعكاس الضوء والمرايا الكرية المقعرة والمحدبة.',
            summary: 'ملخص خواص الصور المتكونة بالمرايا.',
            start_page: 11,
            end_page: 20,
            pages: [
              { pageNumber: 11, dataUrl: 'https://example.com/p11.png', pageType: 'study' },
            ],
            quiz: [
              {
                id: 'q-2',
                question: 'النقطة التي تتوسط السطح العاكس للمرآة الكرية تسمى:',
                options: ['قطب المرآة', 'مركز التكور', 'البؤرة الأصلية', 'المحور الثانوي'],
                correctOptionIndex: 0,
                explanation: 'قطب المرآة هو النقطة التي تتوسط السطح العاكس.',
              },
            ],
          },
        ],
        blueprint: {
          book_title: 'كتاب العلوم المتكاملة للشهادة الإعدادية',
          total_lessons: 4,
          detected_units: ['الوحدة الأولى', 'الوحدة الثانية', 'الوحدة الثالثة', 'الوحدة الرابعة'],
          total_pdf_pages: 50,
          last_processed_page: 20,
          last_scanned_page: 20,
          createdAt: new Date().toISOString(),
          lessons: [
            {
              lesson_order: 1,
              lesson_title: 'الوحدة الأولى: القوى والحركة',
              start_page: 1,
              end_page: 10,
              sub_topics: ['السرعة', 'العجلة'],
              raw_text_snippet: 'نص استخراج الوحدة الأولى...',
              status: 'completed',
            },
            {
              lesson_order: 2,
              lesson_title: 'الوحدة الثانية: الطاقة الضوئية والمرايا',
              start_page: 11,
              end_page: 20,
              sub_topics: ['المرايا', 'العدسات'],
              raw_text_snippet: 'نص استخراج الوحدة الثانية...',
              status: 'completed',
            },
            {
              lesson_order: 3,
              lesson_title: 'الوحدة الثالثة: الكون والنظام الشمسي',
              start_page: 21,
              end_page: 35,
              sub_topics: ['المجرات', 'تمدد الكون'],
              raw_text_snippet: '',
              status: 'pending',
            },
            {
              lesson_order: 4,
              lesson_title: 'الوحدة الرابعة: التكاثر واستمرار النوع',
              start_page: 36,
              end_page: 50,
              sub_topics: ['الانقسام الميتوزي', 'الانقسام الميوزي'],
              raw_text_snippet: '',
              status: 'pending',
            },
          ],
        },
      };

      // Create book via PUT /api/ebooks/:id
      const createRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialBookPayload),
      });

      assert.strictEqual(createRes.status, 200);
      const createdBook = await createRes.json();
      assert.strictEqual(createdBook.id, testBookId);
      assert.strictEqual(createdBook.chapters.length, 2);
      assert.strictEqual(createdBook.last_processed_page, 20);
      assert.strictEqual(createdBook.is_fully_completed, false);
      assert.strictEqual(createdBook.blueprint.lessons[0].status, 'completed');
      assert.strictEqual(createdBook.blueprint.lessons[1].status, 'completed');
      assert.strictEqual(createdBook.blueprint.lessons[2].status, 'pending');
    });

    it('rolls back last_processed_page and resets blueprint when chapter 2 is deleted', async () => {
      // Simulate user deleting chapter 2, keeping only chapter 1 (pages 1-10)
      const savePayload = {
        chapters: [
          {
            id: 'ch-m1-1',
            title: 'الوحدة الأولى: القوى والحركة',
            content: 'شرح مفصل للحركة والسرعة والعجلة في خط مستقيم.',
            summary: 'ملخص قوانين الحركة والعجلة المنتظمة.',
            start_page: 1,
            end_page: 10,
          },
        ],
      };

      const saveRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      });

      assert.strictEqual(saveRes.status, 200);
      const saveBody = await saveRes.json();
      assert.strictEqual(saveBody.success, true);

      // Verify book state via GET /api/ebooks/:id
      const verifyRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`);
      assert.strictEqual(verifyRes.status, 200);
      const verifiedBook = await verifyRes.json();

      // 1. Chapters count must be 1
      assert.strictEqual(verifiedBook.chapters.length, 1);
      assert.strictEqual(verifiedBook.chapters[0].id, 'ch-m1-1');

      // 2. last_processed_page must be rolled back from 20 to 10
      assert.strictEqual(verifiedBook.last_processed_page, 10);
      assert.strictEqual(verifiedBook.is_fully_completed, false);

      // 3. Blueprint state must reflect rollback
      assert.ok(verifiedBook.blueprint, 'Blueprint must be preserved');
      assert.strictEqual(verifiedBook.blueprint.last_processed_page, 10);
      assert.strictEqual(verifiedBook.blueprint.lessons[0].status, 'completed');
      // Lesson 2 must now be rolled back to pending with cleared snippet
      assert.strictEqual(verifiedBook.blueprint.lessons[1].status, 'pending');
      assert.strictEqual(verifiedBook.blueprint.lessons[1].raw_text_snippet, '');
      // Lessons 3 and 4 must remain pending
      assert.strictEqual(verifiedBook.blueprint.lessons[2].status, 'pending');
      assert.strictEqual(verifiedBook.blueprint.lessons[3].status, 'pending');
    });

    it('rolls back last_processed_page to 0 and all lessons to pending if all chapters are deleted', async () => {
      // Simulate user deleting all chapters
      const emptyPayload = {
        chapters: [],
      };

      const saveRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyPayload),
      });

      assert.strictEqual(saveRes.status, 200);

      const verifyRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`);
      const verifiedBook = await verifyRes.json();

      assert.strictEqual(verifiedBook.chapters.length, 0);
      assert.strictEqual(verifiedBook.last_processed_page, 0);
      assert.strictEqual(verifiedBook.is_fully_completed, false);
      assert.strictEqual(verifiedBook.blueprint.last_processed_page, 0);
      for (const lesson of verifiedBook.blueprint.lessons) {
        assert.strictEqual(lesson.status, 'pending');
        assert.strictEqual(lesson.raw_text_snippet, '');
      }
    });
  });

  describe('Chapter Pages & Exercises Endpoints Persistence', () => {
    const pagesBookId = 'pages-test-m1-' + Date.now();

    before(async () => {
      // Create a book with pages and quiz exercises
      await fetch(`${serverInstance.baseUrl}/api/ebooks/${pagesBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'كتاب اختبار الصفحات والتمارين',
          chapters: [
            {
              id: 'ch-pages-1',
              title: 'الدرس الأول التجريبي',
              content: 'محتوى تجريبي للدرس الأول.',
              pages: [
                { pageNumber: 1, dataUrl: 'https://example.com/scanned_p1.jpg', pageType: 'study' },
                { pageNumber: 2, dataUrl: 'https://example.com/scanned_p2.jpg', pageType: 'exercise' },
              ],
              exercises: [
                {
                  id: 'ex-1',
                  question_text: 'سؤال تقويمي أول',
                  options: ['أ', 'ب', 'ج', 'د'],
                  model_answer: 'أ',
                  max_score: 10,
                },
              ],
            },
          ],
        }),
      });
    });

    it('retrieves chapter pages via GET /api/ebooks/:id/chapters/:chapterId/pages', async () => {
      const res = await fetch(
        `${serverInstance.baseUrl}/api/ebooks/${pagesBookId}/chapters/ch-pages-1/pages`
      );
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.pages, 'Response should contain pages property');
      assert.ok(Array.isArray(data.pages), 'pages must be an array');
      assert.strictEqual(data.pages.length, 2);
      assert.strictEqual(data.pages[0].pageNumber, 1);
      assert.strictEqual(data.pages[0].pageType, 'study');
      assert.strictEqual(data.pages[1].pageNumber, 2);
      assert.strictEqual(data.pages[1].pageType, 'exercise');
    });

    it('retrieves chapter exercises via GET /api/ebooks/:id/chapters/:chapterId/exercises', async () => {
      const res = await fetch(
        `${serverInstance.baseUrl}/api/ebooks/${pagesBookId}/chapters/ch-pages-1/exercises`
      );
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.exercises, 'Response should contain exercises');
      assert.ok(Array.isArray(data.exercises), 'exercises must be an array');
      assert.strictEqual(data.exercises.length, 1);
      assert.strictEqual(data.exercises[0].question_text, 'سؤال تقويمي أول');
    });

    it('returns 404 for non-existent chapter or book in pages endpoint', async () => {
      const res = await fetch(
        `${serverInstance.baseUrl}/api/ebooks/non-existent-id/chapters/ch-unknown/pages`
      );
      assert.strictEqual(res.status, 404);
    });
  });
});
