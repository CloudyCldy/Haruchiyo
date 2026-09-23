import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const methodology = searchParams.get("methodology") ?? undefined;
  const processes = KnowledgeService.listProcesses({ methodology });
  return ok(processes, "Operation completed successfully", 200, {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  });

}
