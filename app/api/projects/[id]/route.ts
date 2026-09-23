import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { parse, projectSchema } from "@/validators/schemas";
import { assertObjectId } from "@/lib/errors";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    assertObjectId(id, "projectId");
  } catch (error) {
    return handleError(error);
  }
  return withProject(request, id, async (_user, project) => {
    // If the project passed from withProject already has all relations, return it; otherwise load with needed relations
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        methodology: true,
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: true,
        backlog: true,
        sprints: true,
        milestones: true,
        risks: true,
        issues: true,
      },
    });
    return ok(fullProject);
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { try { return ok(await prisma.project.update({ where: { id }, data: parse(projectSchema.partial(), await request.json()) as any })); } catch (error) { return handleError(error); } }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { await prisma.project.delete({ where: { id } }); return new Response(null, { status: 204 }); }); }
