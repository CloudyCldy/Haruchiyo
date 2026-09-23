import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const methodology = searchParams.get("methodology") ?? undefined;
  const stage = searchParams.get("stage") ?? undefined;
  const checklists = KnowledgeService.listChecklists({ methodology, stage });
  return ok(checklists, "Operation completed successfully", 200, {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  });

}
