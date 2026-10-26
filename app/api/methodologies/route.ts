import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { MethodologyService } from "@/methodology/service";

export async function GET(request: NextRequest) {
  return withAuthOrApiKey(request, "projects:read", async () => {
    return ok(MethodologyService.list(), "Operation completed successfully", 200, {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    });
  });
}
