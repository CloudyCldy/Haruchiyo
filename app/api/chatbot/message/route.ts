import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { parse, chatSchema } from "@/validators/schemas";
import { answerMessage } from "@/ai/chatbot.service";
export async function POST(request: NextRequest) { try { const input = parse(chatSchema, await request.json()); const projectId = String(input.projectId); const conversationId = input.conversationId === undefined ? undefined : String(input.conversationId); return withProject(request, projectId, async user => { const data = await answerMessage(user.id, projectId, input.message, conversationId); return ok(data, data.response); }); } catch (error) { return handleError(error); } }
