/**
 * Rate limiter ساده و درون‌حافظه‌ای.
 * محدودیت: چون درون‌حافظه‌ست، با ری‌استارت سرور یا در محیط چند-اینستنسی (چند سرور پشت لودبالانسر)
 * ریست می‌شود / همگام نیست. برای پروداکشن واقعی با چند سرور، باید با Redis جایگزین شود.
 * برای این پروژه (یک سرور، تک‌فروشنده) کفایت می‌کند.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

// جلوگیری از رشد بی‌نهایت حافظه: هر چند دقیقه سطل‌های منقضی را پاک کن
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
