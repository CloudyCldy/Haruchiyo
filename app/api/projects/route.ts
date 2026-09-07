import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { parse, projectSchema } from "@/validators/schemas";
export async function GET(request: NextRequest) { try { const user = await getAuthUser(request); return ok(await prisma.project.findMany({ where: { OR: [{ managerId: user.id }, { members: { some: { userId: user.id } } }] }, include: { methodology: true } })); } catch (error) { return handleError(error); } }
export async function POST(request: NextRequest) { try { const user = await getAuthUser(request); const input = parse(projectSchema, await request.json()); const project = await prisma.project.create({ data: { ...input, managerId: user.id, members: { create: { userId: user.id, role: "PROJECT_MANAGER" } } } as any, include: { methodology: true } }); return ok(project, "Project created", 201); } catch (error) { return handleError(error); } }
