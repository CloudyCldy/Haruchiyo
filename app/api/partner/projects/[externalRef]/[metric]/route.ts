import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProject } from "@/lib/partner";
import { calculateMetrics } from "@/services/metrics.service";
import { analyzeProject } from "@/services/analysis.service";
import { generateRecommendations } from "@/services/recommendation.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ externalRef: string; metric: string }> }) {
  const { externalRef, metric } = await params;
  return withApiKey(request, async () => {
    const project = await getPartnerProject(externalRef);
    if (metric === "metrics") return ok(calculateMetrics(project));
    const analysis = analyzeProject(project);
    if (metric === "health") return ok(analysis.health);
    if (metric === "compliance") return ok(analysis.compliance);
    if (metric === "analysis") return ok(analysis);
    if (metric === "recommendations") return ok(generateRecommendations(project));
    const error = new Error("Unknown project resource");
    error.name = "NotFoundError";
    throw error;
  });
}