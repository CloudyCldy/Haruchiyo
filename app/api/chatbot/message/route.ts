import { NextRequest } from "next/server";
import { withAuth } from "@/lib/route";
import { ok } from "@/lib/http";
import { requireProjectAccess } from "@/lib/auth";
import { parse, chatSchema } from "@/validators/schemas";
import { answerMessage } from "@/ai/chatbot.service";

export async function POST(request: NextRequest) {
  return withAuth(request, async user => {
    const input = parse(chatSchema, await request.json());
    const projectId = String(input.projectId);
    await requireProjectAccess(user.id, projectId);
    const conversationId = input.conversationId === undefined ? undefined : String(input.conversationId);
    const data = await answerMessage(user.id, projectId, input.message, conversationId);
    return ok(data, data.response);
  });
}