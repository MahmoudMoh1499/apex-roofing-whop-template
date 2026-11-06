import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Build bundle contains zero private API keys or secrets', () => {
  const distDir = path.resolve('dist/client');
  assert.ok(fs.existsSync(distDir), 'dist/client must exist');

  function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Assert no real secret keys or test keys prefixed with whop_live_ or whop_test_
        assert.ok(!content.includes('whop_live_'), `File ${file} leaked whop_live_ credential!`);
        assert.ok(!content.includes('whop_test_'), `File ${file} leaked whop_test_ credential!`);
      }
    }
  }

  checkDir(distDir);
});

test('Invoice API rejects unauthorized requests with missing or invalid x-admin-key', async () => {
  const { handleApiRoute } = await import('../src/server/api.ts');

  // Request without header
  const reqNoAuth = {
    method: 'POST',
    url: '/api/invoices',
    body: {
      recipientEmails: ['customer@example.com'],
      items: [{ quantity: 1, variant: { title: 'Test', price: 100, currency: 'usd' } }],
    },
  };
  const resNoAuth = await handleApiRoute(reqNoAuth);
  assert.equal(resNoAuth.status, 401);
  assert.ok(resNoAuth.data.error.includes('Unauthorized'));

  // Request with invalid key
  const reqBadAuth = {
    method: 'POST',
    url: '/api/invoices',
    headers: { 'x-admin-key': 'attacker-forged-key' },
    body: {
      recipientEmails: ['customer@example.com'],
      items: [{ quantity: 1, variant: { title: 'Test', price: 100, currency: 'usd' } }],
    },
  };
  const resBadAuth = await handleApiRoute(reqBadAuth);
  assert.equal(resBadAuth.status, 401);
});

test('Invoice API rejects invalid paymentMethodId format', async () => {
  const { handleApiRoute } = await import('../src/server/api.ts');

  const req = {
    method: 'POST',
    url: '/api/invoices',
    headers: { 'x-admin-key': 'demo-admin-authorized' },
    body: {
      recipientEmails: ['customer@example.com'],
      paymentMethodId: 'card_not_whop_format_123',
      items: [{ quantity: 1, variant: { title: 'Test', price: 100, currency: 'usd' } }],
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 400);
  assert.ok(res.data.error.includes('Invalid paymentMethodId format'));
});

test('Invoice API enforces customer payment-method ownership before charging', async () => {
  const { handleApiRoute } = await import('../src/server/api.ts');

  // Attempting to charge customer A's invoice using customer B's payment method
  const reqMismatchedOwner = {
    method: 'POST',
    url: '/api/invoices',
    headers: { 'x-admin-key': 'demo-admin-authorized' },
    body: {
      recipientEmails: ['victim@example.com'],
      customerEmail: 'attacker@example.com', // Mismatch between billed recipient and payment method owner
      paymentMethodId: 'payt_victim_saved_card_123',
      chargeAutomatically: true,
      items: [{ quantity: 1, variant: { title: 'Test', price: 100, currency: 'usd' } }],
    },
  };

  const res = await handleApiRoute(reqMismatchedOwner);
  assert.equal(res.status, 403);
  assert.ok(res.data.error.toLowerCase().includes('ownership verification failed'));
});

