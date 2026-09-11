import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/http";
import { withApiKey } from "@/lib/route";
import { getPartnerProject, getPartnerServiceUser } from "@/lib/partner";
import { answerMessage } from "@/ai/chatbot.service";
import { parse, partnerChatSchema } from "@/validators/schemas";

export async function POST(request: NextRequest) {
  try {
    const input = parse(partnerChatSchema, await request.json());
    return withApiKey(request, async () => {
      const project = await getPartnerProject(input.externalRef);
      const user = await getPartnerServiceUser();
      const conversationId = input.conversationId === undefined ? undefined : String(input.conversationId);
      const data = await answerMessage(user.id, project.id, input.message, conversationId, undefined, input.requirements);
      return ok(data, data.response);
    });
  } catch (error) {
    return handleError(error);
  }
}