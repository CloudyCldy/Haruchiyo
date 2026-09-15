import { NextRequest } from "next/server";
import { withAuth } from "@/lib/route";
import { requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { assertObjectId } from "@/lib/errors";
import { deleteBacklogItem, getBacklogItem, updateBacklogItem } from "@/services/work.service";
import { backlogSchema, parse } from "@/validators/schemas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const item = await getBacklogItem(id); if (!item) throw Object.assign(new Error("Backlog item not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); return ok(item); } catch (error) { return handleError(error); } }); }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const item = await getBacklogItem(id); if (!item) throw Object.assign(new Error("Backlog item not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); return ok(await updateBacklogItem(id, item.projectId, parse(backlogSchema.partial(), await request.json()))); } catch (error) { return handleError(error); } }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return withAuth(request, async user => { const id = (await params).id; try { assertObjectId(id); const item = await getBacklogItem(id); if (!item) throw Object.assign(new Error("Backlog item not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); await deleteBacklogItem(id); return new Response(null, { status: 204 }); } catch (error) { return handleError(error); } }); }