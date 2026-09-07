// In-memory rate limiter — no external dependencies required.
// Tracks request counts per IP+route with a sliding window.

const stores = new Map();

function createLimiter({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const key = `${windowMs}:${max}`;
  if (!stores.has(key)) {
    stores.set(key, new Map());
    // Periodic cleanup every window
    setInterval(() => {
      const store = stores.get(key);
      if (!store) return;
      const now = Date.now();
      for (const [k, entry] of store) {
        if (now - entry.windowStart > windowMs) store.delete(k);
      }
    }, windowMs);
  }
  const store = stores.get(key);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const route = req.route ? req.route.path : req.path;
    const id = `${ip}:${route}`;
    const now = Date.now();

    let entry = store.get(id);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      store.set(id, entry);
    }

    entry.count++;

    const remaining = Math.max(0, max - entry.count);
    const retryAfter = Math.ceil(
      (windowMs - (now - entry.windowStart)) / 1000
    );

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(retryAfter));

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        error: { message: "تم تجاوز الحد المسموح. يرجى المحاولة لاحقًا." },
      });
    }

    next();
  };
}

// Auth routes: 10 requests per 15 minutes per IP per route
export const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

// Password reset: 5 requests per 15 minutes
export const passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

// General API: 60 requests per 15 minutes
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

export { createLimiter };
