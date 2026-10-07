import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";

export const fullProjectInclude = {
  methodology: true,
  members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
  tasks: true,
  backlog: true,
  sprints: true,
  milestones: true,
  risks: true,
  issues: true,
} as const;

export const analysisInclude = { tasks: true, backlog: true, sprints: true, members: true, risks: true, issues: true, milestones: true } as const;

/** SB-02: la metodología debe existir en el catálogo antes de crear/actualizar un proyecto. */
export async function assertMethodologyExists(methodologyId?: string) {
  if (methodologyId === undefined) return;
  const methodology = await prisma.methodology.findUnique({ where: { id: methodologyId.toUpperCase() } });
  if (!methodology) throw new ValidationError(`methodologyId "${methodologyId}" does not exist in the methodology catalog`);
  return methodology.id;
}

export function assertDateRange(startDate?: Date | null, endDate?: Date | null) {
  if (startDate && endDate && startDate > endDate) throw new ValidationError("startDate must be before endDate");
}

export async function loadProjectForAnalysis(id: string) {
  return prisma.project.findUniqueOrThrow({ where: { id }, include: analysisInclude });
}