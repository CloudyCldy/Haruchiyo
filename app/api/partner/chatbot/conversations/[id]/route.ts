import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerServiceUser } from "@/lib/partner";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiKey(request, async () => {
    try {
      const user = await getPartnerServiceUser();
      const conversationId = (await params).id;
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: {
          project: { select: { id: true, name: true, externalRef: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!conversation) {
        throw Object.assign(new Error("Conversation not found"), { name: "NotFoundError" });
      }

      return ok(conversation);
    } catch (error) {
      return handleError(error);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiKey(request, async () => {
    try {
      const user = await getPartnerServiceUser();
      const conversationId = (await params).id;
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });

      if (!conversation) {
        throw Object.assign(new Error("Conversation not found"), { name: "NotFoundError" });
      }

      await prisma.chatConversation.delete({ where: { id: conversation.id } });
      return new Response(null, { status: 204 });
    } catch (error) {
      return handleError(error);
    }
  });
}
