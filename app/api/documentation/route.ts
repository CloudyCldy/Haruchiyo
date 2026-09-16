import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const docs = KnowledgeService.listDocumentation(category);
  return ok(docs);
}
