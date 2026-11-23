import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTestServer, TestServerInstance } from '../helpers/testServer';

describe('Store & Payments Integration Suite', () => {
  let serverInstance: TestServerInstance;

  before(async () => {
    serverInstance = await getTestServer();
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  describe('Voucher Management & Redemption (/api/vouchers)', () => {
    it('retrieves voucher listing as an array', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/vouchers`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.vouchers), 'vouchers must be an array');
    });

    it('redeems universal master VIP pass code', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/vouchers/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'OSERA-PASS',
          bookId: 'book-math-101',
          userId: 'test-student-1',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.type, 'book_access');
      assert.ok(data.message.includes('بنجاح'));
    });

    it('redeems valid student center voucher pattern (SMP-...)', async () => {
      const uniqueCode = `SMP-STEM-${Date.now()}`;
      const res = await fetch(`${serverInstance.baseUrl}/api/vouchers/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: uniqueCode,
          bookId: 'book-physics-101',
          userEmail: 'student@example.com',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.type, 'book_access');
    });

    it('rejects empty or whitespace voucher code with 400 Bad Request', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/vouchers/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '   ',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('كود كارت الشحن'));
    });
  });

  describe('Wallet Operations & Balance (/api/wallet)', () => {
    it('retrieves user wallet balance and transaction history', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/wallet/balance/user-tester-wallet`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(typeof data.balance === 'number');
      assert.ok(Array.isArray(data.transactions));
    });

    it('rejects recharge with non-positive amount or missing user with 400', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/wallet/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '',
          amount: -50,
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('Invalid recharge amount'));
    });

    it('rejects withdrawal with invalid amount with 400', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-sample',
          amount: 0,
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('مبلغ السحب غير صحيح'));
    });
  });

  describe('Direct 1-Click Wallet Payment (/api/payment/wallet/pay)', () => {
    it('rejects payment request when userId or bookId are missing with 400', async () => {
      const res = await fetch(`${serverInstance.baseUrl}/api/payment/wallet/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '',
          bookId: '',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('غير مكتملة'));
    });

    it('rejects payment when wallet balance is insufficient for book price with 400', async () => {
      // Create a book with price 999
      const bookId = 'book-expensive-' + Date.now();
      await fetch(`${serverInstance.baseUrl}/api/ebooks/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Expensive Master Curriculum',
          price: 999,
        }),
      });

      const res = await fetch(`${serverInstance.baseUrl}/api/payment/wallet/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'broke-student-id-999',
          bookId,
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('لا يكفي لشراء هذا المقرر'));
    });
  });
});
