import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerServiceUser } from "@/lib/partner";
import { parse, partnerProjectSchema } from "@/validators/schemas";
import { assertMethodologyExists } from "@/services/project.service";
import { AuthorizationError } from "@/lib/errors";

/** Haitani sincroniza (upsert) un proyecto por su externalRef. Se autentica antes de validar. */
export async function POST(request: NextRequest) {
  return withApiKey(request, "projects:create", async (client) => {
    const input = parse(partnerProjectSchema, await request.json());
    const methodologyId = (await assertMethodologyExists(input.methodologyId))!;
    const manager = await getPartnerServiceUser();
    const orgId = client?.organizationId || null;

    const existing = await prisma.project.findUnique({ where: { externalRef: input.externalRef } });
    if (existing && orgId && existing.organizationId && existing.organizationId !== orgId) {
      throw new AuthorizationError("Cannot modify project belonging to another organization");
    }

    const project = await prisma.project.upsert({
      where: { externalRef: input.externalRef },
      update: { name: input.name, methodologyId, requirements: input.requirements as any, ...(orgId ? { organizationId: orgId } : {}) } as any,
      create: { externalRef: input.externalRef, name: input.name, methodologyId, requirements: input.requirements as any, managerId: manager.id, organizationId: orgId } as any,
      include: { methodology: true },
    });
    return created(project);
  });
}
