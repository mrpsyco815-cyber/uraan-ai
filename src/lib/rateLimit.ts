/**
 * Client-side rate limiter — prevents accidental spam and basic abuse.
 * NOT a security boundary (server/RLS is the real gate); this is UX protection.
 */

const buckets = new Map<string, number[]>()

export function checkRateLimit(key: string, maxCalls: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const calls = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (calls.length >= maxCalls) {
    const oldest = calls[0]
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) }
  }
  calls.push(now)
  buckets.set(key, calls)
  return { allowed: true, retryAfterMs: 0 }
}

export function rateLimitError(retryAfterMs: number): string {
  const s = Math.ceil(retryAfterMs / 1000)
  return `Please wait ${s} second${s === 1 ? '' : 's'} before trying again.`
}

// Presets
export const LIMITS = {
  chat: { max: 10, windowMs: 60_000 },        // 10 messages/min
  ai: { max: 20, windowMs: 60_000 },          // 20 AI calls/min
  mentorshipRequest: { max: 5, windowMs: 3_600_000 }, // 5 requests/hour
} as const
