import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { parse, chatSchema } from "@/validators/schemas";
import { answerMessage } from "@/ai/chatbot.service";
export async function POST(request: NextRequest) { try { const input = parse(chatSchema, await request.json()); return withProject(request, input.projectId, async user => ok(await answerMessage(user.id, input.projectId, input.message, input.conversationId))); } catch (error) { return handleError(error); } }
