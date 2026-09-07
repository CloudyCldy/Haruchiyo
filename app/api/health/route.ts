import { ok } from "@/lib/http";
export async function GET() { return ok({ name: "Sanzu", status: "healthy", timestamp: new Date().toISOString() }); }
