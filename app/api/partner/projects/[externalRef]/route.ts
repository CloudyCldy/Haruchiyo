import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProject } from "@/lib/partner";

export async function GET(request: NextRequest, { params }: { params: Promise<{ externalRef: string }> }) {
  const { externalRef } = await params;
  return withApiKey(request, "projects:read", async (client) => {
    return ok(await getPartnerProject(externalRef, client?.organizationId));
  });
}
