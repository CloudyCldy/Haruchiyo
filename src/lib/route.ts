import { NextRequest } from "next/server";
import { getAuthClient, getAuthUser, requireProjectAccess, requireProjectManager } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";

type Handler<T extends unknown[]> = (...args: T) => Promise<Response>;

export async function withAuth(request: NextRequest, action: Handler<[any]>) {
  try { return await action(await getAuthUser(request)); } catch (error) { return handleError(error); }
}
export async function withApiKey(request: NextRequest, action: Handler<[any]>) {
  try { return await action(await getAuthClient(request)); } catch (error) { return handleError(error); }
}
export async function withProject(request: NextRequest, projectId: string, action: Handler<[any, any]>) {
  return withAuth(request, async user => action(user, await requireProjectAccess(user.id, projectId)));
}
export async function withProjectManager(request: NextRequest, projectId: string, action: Handler<[any, any]>) {
  return withAuth(request, async user => action(user, await requireProjectManager(user.id, projectId)));
}
export function created<T>(data: T) { return ok(data, "Created successfully", 201); }