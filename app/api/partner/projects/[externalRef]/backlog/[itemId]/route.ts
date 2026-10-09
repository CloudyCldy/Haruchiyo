import { NextRequest } from "next/server";
import { noContent, ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProjectId } from "@/lib/partner";
import { assertObjectId, NotFoundError } from "@/lib/errors";
import { backlogSchema, parse } from "@/validators/schemas";
import { deleteBacklogItem, getBacklogItem, updateBacklogItem } from "@/services/work.service";

type Params = { params: Promise<{ externalRef: string; itemId: string }> };

/** El ítem debe pertenecer al proyecto indicado; si no, se responde 404. */
async function itemOfProject(externalRef: string, itemId: string) {
  assertObjectId(itemId, "itemId");
  const projectId = await getPartnerProjectId(externalRef);
  const item = await getBacklogItem(itemId);
  if (!item || item.projectId !== projectId) throw new NotFoundError("Backlog item not found");
  return { projectId, item };
}

/** Haitani: edita un ítem o cambia su estado (las transiciones se validan). */
export async function PUT(request: NextRequest, { params }: Params) {
  const { externalRef, itemId } = await params;
  return withApiKey(request, async () => {
    const { projectId } = await itemOfProject(externalRef, itemId);
    return ok(await updateBacklogItem(itemId, projectId, parse(backlogSchema.partial(), await request.json())));
  });
}

/** Haitani: elimina un ítem del backlog. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { externalRef, itemId } = await params;
  return withApiKey(request, async () => {
    await itemOfProject(externalRef, itemId);
    await deleteBacklogItem(itemId);
    return noContent();
  });
}