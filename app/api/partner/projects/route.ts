import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerServiceUser } from "@/lib/partner";
import { parse, partnerProjectSchema } from "@/validators/schemas";
import { assertMethodologyExists } from "@/services/project.service";

/** Haitani sincroniza (upsert) un proyecto por su externalRef. Se autentica antes de validar. */
export async function POST(request: NextRequest) {
  return withApiKey(request, async () => {
    const input = parse(partnerProjectSchema, await request.json());
    const methodologyId = (await assertMethodologyExists(input.methodologyId))!;
    const manager = await getPartnerServiceUser();
    const project = await prisma.project.upsert({
      where: { externalRef: input.externalRef },
      update: { name: input.name, methodologyId, requirements: input.requirements as any },
      create: { externalRef: input.externalRef, name: input.name, methodologyId, requirements: input.requirements as any, managerId: manager.id },
      include: { methodology: true },
    });
    return created(project);
  });
}