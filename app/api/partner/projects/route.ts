import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created, handleError } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerServiceUser } from "@/lib/partner";
import { parse, partnerProjectSchema } from "@/validators/schemas";

export async function POST(request: NextRequest) {
  try {
    const input = parse(partnerProjectSchema, await request.json());
    return withApiKey(request, async () => {
      const manager = await getPartnerServiceUser();
      const project = await prisma.project.upsert({
        where: { externalRef: input.externalRef },
        update: { name: input.name, methodologyId: input.methodologyId, requirements: input.requirements as any },
        create: { externalRef: input.externalRef, name: input.name, methodologyId: input.methodologyId, requirements: input.requirements as any, managerId: manager.id },
        include: { methodology: true },
      });
      return created(project);
    });
  } catch (error) {
    return handleError(error);
  }
}