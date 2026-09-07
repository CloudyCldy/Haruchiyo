import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { created } from "@/lib/http";
import { handleError, ok } from "@/lib/http";
import { parse } from "@/validators/schemas";
import { createResource, listResource, resourceSchemas } from "@/services/resource.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; resource: string }> }) { const { id, resource } = await params; return withProject(request, id, async () => { try { return ok(await listResource(resource, id)); } catch (error) { return handleError(error); } }); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; resource: string }> }) { const { id, resource } = await params; return withProject(request, id, async () => { try { const schema = resourceSchemas[resource]; if (!schema) throw Object.assign(new Error("Unknown project resource"), { name: "NotFoundError" }); return created(await createResource(resource, id, parse(schema, await request.json()))); } catch (error) { return handleError(error); } }); }
