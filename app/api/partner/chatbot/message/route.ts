import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/route";
import { getOrCreatePartnerProject, getPartnerServiceUser } from "@/lib/partner";
import { answerMessage } from "@/ai/chatbot.service";
import { getAIProvider } from "@/ai/provider.service";
import { ExpertEngineService } from "@/ai/expert-engine.service";
import { parse, partnerChatSchema } from "@/validators/schemas";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  return withApiKey(request, async () => {
    assertRateLimit(request, { keyPrefix: "partner-chatbot", max: 60, windowMs: 60_000 });
    const input = parse(partnerChatSchema, await request.json());

    const rawRef =
      input.externalRef ||
      (input.context?.projectId ? `haitani-proj-${input.context.projectId}` : undefined) ||
      (input.projectId ? `haitani-proj-${input.projectId}` : undefined) ||
      "haitani-default";

    const contextProjectName = (input.context?.project as any)?.name || "Haitani Project";
    const contextMethodology = (input.context?.project as any)?.methodology || "SCRUM";

    const project = await getOrCreatePartnerProject(rawRef, contextProjectName, contextMethodology);
    const user = await getPartnerServiceUser();
    const conversationId = input.conversationId === undefined ? undefined : String(input.conversationId);

    const provider = getAIProvider();
    const data = await answerMessage(
      user.id,
      project.id,
      input.message,
      conversationId,
      provider,
      input.requirements
    );

    // Si se envió contexto directo, enriquecer con ExpertEngine
    const expert = ExpertEngineService.generateAnswer(input.message, input.context as any);
    const combinedSources = Array.from(new Set([
      ...(expert.sources || []),
      ...(data.knowledgeBase?.citations?.map(c => `${c.documentTitle}: ${c.sectionTitle}`) || [])
    ]));

    const responsePayload = {
      success: true,
      answer: data.response,
      response: data.response,
      data,
      sources: combinedSources,
      suggestions: expert.suggestions || [],
      metadata: {
        provider: "sanzu",
        version: "v1",
        intent: expert.intent,
        timestamp: new Date().toISOString()
      },
      message: "Operation completed successfully"
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: { "X-API-Version": "v1" }
    });
  });
}