import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTestServer, TestServerInstance } from '../helpers/testServer';
import {
  detectActivityArchetype,
  CategorizationActivity,
  OrderingActivity,
} from '../../server/services/activityEngine';

describe('Activities & Interactive Lab Integration Suite', () => {
  let serverInstance: TestServerInstance;
  const testBookId = 'activity-book-' + Date.now();
  const testChapterId = 'ch-lab-1';

  before(async () => {
    serverInstance = await getTestServer();

    // Create a mock book with a chapter for activity testing
    await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'مختبر الدوائر الرقمية التفاعلي',
        category: 'فيزياء وحاسبات',
        chapters: [
          {
            id: testChapterId,
            title: 'معمل البوابات الرقمية ونصف الجامع',
            content: 'تجربة عملية على تصميم نصف الجامع Half Adder باستخدام بوابات AND و XOR.',
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

  describe('Activity Archetype Detector (detectActivityArchetype)', () => {
    it('detects science_simulation for physics, chemistry, and circuit topics', () => {
      const archetype = detectActivityArchetype({
        title: 'تجربة قياس المقاومة في دائرة كهربائية',
        content: 'توصيل المقاومات وحساب شدة التيار وفرق الجهد باستخدام قانون أوم.',
        category: 'فيزياء',
      });
      assert.strictEqual(archetype, 'science_simulation');
    });

    it('detects ordering archetype for sequential algorithms and chronological steps', () => {
      const archetype = detectActivityArchetype({
        title: 'خطوات خوارزمية التحويل من النظام العشري إلى الثنائي',
        content: 'تسلسل خطوات القسمة على 2 وحفظ باقي القسمة بترتيب تصاعدي.',
      });
      assert.strictEqual(archetype, 'ordering');
    });

    it('detects phonics_matching for early childhood and KG materials', () => {
      const archetype = detectActivityArchetype({
        title: 'حروف الهجاء وأصواتها السحرية',
        content: 'تأسيس الأطفال في رياض الأطفال على نطق الحروف.',
        grade_level: 'kindergarten',
      });
      assert.strictEqual(archetype, 'phonics_matching');
    });

    it('detects case_study for ethics, management, and leadership scenarios', () => {
      const archetype = detectActivityArchetype({
        title: 'دراسة حالة: أخلاقيات الذكاء الاصطناعي في اتخاذ القرار',
        content: 'موقف إداري معقد يتطلب موازنة بين الشفافية والمسؤولية المهنية في القيادة.',
      });
      assert.strictEqual(archetype, 'case_study');
    });

    it('defaults to categorization for general classification topics', () => {
      const archetype = detectActivityArchetype({
        title: 'أنواع الكائنات الحية وتصنيف الفقاريات واللافقاريات',
        content: 'مجموعات الكائنات وتوزيعها في بيئات مختلفة.',
      });
      assert.strictEqual(archetype, 'categorization');
    });
  });

  describe('Activities API Endpoints (/api/activities)', () => {
    it('returns 404 when querying activities for non-existent book or chapter', async () => {
      const res1 = await fetch(`${serverInstance.baseUrl}/api/activities/non-existent-book/ch-1`);
      assert.strictEqual(res1.status, 404);

      const res2 = await fetch(`${serverInstance.baseUrl}/api/activities/${testBookId}/non-existent-ch`);
      assert.strictEqual(res2.status, 404);
    });

    it('indicates when no activity is saved yet for an existing chapter', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/activities/${testBookId}/${testChapterId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('لا يوجد نشاط محفوظ'));
    });

    it('saves and retrieves interactive categorization activity on chapter', async () => {
      const syntheticActivity: CategorizationActivity = {
        id: 'act-cat-01',
        archetype: 'categorization',
        title: 'تصنيف مكونات نصف الجامع',
        instructions: 'اسحب كل عنصر إلى الخانة الصحيحة (مدخلات ومخرجات)',
        targetGrade: 'الصف الثاني الإعدادي',
        subjectDomain: 'حاسب آلي',
        estimatedMinutes: 5,
        totalPoints: 10,
        passPercentage: 70,
        learningOutcome: 'التمييز الدقيق بين مدخلات ومخرجات دائرة نصف الجامع',
        buckets: [
          { id: 'b-inputs', title: 'المدخلات (Inputs)', color: 'teal' },
          { id: 'b-outputs', title: 'المخرجات (Outputs)', color: 'orange' },
        ],
        items: [
          { id: 'i1', text: 'الخانة الثنائية A', correctBucketId: 'b-inputs', points: 2.5 },
          { id: 'i2', text: 'الخانة الثنائية B', correctBucketId: 'b-inputs', points: 2.5 },
          { id: 'i3', text: 'ناتج الجمع S (Sum)', correctBucketId: 'b-outputs', points: 2.5 },
          { id: 'i4', text: 'باقي الحمل C (Carry)', correctBucketId: 'b-outputs', points: 2.5 },
        ],
      };

      // Attach to chapter via chapters/save endpoint
      await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapters: [
            {
              id: testChapterId,
              title: 'معمل البوابات الرقمية ونصف الجامع',
              content: 'محتوى الدرس مع النشاط التفاعلي',
              interactive_activity: syntheticActivity,
            },
          ],
        }),
      });

      // Now query /api/activities/:bookId/:chapterId
      const res = await fetch(`${serverInstance.baseUrl}/api/activities/${testBookId}/${testChapterId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.activity.id, 'act-cat-01');
      assert.strictEqual(data.activity.archetype, 'categorization');
      assert.strictEqual(data.activity.buckets.length, 2);
    });

    it('evaluates activity submission, updating score, attempts, and pass status', async () => {
      // 1. Submit passing score (8/10 = 80% >= 70%)
      const passingRes = await fetch(`${serverInstance.baseUrl}/api/activities/${testBookId}/${testChapterId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userScore: 8,
          totalPoints: 10,
          timeSpentSeconds: 120,
          studentId: 'student-tester-1',
        }),
      });

      assert.strictEqual(passingRes.status, 200);
      const passData = await passingRes.json();
      assert.strictEqual(passData.success, true);
      assert.strictEqual(passData.isPassed, true, 'Score 80% must pass with threshold 70%');
      assert.strictEqual(passData.userScore, 8);
      assert.strictEqual(passData.attemptsCount, 1);

      // 2. Submit failing score (5/10 = 50% < 70%)
      const failingRes = await fetch(`${serverInstance.baseUrl}/api/activities/${testBookId}/${testChapterId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userScore: 5,
          totalPoints: 10,
          timeSpentSeconds: 90,
          studentId: 'student-tester-1',
        }),
      });

      assert.strictEqual(failingRes.status, 200);
      const failData = await failingRes.json();
      assert.strictEqual(failData.isPassed, false, 'Score 50% must not pass with threshold 70%');
      assert.strictEqual(failData.attemptsCount, 2);
    });
  });
});
