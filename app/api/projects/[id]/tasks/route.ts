import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject, created } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { parse, taskSchema } from "@/validators/schemas";
import { assertObjectId } from "@/lib/errors";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; try { assertObjectId(id, "projectId"); } catch (error) { return handleError(error); } return withProject(request, id, async () => ok(await prisma.task.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } }))); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { try { return created(await prisma.task.create({ data: { ...parse(taskSchema, await request.json()), projectId: id } })); } catch (error) { return handleError(error); } }); }
