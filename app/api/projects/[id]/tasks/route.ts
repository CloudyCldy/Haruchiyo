import { NextRequest } from "next/server";
import { withProject, created } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { parse, taskSchema } from "@/validators/schemas";
import { assertObjectId } from "@/lib/errors";
import { createTask, listTasks } from "@/services/work.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; try { assertObjectId(id, "projectId"); } catch (error) { return handleError(error); } return withProject(request, id, async () => { try { return ok(await listTasks(id)); } catch (error) { return handleError(error); } }); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { try { return created(await createTask(id, parse(taskSchema, await request.json()))); } catch (error) { return handleError(error); } }); }
