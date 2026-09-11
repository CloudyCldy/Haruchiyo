import { NextRequest } from "next/server";
import { getAuthClient, getAuthUser, requireProjectAccess } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
export async function withAuth(request: NextRequest, action: (user: any) => Promise<Response>) { try { return await action(await getAuthUser(request)); } catch (error) { return handleError(error); } }
export async function withApiKey(request: NextRequest, action: (client: any) => Promise<Response>) { try { return await action(await getAuthClient(request)); } catch (error) { return handleError(error); } }
export async function withProject(request: NextRequest, projectId: string, action: (user: any, project: any) => Promise<Response>) { return withAuth(request, async user => action(user, await requireProjectAccess(user.id, projectId))); }
export function created<T>(data: T) { return ok(data, "Created successfully", 201); }
