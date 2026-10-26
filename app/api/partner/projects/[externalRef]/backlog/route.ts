import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProjectId } from "@/lib/partner";
import { backlogFilterSchema, backlogSchema, parse } from "@/validators/schemas";
import { createBacklogItem, listBacklog } from "@/services/work.service";

type Params = { params: Promise<{ externalRef: string }> };

/** Haitani: lista el backlog del proyecto. Filtros: ?type ?status ?priority ?sprintId=<id>|none */
export async function GET(request: NextRequest, { params }: Params) {
  const { externalRef } = await params;
  return withApiKey(request, "projects:read", async (client) => {
    const projectId = await getPartnerProjectId(externalRef, client?.organizationId);
    const filters = parse(backlogFilterSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    return ok(await listBacklog(projectId, { ...filters, sprintId: filters.sprintId === "none" ? null : filters.sprintId }));
  });
}

/** Haitani: agrega un ítem al backlog del proyecto. */
export async function POST(request: NextRequest, { params }: Params) {
  const { externalRef } = await params;
  return withApiKey(request, "projects:update", async (client) => {
    const projectId = await getPartnerProjectId(externalRef, client?.organizationId);
    return created(await createBacklogItem(projectId, parse(backlogSchema, await request.json())));
  });
}
