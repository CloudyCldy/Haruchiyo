import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { documentRecommendationSchema, parse } from "@/validators/schemas";
import { inferPhase, parsePhase, recommendDocuments } from "@/services/document-recommendation.service";

/** ST055: documentos recomendados según el proyecto, su metodología y su fase (?phase=INICIO|EJECUCION|CIERRE). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => {
    const query = parse(documentRecommendationSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    const requested = parsePhase(query.phase);
    if (query.phase && !requested) throw new ValidationError("phase must be INICIO, EJECUCION or CIERRE");
    const project = await prisma.project.findUniqueOrThrow({ where: { id }, select: { status: true, startDate: true, endDate: true, methodologyId: true } });
    return ok(recommendDocuments({ methodology: project.methodologyId, phase: requested ?? inferPhase(project), query: query.q, limit: query.limit }));
  });
}