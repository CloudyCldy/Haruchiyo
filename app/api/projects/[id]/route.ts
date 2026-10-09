import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject, withProjectManager } from "@/lib/route";
import { noContent, ok } from "@/lib/http";
import { parse, projectSchema } from "@/validators/schemas";
import { assertDateRange, assertMethodologyExists, fullProjectInclude } from "@/services/project.service";

type Params = { params: Promise<{ id: string }> };

/** Cualquier miembro del proyecto puede consultarlo. */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withProject(request, id, async () => ok(await prisma.project.findUnique({ where: { id }, include: fullProjectInclude })));
}

/** Solo el manager (o un miembro PROJECT_MANAGER) puede editar. */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withProjectManager(request, id, async (_user, project) => {
    const input = parse(projectSchema.partial(), await request.json());
    const methodologyId = await assertMethodologyExists(input.methodologyId);
    assertDateRange(input.startDate ?? project.startDate, input.endDate ?? project.endDate);
    return ok(await prisma.project.update({ where: { id }, data: { ...input, ...(methodologyId ? { methodologyId } : {}) } as any, include: { methodology: true } }));
  });
}

/** Solo el manager (o un miembro PROJECT_MANAGER) puede eliminar. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withProjectManager(request, id, async () => { await prisma.project.delete({ where: { id } }); return noContent(); });
}