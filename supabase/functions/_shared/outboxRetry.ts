export const MAX_DELIVERY_ATTEMPTS = 4;

const TRANSIENT_STATUS_CODES = new Set([408, 409, 425, 429]);

export function isTransientDeliveryError(error: unknown) {
  const message = String(error).toLowerCase();
  const statusMatch = message.match(/_(\d{3})(?::|\b)/);
  const status = statusMatch ? Number(statusMatch[1]) : 0;
  if (TRANSIENT_STATUS_CODES.has(status) || (status >= 500 && status <= 599)) return true;
  return [
    "fetch failed",
    "networkerror",
    "network error",
    "connection reset",
    "connection refused",
    "temporarily unavailable",
    "timed out",
    "timeout",
  ].some((fragment) => message.includes(fragment));
}

export function retryDelaySeconds(attempts: number, retryAfterSeconds = 0) {
  const exponentialDelay = Math.min(15 * 60, 30 * 2 ** Math.max(0, attempts - 1));
  return Math.max(exponentialDelay, Math.min(15 * 60, retryAfterSeconds));
}

export function parseRetryAfterSeconds(response: Response) {
  const direct = Number(response.headers.get("retry-after") ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const resetAt = Number(response.headers.get("ratelimit-reset") ?? 0);
  if (Number.isFinite(resetAt) && resetAt > 0) {
    return Math.max(0, resetAt - Math.floor(Date.now() / 1000));
  }
  return 0;
}
