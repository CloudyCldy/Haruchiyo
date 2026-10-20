import { NextRequest } from "next/server";
import { RateLimitError } from "@/lib/errors";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros expirados para prevenir fugas de memoria
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const client = forwarded.split(",")[0]?.trim();
    if (client) return client;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();
  return "127.0.0.1";
}

export interface RateLimitOptions {
  keyPrefix?: string;
  max?: number;
  windowMs?: number;
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
} {
  const { keyPrefix = "global", max = 60, windowMs = 60_000 } = options;
  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, newRecord);
    return {
      success: true,
      limit: max,
      remaining: max - 1,
      resetAt: newRecord.resetAt,
      retryAfter: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= max) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, max - record.count);
  const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  return {
    success: true,
    limit: max,
    remaining,
    resetAt: record.resetAt,
    retryAfter,
  };
}

export function assertRateLimit(request: NextRequest, options: RateLimitOptions = {}): void {
  const result = checkRateLimit(request, options);
  if (!result.success) {
    throw new RateLimitError(
      `Límite de peticiones excedido. Por favor intente de nuevo en ${result.retryAfter} segundos.`,
      result.retryAfter
    );
  }
}

export function resetRateLimitStore(): void {
  store.clear();
}
