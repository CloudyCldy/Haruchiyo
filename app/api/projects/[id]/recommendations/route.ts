import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { created, ok } from "@/lib/http";
import { generateRecommendations } from "@/services/recommendation.service";
import { loadProjectForAnalysis } from "@/services/project.service";

const PRIORITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * SB-09-ST026: GET /api/v1/projects/:id/recommendations
 *  - por defecto: recomendaciones guardadas (historial), por prioridad.
 *  - ?live=true: recomendaciones calculadas al momento, sin guardarlas.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => {
    if (request.nextUrl.searchParams.get("live") === "true") return ok(generateRecommendations(await loadProjectForAnalysis(id)));
    const stored = await prisma.recommendation.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } });
    return ok([...stored].sort((a: any, b: any) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)));
  });
}

/** Genera y guarda recomendaciones. No duplica títulos guardados en los últimos 7 días. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => {
    const recommendations = generateRecommendations(await loadProjectForAnalysis(id));
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.recommendation.findMany({ where: { projectId: id, createdAt: { gte: since } }, select: { title: true } });
    const existing = new Set(recent.map((r: any) => r.title));
    const fresh = recommendations.filter(r => !existing.has(r.title));
    if (fresh.length) await prisma.recommendation.createMany({ data: fresh });
    return created({ generated: recommendations.length, saved: fresh.length, items: recommendations });
  });
}