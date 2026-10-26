import { NextRequest } from "next/server";
import { getAuthClient, getAuthUser, requireProjectAccess, requireProjectManager } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { AuthenticationError } from "@/lib/errors";

type Handler<T extends unknown[]> = (...args: T) => Promise<Response>;

export async function withAuth(request: NextRequest, action: Handler<[any]>) {
  try {
    return await action(await getAuthUser(request));
  } catch (error) {
    return handleError(error);
  }
}

export async function withApiKey(
  request: NextRequest,
  actionOrScope: string | Handler<[any]>,
  maybeAction?: Handler<[any]>
) {
  const scope = typeof actionOrScope === "string" ? actionOrScope : undefined;
  const action = typeof actionOrScope === "function" ? actionOrScope : maybeAction!;
  try {
    const client = await getAuthClient(request, scope);
    return await action(client);
  } catch (error) {
    return handleError(error);
  }
}

export async function withAuthOrApiKey(
  request: NextRequest,
  requiredScope: string,
  action: (identity: { type: "user" | "api_key"; user?: any; client?: any }) => Promise<Response>
) {
  try {
    const hasKey = Boolean(request.headers.get("x-api-key") || request.headers.get("X-Api-Key"));
    const hasAuth = request.headers.get("authorization")?.startsWith("Bearer ");

    if (hasKey) {
      const client = await getAuthClient(request, requiredScope);
      return await action({ type: "api_key", client });
    }
    if (hasAuth) {
      const user = await getAuthUser(request);
      return await action({ type: "user", user });
    }
    throw new AuthenticationError("Authentication required (Bearer Token or X-Api-Key)");
  } catch (error) {
    return handleError(error);
  }
}

export async function withProject(request: NextRequest, projectId: string, action: Handler<[any, any]>) {
  return withAuth(request, async user => action(user, await requireProjectAccess(user.id, projectId)));
}

export async function withProjectManager(request: NextRequest, projectId: string, action: Handler<[any, any]>) {
  return withAuth(request, async user => action(user, await requireProjectManager(user.id, projectId)));
}

export function created<T>(data: T) {
  return ok(data, "Created successfully", 201);
}
