import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getTestServer, TestServerInstance } from '../helpers/testServer';

describe('Upload Endpoints Integration Suite', () => {
  let serverInstance: TestServerInstance;

  before(async () => {
    serverInstance = await getTestServer();
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Direct GCS Signed Upload URL (/api/gcp/signed-upload-url)', () => {
    it('generates a valid HMAC V2 signed URL for an Arabic filename', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/gcp/signed-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'مذكرة_أنظمة_العد_الرقمية.pdf',
          fileType: 'application/pdf',
        }),
      });

      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.signedUrl, 'Response must include signedUrl');
      assert.ok(data.publicUrl, 'Response must include publicUrl');
      assert.ok(data.key.startsWith('uploads/'), 'Key must reside in uploads/ path');
      assert.strictEqual(data.bucket, process.env.GCS_BUCKET_NAME || 'ebookstoreg');

      // Verify signed URL query parameters
      const parsedUrl = new URL(data.signedUrl);
      assert.ok(parsedUrl.searchParams.has('GoogleAccessId'), 'Signed URL must contain GoogleAccessId');
      assert.ok(parsedUrl.searchParams.has('Expires'), 'Signed URL must contain Expires');
      assert.ok(parsedUrl.searchParams.has('Signature'), 'Signed URL must contain Signature');
    });

    it('generates a signed URL for English CS documents', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/gcp/signed-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'computer_architecture_lesson.pdf',
          fileType: 'application/pdf',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.signedUrl.includes('storage.googleapis.com'));
    });

    it('rejects requests with missing fileName with 400 Bad Request', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/gcp/signed-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'application/pdf',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('fileName is required'));
    });
  });

  describe('Multipart GCP & Local Upload (/api/upload-to-gcp)', () => {
    it('uploads synthetic Arabic text memo with UTF-8 filename', async () => {
      const fixturePath = path.resolve(process.cwd(), 'test/fixtures/memos/arabic_stem_lesson.txt');
      const fileBytes = fs.readFileSync(fixturePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBytes], { type: 'text/plain' }), 'arabic_stem_lesson.txt');

      const res = await fetch(`${serverInstance.baseUrl}/api/upload-to-gcp`, {
        method: 'POST',
        body: formData,
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.fileUrl, 'Must return fileUrl');
      assert.ok(data.localFileUrl, 'Must return localFileUrl');
      assert.strictEqual(data.sizeBytes, fileBytes.length);
    });

    it('uploads synthetic minimal valid PDF document', async () => {
      const fixturePath = path.resolve(process.cwd(), 'test/fixtures/memos/minimal_valid.pdf');
      const fileBytes = fs.readFileSync(fixturePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBytes], { type: 'application/pdf' }), 'minimal_valid.pdf');

      const res = await fetch(`${serverInstance.baseUrl}/api/upload-to-gcp`, {
        method: 'POST',
        body: formData,
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.fileType.includes('pdf'));
    });

    it('rejects multipart upload without file with 400 Bad Request', async () => {
      const formData = new FormData();
      // No file appended
      formData.append('description', 'dummy note');

      const res = await fetch(`${serverInstance.baseUrl}/api/upload-to-gcp`, {
        method: 'POST',
        body: formData,
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('لم يتم استلام أي ملف للرفع'));
    });

    it('handles malformed / corrupt PDF gracefully without crashing server', async () => {
      const fixturePath = path.resolve(process.cwd(), 'test/fixtures/memos/corrupt.pdf');
      const fileBytes = fs.readFileSync(fixturePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBytes], { type: 'application/pdf' }), 'corrupt.pdf');

      const res = await fetch(`${serverInstance.baseUrl}/api/upload-to-gcp`, {
        method: 'POST',
        body: formData,
      });

      // Storage handles raw binary uploads regardless of internal document parse status
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.fileUrl);
    });
  });
});
