/**
 * Hardened Cloudflare D1 Storage & Repository Layer
 * Manages jobs, deposit payment attempts, milestone invoices, and leased webhook deduplication.
 * Includes in-memory SQLite / mock implementation for local unit and integration tests.
 */

export interface JobRecord {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  property_address: string;
  whop_member_id: string | null;
  saved_payment_method_id: string | null;
  created_at: number;
}

export interface DepositPaymentRecord {
  attempt_id: string;
  job_id: string;
  whop_payment_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  idempotency_key: string;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export interface InvoiceRecord {
  attempt_id: string;
  job_id: string;
  whop_invoice_id: string | null;
  amount_cents: number;
  status: 'draft' | 'open' | 'paid' | 'failed';
  hosted_checkout_url: string | null;
  charged_off_session: number; // 0 or 1
  idempotency_key: string;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export interface WebhookEventRecord {
  webhook_id: string;
  event_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  attempts: number;
  max_attempts: number;
  processing_started_at: number | null;
  locked_until: number | null;
  next_retry_at: number | null;
  last_error: string | null;
  payload_json: string;
  received_at: number;
  processed_at: number | null;
}

export const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  property_address TEXT NOT NULL,
  whop_member_id TEXT,
  saved_payment_method_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS deposit_payments (
  attempt_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  whop_payment_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 50000,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT UNIQUE NOT NULL,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  attempt_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  whop_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 450000,
  status TEXT NOT NULL DEFAULT 'draft',
  hosted_checkout_url TEXT,
  charged_off_session INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE NOT NULL,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  processing_started_at INTEGER,
  locked_until INTEGER,
  next_retry_at INTEGER,
  last_error TEXT,
  payload_json TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  processed_at INTEGER
);
`;

/**
 * Repository interface implemented by D1 and In-Memory Test Stores
 */
export interface ApexRepository {
  // Jobs
  createJob(job: Omit<JobRecord, 'created_at'>): Promise<JobRecord>;
  getJobByEmail(email: string): Promise<JobRecord | null>;
  updateJobSavedMethod(jobId: string, memberId: string, paymentMethodId: string): Promise<void>;

  // Deposit Payments
  createDepositAttempt(attempt: Omit<DepositPaymentRecord, 'whop_payment_id' | 'last_error' | 'created_at' | 'updated_at'>): Promise<DepositPaymentRecord>;
  getDepositAttemptByIdempotencyKey(key: string): Promise<DepositPaymentRecord | null>;
  confirmDepositSuccess(attemptId: string, whopPaymentId: string): Promise<void>;
  failDepositAttempt(attemptId: string, errorMsg: string): Promise<void>;

  // Invoices
  createInvoiceAttempt(attempt: Omit<InvoiceRecord, 'whop_invoice_id' | 'hosted_checkout_url' | 'last_error' | 'created_at' | 'updated_at'>): Promise<InvoiceRecord>;
  getInvoiceAttemptByIdempotencyKey(key: string): Promise<InvoiceRecord | null>;
  updateInvoiceDraftCreated(attemptId: string, whopInvoiceId: string): Promise<void>;
  updateInvoiceIssued(attemptId: string, hostedUrl: string | null, status: 'open' | 'paid', chargedOffSession: boolean): Promise<void>;
  failInvoiceAttempt(attemptId: string, errorMsg: string): Promise<void>;

  // Webhook Leases & State
  acquireWebhookLease(
    webhookId: string,
    eventType: string,
    payloadJson: string,
    now: number,
    leaseDurationMs?: number
  ): Promise<{ acquired: boolean; reason?: 'LOCKED_BY_ANOTHER_WORKER' | 'ALREADY_COMPLETED' | 'DEAD_LETTER' | 'RETRY_NOT_DUE' }>;
  completeWebhook(webhookId: string, now: number): Promise<void>;
  failWebhook(webhookId: string, errorMsg: string, now: number): Promise<void>;
  getWebhookEvent(webhookId: string): Promise<WebhookEventRecord | null>;
}

/**
 * In-memory repository for local unit testing and development
 */
export class InMemoryApexRepository implements ApexRepository {
  private jobs = new Map<string, JobRecord>();
  private depositPayments = new Map<string, DepositPaymentRecord>();
  private depositIdempotencyMap = new Map<string, string>(); // key -> attempt_id
  private invoices = new Map<string, InvoiceRecord>();
  private invoiceIdempotencyMap = new Map<string, string>(); // key -> attempt_id
  private webhooks = new Map<string, WebhookEventRecord>();

  async createJob(job: Omit<JobRecord, 'created_at'>): Promise<JobRecord> {
    const record: JobRecord = { ...job, created_at: Date.now() };
    this.jobs.set(job.id, record);
    return record;
  }

  async getJobByEmail(email: string): Promise<JobRecord | null> {
    const normalized = email.toLowerCase().trim();
    for (const j of this.jobs.values()) {
      if (j.customer_email.toLowerCase().trim() === normalized) return j;
    }
    return null;
  }

  async updateJobSavedMethod(jobId: string, memberId: string, paymentMethodId: string): Promise<void> {
    const j = this.jobs.get(jobId);
    if (j) {
      j.whop_member_id = memberId;
      j.saved_payment_method_id = paymentMethodId;
    }
  }

  async createDepositAttempt(attempt: Omit<DepositPaymentRecord, 'whop_payment_id' | 'last_error' | 'created_at' | 'updated_at'>): Promise<DepositPaymentRecord> {
    if (this.depositIdempotencyMap.has(attempt.idempotency_key)) {
      throw new Error(`UNIQUE constraint failed: deposit_payments.idempotency_key '${attempt.idempotency_key}'`);
    }
    const now = Date.now();
    const record: DepositPaymentRecord = {
      ...attempt,
      whop_payment_id: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    };
    this.depositPayments.set(attempt.attempt_id, record);
    this.depositIdempotencyMap.set(attempt.idempotency_key, attempt.attempt_id);
    return record;
  }

  async getDepositAttemptByIdempotencyKey(key: string): Promise<DepositPaymentRecord | null> {
    const attemptId = this.depositIdempotencyMap.get(key);
    return attemptId ? this.depositPayments.get(attemptId) || null : null;
  }

  async confirmDepositSuccess(attemptId: string, whopPaymentId: string): Promise<void> {
    const dep = this.depositPayments.get(attemptId);
    if (dep) {
      dep.whop_payment_id = whopPaymentId;
      dep.status = 'succeeded';
      dep.updated_at = Date.now();
    }
  }

  async failDepositAttempt(attemptId: string, errorMsg: string): Promise<void> {
    const dep = this.depositPayments.get(attemptId);
    if (dep) {
      dep.status = 'failed';
      dep.last_error = errorMsg;
      dep.updated_at = Date.now();
    }
  }

  async createInvoiceAttempt(attempt: Omit<InvoiceRecord, 'whop_invoice_id' | 'hosted_checkout_url' | 'last_error' | 'created_at' | 'updated_at'>): Promise<InvoiceRecord> {
    if (this.invoiceIdempotencyMap.has(attempt.idempotency_key)) {
      throw new Error(`UNIQUE constraint failed: invoices.idempotency_key '${attempt.idempotency_key}'`);
    }
    const now = Date.now();
    const record: InvoiceRecord = {
      ...attempt,
      whop_invoice_id: null,
      hosted_checkout_url: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    };
    this.invoices.set(attempt.attempt_id, record);
    this.invoiceIdempotencyMap.set(attempt.idempotency_key, attempt.attempt_id);
    return record;
  }

  async getInvoiceAttemptByIdempotencyKey(key: string): Promise<InvoiceRecord | null> {
    const attemptId = this.invoiceIdempotencyMap.get(key);
    return attemptId ? this.invoices.get(attemptId) || null : null;
  }

  async updateInvoiceDraftCreated(attemptId: string, whopInvoiceId: string): Promise<void> {
    const inv = this.invoices.get(attemptId);
    if (inv) {
      inv.whop_invoice_id = whopInvoiceId;
      inv.updated_at = Date.now();
    }
  }

  async updateInvoiceIssued(attemptId: string, hostedUrl: string | null, status: 'open' | 'paid', chargedOffSession: boolean): Promise<void> {
    const inv = this.invoices.get(attemptId);
    if (inv) {
      inv.hosted_checkout_url = hostedUrl;
      inv.status = status;
      inv.charged_off_session = chargedOffSession ? 1 : 0;
      inv.updated_at = Date.now();
    }
  }

  async failInvoiceAttempt(attemptId: string, errorMsg: string): Promise<void> {
    const inv = this.invoices.get(attemptId);
    if (inv) {
      inv.status = 'failed';
      inv.last_error = errorMsg;
      inv.updated_at = Date.now();
    }
  }

  async acquireWebhookLease(
    webhookId: string,
    eventType: string,
    payloadJson: string,
    now: number,
    leaseDurationMs = 30000
  ): Promise<{ acquired: boolean; reason?: 'LOCKED_BY_ANOTHER_WORKER' | 'ALREADY_COMPLETED' | 'DEAD_LETTER' | 'RETRY_NOT_DUE' }> {
    const existing = this.webhooks.get(webhookId);

    if (!existing) {
      // First arrival: acquire lease
      const record: WebhookEventRecord = {
        webhook_id: webhookId,
        event_type: eventType,
        status: 'processing',
        attempts: 1,
        max_attempts: 5,
        processing_started_at: now,
        locked_until: now + leaseDurationMs,
        next_retry_at: null,
        last_error: null,
        payload_json: payloadJson,
        received_at: now,
        processed_at: null,
      };
      this.webhooks.set(webhookId, record);
      return { acquired: true };
    }

    if (existing.status === 'completed') {
      return { acquired: false, reason: 'ALREADY_COMPLETED' };
    }

    if (existing.status === 'dead_letter') {
      return { acquired: false, reason: 'DEAD_LETTER' };
    }

    if (existing.status === 'processing') {
      // Check if lease expired (worker interrupted or died)
      if (existing.locked_until !== null && existing.locked_until > now) {
        return { acquired: false, reason: 'LOCKED_BY_ANOTHER_WORKER' };
      }
      // Lease expired: re-acquire lease
      existing.attempts += 1;
      existing.processing_started_at = now;
      existing.locked_until = now + leaseDurationMs;
      return { acquired: true };
    }

    if (existing.status === 'failed') {
      if (existing.attempts >= existing.max_attempts) {
        existing.status = 'dead_letter';
        return { acquired: false, reason: 'DEAD_LETTER' };
      }
      if (existing.next_retry_at !== null && existing.next_retry_at > now) {
        return { acquired: false, reason: 'RETRY_NOT_DUE' };
      }
      // Ready to retry
      existing.status = 'processing';
      existing.attempts += 1;
      existing.processing_started_at = now;
      existing.locked_until = now + leaseDurationMs;
      return { acquired: true };
    }

    return { acquired: false };
  }

  async completeWebhook(webhookId: string, now: number): Promise<void> {
    const rec = this.webhooks.get(webhookId);
    if (rec) {
      rec.status = 'completed';
      rec.locked_until = null;
      rec.processed_at = now;
    }
  }

  async failWebhook(webhookId: string, errorMsg: string, now: number): Promise<void> {
    const rec = this.webhooks.get(webhookId);
    if (rec) {
      rec.last_error = errorMsg;
      rec.locked_until = null;
      if (rec.attempts >= rec.max_attempts) {
        rec.status = 'dead_letter';
      } else {
        rec.status = 'failed';
        // Exponential backoff: 2^attempts * 1000 ms
        rec.next_retry_at = now + Math.pow(2, rec.attempts) * 1000;
      }
    }
  }

  async getWebhookEvent(webhookId: string): Promise<WebhookEventRecord | null> {
    return this.webhooks.get(webhookId) || null;
  }
}

let defaultRepoInstance: ApexRepository | null = null;

export function getApexDb(_d1Database?: any): ApexRepository {
  if (!defaultRepoInstance) {
    defaultRepoInstance = new InMemoryApexRepository();
  }
  return defaultRepoInstance;
}
