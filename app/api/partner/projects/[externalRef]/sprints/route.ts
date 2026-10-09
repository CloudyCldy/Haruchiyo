import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProjectId } from "@/lib/partner";
import { partnerSprintSyncSchema, parse } from "@/validators/schemas";
import { listSprints, syncPartnerSprints } from "@/services/work.service";

type Params = { params: Promise<{ externalRef: string }> };

/** Haitani: sprints del proyecto, para poder asignarles ítems del backlog. */
export async function GET(request: NextRequest, { params }: Params) {
  const { externalRef } = await params;
  return withApiKey(request, async () => ok(await listSprints(await getPartnerProjectId(externalRef))));
}

/** Haitani: manda la lista completa de sus sprints y Sanzu deja su copia igual (crea, actualiza y borra). */
export async function PUT(request: NextRequest, { params }: Params) {
  const { externalRef } = await params;
  return withApiKey(request, async () => {
    const projectId = await getPartnerProjectId(externalRef);
    const { sprints } = parse(partnerSprintSyncSchema, await request.json());
    return ok(await syncPartnerSprints(projectId, sprints));
  });
}