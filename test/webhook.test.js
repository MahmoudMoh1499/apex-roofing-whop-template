/**
 * Webhook Verification Comprehensive Test Suite
 * Tests all 8 security and edge-case boundary conditions
 */

import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { verifyWhopWebhook } from '../src/lib/webhookVerification.ts';

const RAW_KEY_BASE64 = 'dGVzdC1zZWNyZXQta2V5LTMyLWJ5dGVzLWxvbmctISE=';
const SECRET_WS = `ws_${RAW_KEY_BASE64}`;
const SECRET_WHSEC = `whsec_${RAW_KEY_BASE64}`;
const SECRET_RAW = RAW_KEY_BASE64;

function generateSignature(secret, id, ts, body) {
  let raw = secret;
  if (raw.startsWith('ws_')) raw = raw.slice(3);
  else if (raw.startsWith('whsec_')) raw = raw.slice(6);
  const keyBuf = Buffer.from(raw, 'base64');
  const toSign = `${id}.${ts}.${body}`;
  return crypto.createHmac('sha256', keyBuf).update(toSign).digest('base64');
}

test('1. Valid signature with ws_ prefix passes', () => {
  const body = JSON.stringify({ type: 'payment.succeeded', id: 'pay_001' });
  const id = 'msg_test_ws_001';
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = generateSignature(SECRET_WS, id, ts, body);

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${sig}`,
  }, SECRET_WS);

  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.error, undefined);
});

test('2. Valid signature with whsec_ prefix passes', () => {
  const body = JSON.stringify({ type: 'invoice.paid', id: 'inv_001' });
  const id = 'msg_test_whsec_002';
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = generateSignature(SECRET_WHSEC, id, ts, body);

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${sig}`,
  }, SECRET_WHSEC);

  assert.strictEqual(res.valid, true);
});

test('3. Valid signature with raw base64 secret passes', () => {
  const body = JSON.stringify({ type: 'lead.created', id: 'lead_001' });
  const id = 'msg_test_raw_003';
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = generateSignature(SECRET_RAW, id, ts, body);

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${sig}`,
  }, SECRET_RAW);

  assert.strictEqual(res.valid, true);
});

test('4. Multiple v1 signatures (key rotation scenario) passes if any matches', () => {
  const body = JSON.stringify({ type: 'payment.succeeded', id: 'pay_002' });
  const id = 'msg_test_rotation_004';
  const ts = Math.floor(Date.now() / 1000).toString();
  const oldSig = crypto.createHmac('sha256', Buffer.from('old-secret-32-bytes-padding-12345')).update(`${id}.${ts}.${body}`).digest('base64');
  const validSig = generateSignature(SECRET_WS, id, ts, body);

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${oldSig} v1,${validSig}`,
  }, SECRET_WS);

  assert.strictEqual(res.valid, true);
});

test('5. Malformed timestamps are rejected', () => {
  const body = '{"event":"test"}';
  const id = 'msg_test_005';
  const sig = 'v1,someValidLookingSignaturePadding1234567=';

  // String non-number
  const res1 = verifyWhopWebhook(body, { 'webhook-id': id, 'webhook-timestamp': 'not-a-number', 'webhook-signature': sig }, SECRET_WS);
  assert.strictEqual(res1.valid, false);
  assert.match(res1.error, /Malformed webhook-timestamp/);

  // Negative number
  const res2 = verifyWhopWebhook(body, { 'webhook-id': id, 'webhook-timestamp': '-500', 'webhook-signature': sig }, SECRET_WS);
  assert.strictEqual(res2.valid, false);

  // Float timestamp
  const res3 = verifyWhopWebhook(body, { 'webhook-id': id, 'webhook-timestamp': '1793988600.55', 'webhook-signature': sig }, SECRET_WS);
  assert.strictEqual(res3.valid, false);
});

test('6. Expired timestamp (> 300s drift) is rejected', () => {
  const body = '{"event":"test"}';
  const id = 'msg_test_006';
  const now = Math.floor(Date.now() / 1000);
  const oldTs = (now - 305).toString(); // 305s old
  const sig = generateSignature(SECRET_WS, id, oldTs, body);

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': oldTs,
    'webhook-signature': `v1,${sig}`,
  }, SECRET_WS);

  assert.strictEqual(res.valid, false);
  assert.match(res.error, /out of tolerance/);
});

test('7. Invalid signature length or truncated signature is rejected', () => {
  const body = '{"event":"test"}';
  const id = 'msg_test_007';
  const ts = Math.floor(Date.now() / 1000).toString();
  const truncatedSig = Buffer.from('short-sig').toString('base64'); // not 32 bytes

  const res = verifyWhopWebhook(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${truncatedSig}`,
  }, SECRET_WS);

  assert.strictEqual(res.valid, false);
});

test('8. Tampered raw body is rejected', () => {
  const originalBody = JSON.stringify({ type: 'payment.succeeded', amount: 500 });
  const tamperedBody = JSON.stringify({ type: 'payment.succeeded', amount: 500, extra: 'tampered' });
  const id = 'msg_test_008';
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = generateSignature(SECRET_WS, id, ts, originalBody);

  const res = verifyWhopWebhook(tamperedBody, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${sig}`,
  }, SECRET_WS);

  assert.strictEqual(res.valid, false);
  assert.match(res.error, /Cryptographic signature mismatch/);
});
