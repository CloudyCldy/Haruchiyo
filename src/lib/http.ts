import { NextResponse } from "next/server";

export function ok<T>(data: T, message = "Operation completed successfully", status = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}
export function created<T>(data: T) { return ok(data, "Created successfully", 201); }
export function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}
export function handleError(error: unknown) {
  console.error("Sanzu request failed", error instanceof Error ? error.message : "unknown error");
  if (error instanceof Error && error.name === "ValidationError") return fail("VALIDATION_ERROR", error.message, 422);
  if (error instanceof Error && error.name === "AuthorizationError") return fail("FORBIDDEN", error.message, 403);
  if (error instanceof Error && error.name === "NotFoundError") return fail("NOT_FOUND", error.message, 404);
  return fail("INTERNAL_ERROR", process.env.NODE_ENV === "production" ? "An unexpected error occurred" : String(error), 500);
}
