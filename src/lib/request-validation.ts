import { isIP } from "node:net";
import { z } from "zod";

const MAX_BODY_BYTES = 16 * 1024;
const email = z.email().max(320);

export const contactInput = z.object({
  name: z.string().trim().min(1).max(200),
  email,
  subject: z.string().trim().min(1).max(500).regex(/^[^\r\n]+$/),
  message: z.string().trim().min(1).max(5000),
});

export const inviteInput = z.object({ to_email: email });

export const donationInput = z.object({
  amount: z.number().min(1).max(1_000_000).multipleOf(0.01),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  donationType: z.enum(["one-time", "monthly"]).default("one-time"),
  useFallback: z.boolean().default(false),
});

export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;

  try {
    let bytes = 0;
    let body = "";
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(body + decoder.decode());
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export function getRateLimitKey(request: Request): string {
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.trim() : null;
  return ip && isIP(ip) ? ip : "unknown";
}

export function createRateLimiter(limit: number, windowMs: number, maxKeys = 10_000) {
  const buckets = new Map<string, { count: number; expires: number }>();
  let nextCleanup = 0;

  return (key: string): boolean => {
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [id, bucket] of buckets) {
        if (bucket.expires <= now) buckets.delete(id);
      }
      nextCleanup = now + windowMs;
    }

    const bucket = buckets.get(key);
    if (bucket && bucket.expires > now) {
      if (bucket.count >= limit) return true;
      bucket.count++;
      return false;
    }
    if (!bucket && buckets.size >= maxKeys) return true;

    buckets.set(key, { count: 1, expires: now + windowMs });
    return false;
  };
}
