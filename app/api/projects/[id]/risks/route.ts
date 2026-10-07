import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { created, ok } from "@/lib/http";
import { parse } from "@/validators/schemas";
import { createResource, resourceSchemas } from "@/services/resource.service";
import { riskLevel, summarizeRisks } from "@/services/risk.service";

/**
 * SB-09-ST025: GET /api/v1/projects/:id/risks
 * Devuelve los riesgos ordenados por severidad, cada uno con su nivel calculado.
 * ?status=OPEN filtra por estado; ?summary=true devuelve { items, summary } (Risk Center).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => {
    const status = request.nextUrl.searchParams.get("status")?.toUpperCase();
    if (status && !["OPEN", "MITIGATED", "ACCEPTED", "CLOSED"].includes(status)) throw Object.assign(new Error("status must be OPEN, MITIGATED, ACCEPTED or CLOSED"), { name: "ValidationError" });
    const risks = await prisma.risk.findMany({ where: { projectId: id, ...(status ? { status: status as any } : {}) }, orderBy: [{ severity: "desc" }, { createdAt: "desc" }] });
    const items = risks.map((r: any) => ({ ...r, level: riskLevel(r.severity) }));
    if (request.nextUrl.searchParams.get("summary") === "true") return ok({ items, summary: summarizeRisks(risks) });
    return ok(items);
  });
}

/** Crea un riesgo; la severidad se calcula automáticamente. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withProject(request, id, async () => created(await createResource("risks", id, parse(resourceSchemas.risks, await request.json()))));
}