import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { riskSeverity } from "@/services/risk.service";
const enums = { priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), role: z.enum(["PROJECT_MANAGER", "PRODUCT_OWNER", "SCRUM_MASTER", "DEVELOPER", "DESIGNER", "TESTER", "ANALYST", "STAKEHOLDER", "OTHER"]) };
export const resourceSchemas: Record<string, z.ZodSchema<any>> = {
  team: z.object({ userId: z.string(), role: enums.role }),
  backlog: z.object({ title: z.string().min(1), description: z.string().optional(), type: z.enum(["USER_STORY", "BUG", "TASK", "FEATURE", "IMPROVEMENT"]), priority: enums.priority.optional(), storyPoints: z.number().int().nonnegative().optional(), status: z.enum(["BACKLOGGED", "READY", "IN_PROGRESS", "DONE"]).optional(), acceptanceCriteria: z.string().optional(), sprintId: z.string().nullable().optional() }),
  sprints: z.object({ name: z.string().min(1), goal: z.string().optional(), startDate: z.coerce.date(), endDate: z.coerce.date(), status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional() }),
  milestones: z.object({ name: z.string().min(1), description: z.string().optional(), dueDate: z.coerce.date(), status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"]).optional() }),
  risks: z.object({ title: z.string().min(1), description: z.string().optional(), probability: z.enum(["LOW", "MEDIUM", "HIGH"]), impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), status: z.enum(["OPEN", "MITIGATED", "ACCEPTED", "CLOSED"]).optional(), mitigation: z.string().optional(), ownerId: z.string().nullable().optional() }),
  issues: z.object({ title: z.string().min(1), description: z.string().optional(), priority: enums.priority.optional(), status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(), assignedTo: z.string().nullable().optional() })
};
const delegates: Record<string, any> = { team: prisma.projectMember, backlog: prisma.backlogItem, sprints: prisma.sprint, milestones: prisma.milestone, risks: prisma.risk, issues: prisma.issue };
export async function listResource(resource: string, projectId: string) { const delegate = delegates[resource]; if (!delegate) throw Object.assign(new Error("Unknown project resource"), { name: "NotFoundError" }); return resource === "team" ? delegate.findMany({ where: { projectId }, include: { user: { select: { id: true, name: true, email: true, role: true } } } }) : delegate.findMany({ where: { projectId }, orderBy: resource === "risks" ? [{ severity: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" } }); }
export { riskSeverity, riskLevel } from "@/services/risk.service";
export async function createResource(resource: string, projectId: string, input: any) { const delegate = delegates[resource]; if (!delegate) throw Object.assign(new Error("Unknown project resource"), { name: "NotFoundError" }); const data = resource === "risks" ? { ...input, projectId, severity: riskSeverity(input.probability, input.impact) } : { ...input, projectId }; return delegate.create({ data }); }
export async function updateResource(resource: string, id: string, input: any) {
  const delegate = delegates[resource]; if (!delegate) throw Object.assign(new Error("Unknown project resource"), { name: "NotFoundError" });
  if (resource === "risks" && (input.probability || input.impact)) {
    const current = await delegate.findUnique({ where: { id } });
    input = { ...input, severity: riskSeverity(input.probability ?? current.probability, input.impact ?? current.impact) };
  }
  return delegate.update({ where: { id }, data: input });
}
export async function deleteResource(resource: string, id: string) { const delegate = delegates[resource]; if (!delegate) throw Object.assign(new Error("Unknown project resource"), { name: "NotFoundError" }); return delegate.delete({ where: { id } }); }
export async function getResourceProject(resource: string, id: string) { const delegate = delegates[resource]; if (!delegate) return null; return delegate.findUnique({ where: { id } }); }