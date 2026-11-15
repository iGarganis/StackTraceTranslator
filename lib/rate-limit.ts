// ─────────────────────────────────────────────────────────────────────────────
// In-memory rate limiter: 20 requests per IP per 24 hours.
//
// IMPORTANT: This Map lives in the Node.js process — it resets on every server
// restart and does NOT work across multiple server instances (e.g. Vercel
// serverless functions that spin up in parallel).
//
// For production: replace this with Upstash Redis + @upstash/ratelimit.
// Upstash has a free tier and works perfectly with Vercel Edge/serverless.
// See: https://upstash.com/docs/redis/sdks/ratelimit/overview
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 20;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms) when the window resets
}

// Module-level singleton — persists across requests within the same process
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);

  // No entry or window has expired — start a fresh window
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: LIMIT - entry.count, resetAt: entry.resetAt };
}
