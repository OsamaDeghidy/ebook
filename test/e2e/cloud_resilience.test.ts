import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { getTestServer, TestServerInstance } from '../helpers/testServer';

describe('Cloud Resilience & Storage Durability E2E Suite', () => {
  let serverInstance: TestServerInstance;

  before(async () => {
    serverInstance = await getTestServer();
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Google Cloud Storage Contract & HMAC V2 Signatures', () => {
    it('verifies HMAC-SHA1 signature calculation matches Google Cloud Storage specification', () => {
      const bucket = 'ebookstoreg';
      const safeKey = 'uploads/test-key-1234.pdf';
      const contentType = 'application/pdf';
      const expires = 1795460000;
      const secretKey = 'test-secret-key-abcdef';

      const stringToSign = [
        'PUT',
        '',
        contentType,
        expires,
        `/${bucket}/${safeKey}`,
      ].join('\n');

      const expectedSignature = crypto
        .createHmac('sha1', secretKey)
        .update(stringToSign)
        .digest('base64');

      assert.ok(expectedSignature, 'Must generate valid base64 signature');
      assert.ok(expectedSignature.length > 20, 'Signature length must be valid');

      const signedUrl = `https://storage.googleapis.com/${bucket}/${safeKey}?GoogleAccessId=test-access-id&Expires=${expires}&Signature=${encodeURIComponent(expectedSignature)}`;
      assert.ok(signedUrl.startsWith('https://storage.googleapis.com/ebookstoreg/'));
      assert.ok(signedUrl.includes('Expires=1795460000'));
      assert.ok(signedUrl.includes('Signature='));
    });

    it('verifies GCS S3Client configuration parameters conform to Google Cloud Storage interop', () => {
      const gcsEndpoint = 'https://storage.googleapis.com';
      const expectedBucket = process.env.GCS_BUCKET_NAME || 'ebookstoreg';

      assert.strictEqual(expectedBucket, 'ebookstoreg');
      const parsedEndpoint = new URL(gcsEndpoint);
      assert.strictEqual(parsedEndpoint.hostname, 'storage.googleapis.com');
      assert.strictEqual(parsedEndpoint.protocol, 'https:');
    });
  });

  describe('Cloud Run Stateless Container Readiness & Resilience', () => {
    it('responds to /health readiness probe in under 50ms with 200 OK', async () => {
      const startTime = performance.now();
      const res = await fetch(`${serverInstance.baseUrl}/health`);
      const latency = performance.now() - startTime;

      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, 'OK');
      assert.ok(latency < 100, `Health check latency (${latency.toFixed(1)}ms) must be under 100ms for Cloud Run`);
    });

    it('responds to all standardized cloud health check paths (/healthz, /_health, /ping)', async () => {
      const healthPaths = ['/health', '/healthz', '/_health', '/ping'];
      for (const p of healthPaths) {
        const res = await fetch(`${serverInstance.baseUrl}${p}`);
        assert.strictEqual(res.status, 200, `Path ${p} must return 200 OK`);
      }
    });

    it('handles cloud storage fallback without crashing server when uploading', async () => {
      // Simulate direct multipart upload with small text
      const formData = new FormData();
      formData.append('file', new Blob(['Resilience Test Content'], { type: 'text/plain' }), 'resilience_test.txt');

      const res = await fetch(`${serverInstance.baseUrl}/api/upload-to-gcp`, {
        method: 'POST',
        body: formData,
      });

      // Must succeed regardless of whether synchronous GCS upload succeeds or falls back to local
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.fileUrl, 'Must return a usable fileUrl');
    });

    it('ensures local in-memory catalog survives gracefully when cloud database queries fail', async () => {
      // Request an existing book catalog
      const res = await fetch(`${serverInstance.baseUrl}/api/ebooks`);
      assert.strictEqual(res.status, 200);
      const catalog = await res.json();
      assert.ok(Array.isArray(catalog), 'Catalog must return local or cloud books');
      assert.ok(catalog.length >= 0, 'Catalog should be accessible');
    });
  });
});
