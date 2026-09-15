import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { created, handleError, ok } from "@/lib/http";
import { parse, sprintSchema } from "@/validators/schemas";
import { createSprint, listSprints } from "@/services/work.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { try { return ok(await listSprints(id)); } catch (error) { return handleError(error); } }); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { try { return created(await createSprint(id, parse(sprintSchema, await request.json()))); } catch (error) { return handleError(error); } }); }