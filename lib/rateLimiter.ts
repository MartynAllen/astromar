// Shared shape for every route's in-memory, per-instance rate limiter
// (checkout, geocode, contact). In-memory and per-instance is a deliberate
// tradeoff for a personal blog's traffic — it resets on cold start and
// doesn't share state across concurrent serverless instances, which is
// fine here; it isn't meant to be bulletproof, just to blunt casual
// single-client abuse without reaching for external infra like Redis.
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requestLog = new Map<string, { count: number; resetAt: number }>();

  function isRateLimited(key: string): { limited: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const entry = requestLog.get(key);

    if (!entry || now >= entry.resetAt) {
      requestLog.set(key, { count: 1, resetAt: now + windowMs });
      return { limited: false, retryAfterSeconds: 0 };
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { limited: false, retryAfterSeconds: 0 };
  }

  // Prevents unbounded growth from one-off keys across a long-lived
  // instance. Called probabilistically by each route rather than on a
  // timer, so it costs nothing on the vast majority of requests.
  function pruneExpired() {
    const now = Date.now();
    for (const [key, entry] of requestLog) {
      if (now >= entry.resetAt) requestLog.delete(key);
    }
  }

  return { isRateLimited, pruneExpired };
}
