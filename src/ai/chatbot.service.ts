import { prisma } from "@/lib/prisma";
import { AIProvider, SanzuCoreProvider } from "@/ai/provider.service";
import { buildProjectContext } from "@/ai/context.service";
import { buildAgentPrompt, systemPrompt } from "@/ai/prompt.service";

export async function answerMessage(
  userId: string,
  projectId: string,
  message: string,
  conversationId?: string,
  provider: AIProvider = new SanzuCoreProvider(),
  requirements?: unknown
) {
  // Build project context enriched with knowledge base grounded in project type and user message
  const context = await buildProjectContext(projectId, requirements, message);

  // Dynamic system prompt tailored to the project's methodology and knowledge base
  const dynamicPrompt = buildAgentPrompt({
    methodology: context.project.methodology,
    projectName: context.project.name,
    knowledgeBase: context.knowledgeBase
  });

  const conversation = conversationId
    ? await prisma.chatConversation.findFirstOrThrow({ where: { id: conversationId, userId, projectId } })
    : await prisma.chatConversation.create({ data: { userId, projectId } });

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: message
    }
  });

  const response = await provider.complete(
    dynamicPrompt || systemPrompt,
    JSON.stringify({ question: message, context })
  );

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: response
    }
  });

  return {
    conversationId: conversation.id,
    project: context.project,
    methodology: context.project.methodology,
    context: {
      metrics: context.findings.metrics,
      tasks: context.tasks.length,
      backlogItems: context.backlog.length,
      teamMembers: context.team.length,
      risks: context.risks.length,
      issues: context.issues.length,
      milestones: context.milestones.length
    },
    knowledgeBase: {
      citations: context.knowledgeBase.topChunks.map(c => ({
        citation: c.citation,
        documentTitle: c.documentTitle,
        sectionTitle: c.chunk.section_title,
        page: c.chunk.page_start,
        sourceLocation: c.chunk.source_location,
        reliability: c.chunk.source_reliability
      })),
      checklists: context.knowledgeBase.applicableChecklists,
      templates: context.knowledgeBase.applicableTemplates,
      processes: context.knowledgeBase.applicableProcesses,
      glossaryTerms: context.knowledgeBase.glossary.map(g => ({ term: g.term, definition: g.definition }))
    },
    response,
    recommendations: context.findings.recommendations,
    warnings: context.findings.problems
  };
}
