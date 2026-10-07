import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/route";
import { created, ok } from "@/lib/http";
import { parse, projectSchema } from "@/validators/schemas";
import { assertDateRange, assertMethodologyExists } from "@/services/project.service";

/** Lista solo los proyectos donde el usuario es manager o miembro (SB-02). */
export async function GET(request: NextRequest) {
  return withAuth(request, async user => ok(await prisma.project.findMany({
    where: { OR: [{ managerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { methodology: true },
    orderBy: { createdAt: "desc" },
  })));
}

/** Crea el proyecto y registra al creador como PROJECT_MANAGER. */
export async function POST(request: NextRequest) {
  return withAuth(request, async user => {
    const input = parse(projectSchema, await request.json());
    const methodologyId = await assertMethodologyExists(input.methodologyId);
    assertDateRange(input.startDate, input.endDate);
    const project = await prisma.project.create({
      data: { ...input, methodologyId, managerId: user.id, members: { create: { userId: user.id, role: "PROJECT_MANAGER" } } } as any,
      include: { methodology: true },
    });
    return created(project, "Project created");
  });
}