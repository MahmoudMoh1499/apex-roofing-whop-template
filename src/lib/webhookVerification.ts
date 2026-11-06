/**
 * Whop Webhook Signature Verification
 * Implements the official Standard Webhooks specification.
 * Fully compatible with Node.js and Cloudflare Workers runtime.
 */

import crypto from 'node:crypto';

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

export interface WebhookHeaders {
  'webhook-id'?: string;
  'webhook-timestamp'?: string;
  'webhook-signature'?: string;
  [key: string]: string | undefined;
}

/**
 * Decodes a Whop webhook secret into a raw byte buffer.
 * Supports:
 * - 'ws_' prefix (Whop dashboard format)
 * - 'whsec_' prefix (Standard Webhooks format)
 * - Raw Base64 string
 */
export function decodeWebhookSecret(secret: string): Buffer {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Invalid secret: secret must be a non-empty string');
  }

  let raw = secret.trim();
  if (raw.startsWith('ws_')) {
    raw = raw.slice(3);
  } else if (raw.startsWith('whsec_')) {
    raw = raw.slice(6);
  }

  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length > 0) return buf;
  } catch {
    // Fallback if not valid base64
  }

  return Buffer.from(raw, 'utf8');
}

/**
 * Verifies a Whop webhook request according to the Standard Webhooks specification.
 * 
 * Contract:
 * 1. Checks presence of 'webhook-id', 'webhook-timestamp', and 'webhook-signature'.
 * 2. Enforces positive integer timestamp within 300s (5-minute) drift tolerance.
 * 3. Extracts all 'v1' signatures from space-separated list.
 * 4. Signs canonical string: `${webhookId}.${webhookTimestamp}.${rawBody}`
 * 5. Compares using constant-time timingSafeEqual.
 */
export function verifyWhopWebhook(
  rawBody: string,
  headers: WebhookHeaders,
  secret: string,
  nowEpochSeconds?: number
): WebhookVerificationResult {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];
  const sigHeader = headers['webhook-signature'];

  if (!id || typeof id !== 'string' || !ts || typeof ts !== 'string' || !sigHeader || typeof sigHeader !== 'string') {
    return { valid: false, error: 'Missing required webhook verification headers (webhook-id, webhook-timestamp, webhook-signature)' };
  }

  // 1. Strict Timestamp Validation
  const now = nowEpochSeconds !== undefined ? nowEpochSeconds : Math.floor(Date.now() / 1000);
  const tsNum = parseInt(ts, 10);
  if (isNaN(tsNum) || ts !== tsNum.toString() || tsNum < 0) {
    return { valid: false, error: 'Malformed webhook-timestamp: must be a positive integer' };
  }

  if (Math.abs(now - tsNum) > 300) {
    return { valid: false, error: `Webhook timestamp out of tolerance: ${Math.abs(now - tsNum)}s exceeds 300s maximum drift` };
  }

  // 2. Extract v1 signatures from space-separated list
  const signatures = sigHeader.split(' ').flatMap((part) => {
    const idx = part.indexOf(',');
    if (idx === -1) return [];
    const version = part.slice(0, idx);
    const sig = part.slice(idx + 1);
    return version === 'v1' && sig ? [sig] : [];
  });

  if (signatures.length === 0) {
    return { valid: false, error: 'No valid v1 signature found in webhook-signature header' };
  }

  // 3. Compute expected HMAC
  let keyBuf: Buffer;
  try {
    keyBuf = decodeWebhookSecret(secret);
  } catch (err) {
    return { valid: false, error: `Invalid webhook secret: ${(err as Error).message}` };
  }

  const toSign = `${id}.${ts}.${rawBody}`;
  const computedHmac = crypto.createHmac('sha256', keyBuf).update(toSign).digest();

  // 4. Constant-time verification across provided v1 signatures
  for (const sig of signatures) {
    try {
      const sigBuf = Buffer.from(sig, 'base64');
      if (sigBuf.length !== 32) {
        continue; // SHA-256 digests must be exactly 32 bytes
      }
      if (crypto.timingSafeEqual(sigBuf, computedHmac)) {
        return { valid: true };
      }
    } catch {
      continue;
    }
  }

  return { valid: false, error: 'Cryptographic signature mismatch: raw payload or secret does not match' };
}
