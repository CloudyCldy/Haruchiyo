import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProject, getPartnerServiceUser } from "@/lib/partner";

export async function GET(request: NextRequest) {
  return withApiKey(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const externalRef = searchParams.get("externalRef");
      const user = await getPartnerServiceUser();

      let projectId: string | undefined = undefined;
      if (externalRef) {
        const project = await getPartnerProject(externalRef);
        projectId = project.id;
      }

      const conversations = await prisma.chatConversation.findMany({
        where: {
          userId: user.id,
          ...(projectId ? { projectId } : {}),
        },
        include: {
          project: { select: { id: true, name: true, externalRef: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return ok(conversations);
    } catch (error) {
      return handleError(error);
    }
  });
}
