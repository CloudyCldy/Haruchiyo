import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { calculateMetrics } from "@/services/metrics.service";
import { loadProjectForAnalysis } from "@/services/project.service";

/** SB-09-ST024: GET /api/v1/projects/:id/metrics — progreso, velocidad, workload, calendario y retrasos. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => ok(calculateMetrics(await loadProjectForAnalysis(id))));
}