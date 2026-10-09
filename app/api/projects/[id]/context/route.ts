import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthClient, getAuthUser, requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { parse } from "@/validators/schemas";
import { analyzeContext, contextSchema } from "@/services/context.service";

/**
 * INT-01-ST042: POST /api/v1/projects/:id/context
 *
 * Autenticación (una de las dos):
 *  - X-Api-Key (Haitani, servidor a servidor): :id es el externalRef del proyecto
 *    (p. ej. "haitani-proj-12") o el id de Sanzu.
 *  - Authorization: Bearer <JWT>: :id es el id de Sanzu y el usuario debe ser miembro.
 *
 * Recibe el contexto real del proyecto (ST043) y devuelve health, riesgos,
 * problemas, recomendaciones y documentos requeridos (ST044). No persiste datos.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let sanzuProjectId: string | null = null;
    if (request.headers.get("X-Api-Key")) {
      await getAuthClient(request);
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      const project = await prisma.project.findFirst({ where: isObjectId ? { OR: [{ id }, { externalRef: id }] } : { externalRef: id }, select: { id: true } });
      sanzuProjectId = project?.id ?? null;
    } else {
      const user = await getAuthUser(request);
      sanzuProjectId = (await requireProjectAccess(user.id, id)).id;
    }
    const input = parse(contextSchema, await request.json());
    const result = analyzeContext(input, sanzuProjectId ?? id);
    return ok({ ...result, externalRef: sanzuProjectId === id ? null : id, sanzuProjectId, synced: Boolean(sanzuProjectId) }, "Project context analyzed");
  } catch (error) {
    return handleError(error);
  }
}