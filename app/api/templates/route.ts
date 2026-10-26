import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest) {
  return withAuthOrApiKey(req, "projects:read", async () => {
    const { searchParams } = new URL(req.url);
    const methodology = searchParams.get("methodology") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const templates = KnowledgeService.listTemplates({ methodology, category });
    return ok(templates, "Operation completed successfully", 200, {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    });
  });
}
