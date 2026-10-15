import { prisma } from "@/lib/prisma";
import { analyzeProject } from "@/services/analysis.service";
import { corpusService } from "@/knowledge/corpus.service";
import { ProjectKnowledgeBase } from "@/knowledge/corpus.types";

export interface EnrichedProjectContext {
  project: {
    id: string;
    name: string;
    description: string | null;
    methodology: string;
    requirements: unknown;
  };
  findings: ReturnType<typeof analyzeProject>;
  knowledgeBase: ProjectKnowledgeBase;
  tasks: any[];
  backlog: any[];
  sprints: any[];
  team: any[];
  risks: any[];
  issues: any[];
  milestones: any[];
}

export async function buildProjectContext(
  projectId: string,
  requirements?: unknown,
  query?: string
): Promise<EnrichedProjectContext> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      methodology: true,
      tasks: true,
      backlog: true,
      sprints: true,
      members: true,
      risks: true,
      issues: true,
      milestones: true
    }
  });

  const findings = analyzeProject(project);

  const knowledgeBase = corpusService.getKnowledgeForProject({
    methodology: project.methodology.name,
    query: query || "",
    projectState: {
      blockedCount: findings.metrics.blockedTasks,
      overdueCount: findings.metrics.overdueTasks,
      riskCount: findings.metrics.riskCount,
      issuesCount: findings.metrics.issueCount
    }
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      methodology: project.methodology.name,
      requirements: requirements ?? project.requirements
    },
    findings,
    knowledgeBase,
    tasks: project.tasks,
    backlog: project.backlog,
    sprints: project.sprints,
    team: project.members,
    risks: project.risks,
    issues: project.issues,
    milestones: project.milestones
  };
}
