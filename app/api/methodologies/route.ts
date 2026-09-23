import { ok } from "@/lib/http";
import { MethodologyService } from "@/methodology/service";
export async function GET() {
  return ok(MethodologyService.list(), "Operation completed successfully", 200, {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  });
}
