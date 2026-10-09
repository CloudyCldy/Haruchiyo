import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { analyzeProject } from "@/services/analysis.service";
import { loadProjectForAnalysis } from "@/services/project.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => ok(analyzeProject(await loadProjectForAnalysis(id))));
}