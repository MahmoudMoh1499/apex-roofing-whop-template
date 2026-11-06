/**
 * Rate Limiter for Whop Websites (Cloudflare Workers Runtime)
 * 
 * NOTE ON RUNTIME ARCHITECTURE:
 * Whop Websites run as Vite apps on Cloudflare Workers edge nodes.
 * An in-memory JavaScript Map is node-local and ephemeral; it is NOT shared across edge PoPs
 * and is wiped upon worker cold-starts.
 * 
 * For production deployments on Whop hosting:
 * - When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, this module uses
 *   persistent distributed Redis REST calls to synchronize rate limiting globally.
 * - When running locally or offline, it falls back to an in-memory sliding window with an explicit warning.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  isPersistent: boolean;
}

const memoryRateLimitMap = new Map<string, number[]>();

export async function checkRateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 10 * 60 * 1000
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Persistent Distributed Rate Limiting via Redis / KV REST API (Cloudflare Workers safe)
  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:lead:${ip}`;
      const now = Date.now();
      const clearBefore = now - windowMs;

      // Pipeline Redis commands: remove expired, count, add current timestamp, set TTL
      const pipelineUrl = `${redisUrl}/pipeline`;
      const response = await fetch(pipelineUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['ZREMRANGEBYSCORE', key, 0, clearBefore],
          ['ZCARD', key],
          ['ZADD', key, now, `${now}-${Math.random()}`],
          ['PEXPIRE', key, windowMs],
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const currentCount = (results && results[1] && results[1].result) || 0;
        const allowed = currentCount < limit;

        return {
          allowed,
          remaining: Math.max(0, limit - currentCount - 1),
          resetMs: windowMs,
          isPersistent: true,
        };
      }
    } catch (err) {
      console.warn('[RateLimiter] Persistent rate limit check failed, falling back to local memory:', err);
    }
  }

  // 2. In-Memory Fallback (Local Node development only)
  const now = Date.now();
  const timestamps = memoryRateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    memoryRateLimitMap.set(ip, validTimestamps);
    return {
      allowed: false,
      remaining: 0,
      resetMs: windowMs - (now - validTimestamps[0]),
      isPersistent: false,
    };
  }

  validTimestamps.push(now);
  memoryRateLimitMap.set(ip, validTimestamps);

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetMs: windowMs,
    isPersistent: false,
  };
}

export function resetRateLimits(): void {
  memoryRateLimitMap.clear();
}
