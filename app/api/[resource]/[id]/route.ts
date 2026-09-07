import { NextRequest } from "next/server";
import { withAuth } from "@/lib/route";
import { requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { parse } from "@/validators/schemas";
import { getResourceProject, resourceSchemas, updateResource, deleteResource } from "@/services/resource.service";
import { z } from "zod";
import { assertObjectId } from "@/lib/errors";
export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) { return withAuth(request, async user => { const { resource, id } = await params; try { assertObjectId(id); const item = await getResourceProject(resource, id); if (!item) throw Object.assign(new Error("Resource not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); return ok(item); } catch (error) { return handleError(error); } }); }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) { return withAuth(request, async user => { const { resource, id } = await params; try { assertObjectId(id); const item = await getResourceProject(resource, id); if (!item) throw Object.assign(new Error("Resource not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); return ok(await updateResource(resource, id, parse((resourceSchemas[resource] as z.AnyZodObject).partial(), await request.json()))); } catch (error) { return handleError(error); } }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) { return withAuth(request, async user => { const { resource, id } = await params; try { assertObjectId(id); const item = await getResourceProject(resource, id); if (!item) throw Object.assign(new Error("Resource not found"), { name: "NotFoundError" }); await requireProjectAccess(user.id, item.projectId); await deleteResource(resource, id); return new Response(null, { status: 204 }); } catch (error) { return handleError(error); } }); }
