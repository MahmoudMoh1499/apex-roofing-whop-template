/**
 * D1 Schema & Repository Test Suite
 * Validates local attempt ID lifecycle, nullable Whop IDs, idempotency uniqueness,
 * and webhook lease locking, exponential backoff, and dead-letter handling.
 */

import test from 'node:test';
import assert from 'node:assert';
import { InMemoryApexRepository } from '../src/server/db.ts';

test('1. Local deposit attempt is created with NULL whop_payment_id and pending status', async () => {
  const repo = new InMemoryApexRepository();
  await repo.createJob({
    id: 'job_001',
    customer_name: 'Sarah Jenkins',
    customer_email: 'sarah.jenkins@example.com',
    customer_phone: '(512) 555-0149',
    property_address: '1044 Ridgeview Ter, Austin TX',
    whop_member_id: null,
    saved_payment_method_id: null,
  });

  const attempt = await repo.createDepositAttempt({
    attempt_id: 'dep_att_1793988600_001',
    job_id: 'job_001',
    amount_cents: 50000,
    currency: 'usd',
    status: 'pending',
    idempotency_key: 'idem_dep_001',
  });

  assert.strictEqual(attempt.attempt_id, 'dep_att_1793988600_001');
  assert.strictEqual(attempt.whop_payment_id, null);
  assert.strictEqual(attempt.status, 'pending');
  assert.strictEqual(attempt.amount_cents, 50000);

  // Upon Whop confirmation:
  await repo.confirmDepositSuccess(attempt.attempt_id, 'pay_whop_12345');
  const confirmed = await repo.getDepositAttemptByIdempotencyKey('idem_dep_001');
  assert.strictEqual(confirmed?.whop_payment_id, 'pay_whop_12345');
  assert.strictEqual(confirmed?.status, 'succeeded');
});

test('2. Deposit idempotency key enforces uniqueness on repeated attempts', async () => {
  const repo = new InMemoryApexRepository();
  await repo.createJob({
    id: 'job_002',
    customer_name: 'Sarah Jenkins',
    customer_email: 'sarah.jenkins@example.com',
    customer_phone: '(512) 555-0149',
    property_address: '1044 Ridgeview Ter',
    whop_member_id: null,
    saved_payment_method_id: null,
  });

  await repo.createDepositAttempt({
    attempt_id: 'dep_att_001',
    job_id: 'job_002',
    amount_cents: 50000,
    currency: 'usd',
    status: 'pending',
    idempotency_key: 'duplicate_key_123',
  });

  // Second submission with exact same idempotency key must reject
  await assert.rejects(
    async () => {
      await repo.createDepositAttempt({
        attempt_id: 'dep_att_002',
        job_id: 'job_002',
        amount_cents: 50000,
        currency: 'usd',
        status: 'pending',
        idempotency_key: 'duplicate_key_123',
      });
    },
    /UNIQUE constraint failed/
  );
});

test('3. Invoice attempt starts with NULL whop_invoice_id and NULL hosted_checkout_url', async () => {
  const repo = new InMemoryApexRepository();
  await repo.createJob({
    id: 'job_003',
    customer_name: 'Marcus Vance',
    customer_email: 'marcus.vance@example.com',
    customer_phone: '(512) 555-0198',
    property_address: '4502 Ridgeview Dr',
    whop_member_id: 'mber_001',
    saved_payment_method_id: 'payt_001',
  });

  const invAttempt = await repo.createInvoiceAttempt({
    attempt_id: 'inv_att_001',
    job_id: 'job_003',
    amount_cents: 450000,
    status: 'draft',
    charged_off_session: 0,
    idempotency_key: 'idem_inv_001',
  });

  assert.strictEqual(invAttempt.whop_invoice_id, null);
  assert.strictEqual(invAttempt.hosted_checkout_url, null);
  assert.strictEqual(invAttempt.status, 'draft');

  // After Whop drafts the invoice:
  await repo.updateInvoiceDraftCreated(invAttempt.attempt_id, 'inv_whop_9988');
  // After Whop issues the invoice:
  await repo.updateInvoiceIssued(invAttempt.attempt_id, 'https://whop.com/checkout/invoice/inv_whop_9988', 'paid', true);

  const updated = await repo.getInvoiceAttemptByIdempotencyKey('idem_inv_001');
  assert.strictEqual(updated?.whop_invoice_id, 'inv_whop_9988');
  assert.strictEqual(updated?.hosted_checkout_url, 'https://whop.com/checkout/invoice/inv_whop_9988');
  assert.strictEqual(updated?.status, 'paid');
  assert.strictEqual(updated?.charged_off_session, 1);
});

test('4. Webhook lease locking prevents concurrent duplicate execution', async () => {
  const repo = new InMemoryApexRepository();
  const now = 1000000;
  const webhookId = 'msg_concurrent_001';

  // Worker 1 arrives and acquires lease
  const r1 = await repo.acquireWebhookLease(webhookId, 'payment.succeeded', '{}', now, 30000);
  assert.strictEqual(r1.acquired, true);

  // Worker 2 arrives concurrently (at now + 500ms) with same webhookId
  const r2 = await repo.acquireWebhookLease(webhookId, 'payment.succeeded', '{}', now + 500, 30000);
  assert.strictEqual(r2.acquired, false);
  assert.strictEqual(r2.reason, 'LOCKED_BY_ANOTHER_WORKER');

  // Worker 1 finishes successfully
  await repo.completeWebhook(webhookId, now + 1200);

  // Worker 3 arrives later after completion: must reject as already completed
  const r3 = await repo.acquireWebhookLease(webhookId, 'payment.succeeded', '{}', now + 2000, 30000);
  assert.strictEqual(r3.acquired, false);
  assert.strictEqual(r3.reason, 'ALREADY_COMPLETED');
});

test('5. Webhook worker crash / lease expiration allows re-acquisition', async () => {
  const repo = new InMemoryApexRepository();
  const now = 1000000;
  const webhookId = 'msg_crash_002';

  // Worker 1 acquires 30s lease (expires at now + 30000)
  const r1 = await repo.acquireWebhookLease(webhookId, 'payment.succeeded', '{}', now, 30000);
  assert.strictEqual(r1.acquired, true);

  // Worker 1 crashes. Time advances 35s to now + 35000 (lease expired)
  const r2 = await repo.acquireWebhookLease(webhookId, 'payment.succeeded', '{}', now + 35000, 30000);
  assert.strictEqual(r2.acquired, true); // Re-acquired lease!

  const event = await repo.getWebhookEvent(webhookId);
  assert.strictEqual(event?.attempts, 2);
});

test('6. Webhook failure triggers exponential backoff and transitions to dead_letter at max_attempts', async () => {
  const repo = new InMemoryApexRepository();
  let now = 1000000;
  const webhookId = 'msg_fail_003';

  // Attempt 1: acquires, then fails
  await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now, 30000);
  await repo.failWebhook(webhookId, 'Database timeout', now);

  const e1 = await repo.getWebhookEvent(webhookId);
  assert.strictEqual(e1?.status, 'failed');
  assert.strictEqual(e1?.attempts, 1);
  // Backoff: 2^1 * 1000ms = 2000ms -> next retry at now + 2000
  assert.strictEqual(e1?.next_retry_at, now + 2000);

  // Retry too early (now + 500ms): rejected
  const early = await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now + 500, 30000);
  assert.strictEqual(early.acquired, false);
  assert.strictEqual(early.reason, 'RETRY_NOT_DUE');

  // Retry when due (now + 2500ms)
  now += 2500;
  const r2 = await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now, 30000);
  assert.strictEqual(r2.acquired, true);

  // Fail through max_attempts (5 attempts)
  await repo.failWebhook(webhookId, 'Error 2', now);
  now += 5000;
  await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now, 30000);
  await repo.failWebhook(webhookId, 'Error 3', now);
  now += 10000;
  await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now, 30000);
  await repo.failWebhook(webhookId, 'Error 4', now);
  now += 20000;
  await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now, 30000);
  await repo.failWebhook(webhookId, 'Terminal failure', now); // 5th failure

  const dead = await repo.getWebhookEvent(webhookId);
  assert.strictEqual(dead?.status, 'dead_letter');

  // Further attempts rejected permanently
  const rFinal = await repo.acquireWebhookLease(webhookId, 'invoice.paid', '{}', now + 50000, 30000);
  assert.strictEqual(rFinal.acquired, false);
  assert.strictEqual(rFinal.reason, 'DEAD_LETTER');
});
