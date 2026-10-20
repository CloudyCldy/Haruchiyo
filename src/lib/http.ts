import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_CODES, type ErrorCode } from "@/lib/errors";

export const API_VERSION = "v1";
const versionHeaders = { "X-API-Version": API_VERSION };

export function ok<T>(data: T, message = "Operation completed successfully", status = 200, headers?: HeadersInit) {
  return NextResponse.json({ success: true, data, message }, { status, headers: { ...versionHeaders, ...(headers as Record<string, string> | undefined) } });
}
export function created<T>(data: T, message = "Created successfully") { return ok(data, message, 201); }
export function noContent() { return new Response(null, { status: 204, headers: versionHeaders }); }
export function fail(code: ErrorCode | string, message: string, status?: number, details?: unknown) {
  const resolved = status ?? (ERROR_CODES as Record<string, { status: number }>)[code]?.status ?? 500;
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status: resolved, headers: versionHeaders });
}

const byName: Record<string, ErrorCode> = {
  ValidationError: "VALIDATION_ERROR",
  AuthenticationError: "UNAUTHORIZED",
  AuthorizationError: "FORBIDDEN",
  NotFoundError: "NOT_FOUND",
  ConflictError: "CONFLICT",
  RateLimitError: "TOO_MANY_REQUESTS",
  AIServiceError: "AI_SERVICE_ERROR",
};

export function handleError(error: unknown) {
  if (error instanceof ZodError) return fail("VALIDATION_ERROR", error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", "));
  if (error instanceof SyntaxError) return fail("BAD_REQUEST", "Request body must be valid JSON");
  if (error instanceof Error) {
    if (error.name === "RateLimitError" && "retryAfter" in error) {
      const retryAfter = (error as { retryAfter?: number }).retryAfter ?? 60;
      const res = fail("TOO_MANY_REQUESTS", error.message, 429);
      res.headers.set("Retry-After", String(retryAfter));
      return res;
    }
    const code = byName[error.name];
    if (code) return fail(code, error.message);
    // Errores conocidos de Prisma
    const prismaCode = (error as { code?: string }).code;
    if (prismaCode === "P2025") return fail("NOT_FOUND", "Resource not found");
    if (prismaCode === "P2002") return fail("CONFLICT", "A resource with the same unique value already exists");
  }
  console.error("Sanzu request failed", error instanceof Error ? error.message : "unknown error");
  return fail("INTERNAL_ERROR", process.env.NODE_ENV === "production" ? "An unexpected error occurred" : String(error));
}