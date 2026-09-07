import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/route";
import { requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { parse, taskSchema } from "@/validators/schemas";
import { assertObjectId } from "@/lib/errors";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const task = await prisma.task.findUnique({ where: { id } }); if (!task) throw Object.assign(new Error("Task not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, task.projectId); return ok(task); } catch (error) { return handleError(error); } }); }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { try { const id = (await params).id; assertObjectId(id); const task = await prisma.task.findUnique({ where: { id } }); if (!task) throw Object.assign(new Error("Task not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, task.projectId); return ok(await prisma.task.update({ where: { id }, data: parse(taskSchema.partial(), await request.json()) })); } catch (error) { return handleError(error); } }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const task = await prisma.task.findUnique({ where: { id } }); if (!task) throw Object.assign(new Error("Task not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, task.projectId); await prisma.task.delete({ where: { id: task.id } }); return new Response(null, { status: 204 }); } catch (error) { return handleError(error); } }); }
