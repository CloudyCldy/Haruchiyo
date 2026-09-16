import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const methodology = searchParams.get("methodology") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const templates = KnowledgeService.listTemplates({ methodology, category });
  return ok(templates);
}
