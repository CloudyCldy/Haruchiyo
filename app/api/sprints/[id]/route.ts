import { NextRequest } from "next/server";
import { withAuth } from "@/lib/route";
import { requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { assertObjectId } from "@/lib/errors";
import { deleteSprint, getSprint, updateSprint } from "@/services/work.service";
import { parse, sprintUpdateSchema } from "@/validators/schemas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const sprint = await getSprint(id); if (!sprint) throw Object.assign(new Error("Sprint not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, sprint.projectId); return ok(sprint); } catch (error) { return handleError(error); } }); }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const sprint = await getSprint(id); if (!sprint) throw Object.assign(new Error("Sprint not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, sprint.projectId); return ok(await updateSprint(id, parse(sprintUpdateSchema, await request.json()))); } catch (error) { return handleError(error); } }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const sprint = await getSprint(id); if (!sprint) throw Object.assign(new Error("Sprint not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, sprint.projectId); await deleteSprint(id); return new Response(null, { status: 204 }); } catch (error) { return handleError(error); } }); }