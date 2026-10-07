import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { analyzeProject } from "@/services/analysis.service";
import { loadProjectForAnalysis } from "@/services/project.service";

/** SB-09-ST023: GET /api/v1/projects/:id/health — puntaje determinístico 0-100. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => {
    const analysis = analyzeProject(await loadProjectForAnalysis(id));
    return ok({ ...analysis.health, schedule: analysis.metrics.schedule, problems: analysis.problems, analyzedAt: analysis.analyzedAt });
  });
}