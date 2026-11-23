import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTestServer, TestServerInstance } from '../helpers/testServer';

describe('Ebooks API Integration Suite', () => {
  let serverInstance: TestServerInstance;
  let testBookId: string;

  before(async () => {
    serverInstance = await getTestServer();
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Catalog & Retrieval Endpoints (/api/ebooks)', () => {
    it('returns the slim catalog as an array with essential fields', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Catalog response must be an array');
      if (data.length > 0) {
        const book = data[0];
        testBookId = book.id;
        assert.ok(book.id, 'Book must have an id');
        assert.ok(book.title, 'Book must have a title');
        assert.ok('chapters_count' in book, 'Book must include chapters_count');
      }
    });

    it('returns the full book list when full=true is specified', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks?full=true`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
    });

    it('returns single book by ID if found or 404 if not found', async () => {
      if (testBookId) {
        const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${testBookId}`);
        assert.strictEqual(res.status, 200);
        const book = await res.json();
        assert.strictEqual(book.id, testBookId);
      }

      // Non-existent ID returns 404
      const nonExistentRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/non-existent-uuid-99999`);
      assert.strictEqual(nonExistentRes.status, 404);
      const errData = await nonExistentRes.json();
      assert.strictEqual(errData.error, 'Ebook not found');
    });
  });

  describe('Book Metadata & Chapter Updates (/api/ebooks/:id)', () => {
    it('creates or updates a book via PUT /api/ebooks/:id and preserves ID immutability', async () => {
      const syntheticId = 'synthetic-test-book-' + Date.now();
      const payload = {
        title: 'كتاب أنظمة العد والحاسب الآلي التجريبي',
        category: 'علوم الحاسب',
        grade_level: 'الصف الثاني الإعدادي',
        price: 50,
      };

      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${syntheticId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 200);
      const updated = await res.json();
      assert.strictEqual(updated.id, syntheticId, 'ID must remain immutable');
      assert.strictEqual(updated.title, payload.title);
      assert.strictEqual(updated.price, 50);

      // Verify persistence via GET
      const verifyRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${syntheticId}`);
      assert.strictEqual(verifyRes.status, 200);
      const fetched = await verifyRes.json();
      assert.strictEqual(fetched.title, payload.title);
    });

    it('saves chapters via POST /api/ebooks/:id/chapters/save', async () => {
      const syntheticId = 'synthetic-test-book-' + Date.now();
      // First create book
      await fetch(`${serverInstance.baseUrl}/api/ebooks/${syntheticId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Book for Chapter Test' }),
      });

      // Save chapters
      const chaptersPayload = {
        chapters: [
          {
            id: 'ch-1',
            title: 'الوحدة الأولى: البوابات المنطقية',
            content: 'محتوى البوابات المنطقية والدوائر الرقمية.',
            summary: 'ملخص البوابات المنطقية',
          },
          {
            id: 'ch-2',
            title: 'الوحدة الثانية: نصف الجامع والجامع الكامل',
            content: 'محتوى الدوائر الحسابية نصف الجامع.',
            summary: 'ملخص الجامع الكامل',
          },
        ],
      };

      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks/${syntheticId}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chaptersPayload),
      });

      assert.strictEqual(res.status, 200);
      const saveRes = await res.json();
      assert.strictEqual(saveRes.success, true);

      // Verify book chapters count updated
      const verifyRes = await fetch(`${serverInstance.baseUrl}/api/ebooks/${syntheticId}`);
      const book = await verifyRes.json();
      assert.strictEqual(book.chapters.length, 2);
      assert.strictEqual(book.chapters[0].id, 'ch-1');
    });
  });

  describe('Creation Validation & Quota Guardrails (/api/ebooks)', () => {
    it('rejects POST /api/ebooks when promptText and files are missing with 400 Bad Request', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'علوم',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('Must provide either promptText, a file, or both'));
    });

    it('rejects POST /api/ebooks with null or empty payload with 400 Bad Request', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: '',
          fileUrl: '',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error);
    });
  });
});
