import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { MethodologyService } from "@/methodology/service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuthOrApiKey(request, "projects:read", async () => {
    const strategy = MethodologyService.get((await params).id);
    if (!strategy) return fail("METHODOLOGY_NOT_FOUND", "Methodology not found", 404);
    return ok(strategy);
  });
}
