import { NextRequest } from "next/server";
import { withApiKey } from "@/lib/route";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { documentRecommendationSchema, parse } from "@/validators/schemas";
import { inferPhase, parsePhase, recommendDocuments } from "@/services/document-recommendation.service";

/** Haitani (API key): documentos recomendados para un proyecto sincronizado (ST055). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ externalRef: string }> }) {
  const { externalRef } = await params;
  return withApiKey(request, async () => {
    const query = parse(documentRecommendationSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    const requested = parsePhase(query.phase);
    if (query.phase && !requested) throw new ValidationError("phase must be INICIO, EJECUCION or CIERRE");
    const project = await prisma.project.findUnique({ where: { externalRef }, select: { status: true, startDate: true, endDate: true, methodologyId: true } });
    if (!project) throw new NotFoundError("Project not found. Sync it first with POST /api/v1/partner/projects");
    return ok(recommendDocuments({ methodology: project.methodologyId, phase: requested ?? inferPhase(project), query: query.q, limit: query.limit }));
  });
}