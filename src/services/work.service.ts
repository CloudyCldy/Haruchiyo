import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

function notFound(message: string) { throw new NotFoundError(message); }
function assertTransition<T extends string>(current: T, next: T, allowed: Record<T, T[]>) {
  if (current !== next && !allowed[current].includes(next)) throw new ConflictError("Invalid status transition");
}

export async function assertSprintBelongsToProject(sprintId: string | null | undefined, projectId: string) {
  if (sprintId === undefined || sprintId === null) return;
  const sprint = await prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
  if (!sprint) throw new ValidationError("sprintId must belong to the project");
}
export async function listTasks(projectId: string) { return prisma.task.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }); }
export async function createTask(projectId: string, input: any) { await assertSprintBelongsToProject(input.sprintId, projectId); return prisma.task.create({ data: { ...input, projectId } }); }
export async function getTask(id: string) { return prisma.task.findUnique({ where: { id } }); }
export async function updateTask(id: string, projectId: string, input: any) { await assertSprintBelongsToProject(input.sprintId, projectId); return prisma.task.update({ where: { id }, data: input }); }
export async function deleteTask(id: string) { return prisma.task.delete({ where: { id } }); }

export type BacklogFilters = { type?: string; status?: string; priority?: string; sprintId?: string | null };
const priorityRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
/** SB-04: lista el backlog con filtros opcionales; sprintId=null => ítems sin sprint asignado. Ordenado por prioridad. */
export async function listBacklog(projectId: string, filters: BacklogFilters = {}) {
  const where: Record<string, unknown> = { projectId };
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.sprintId !== undefined) where.sprintId = filters.sprintId;
  const items = await prisma.backlogItem.findMany({ where, orderBy: { createdAt: "desc" } });
  return [...items].sort((a: any, b: any) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9));
}
/** Flujo de estados del backlog: avanza un paso o regresa un paso (reapertura controlada). */
export const BACKLOG_TRANSITIONS = { BACKLOGGED: ["READY"], READY: ["IN_PROGRESS", "BACKLOGGED"], IN_PROGRESS: ["DONE", "READY"], DONE: ["IN_PROGRESS"] } as const;
export async function createBacklogItem(projectId: string, input: any) { await assertSprintBelongsToProject(input.sprintId, projectId); return prisma.backlogItem.create({ data: { ...input, projectId } }); }
export async function getBacklogItem(id: string) { return prisma.backlogItem.findUnique({ where: { id } }); }
export async function updateBacklogItem(id: string, projectId: string, input: any) {
  const current = await getBacklogItem(id); if (!current) return notFound("Backlog item not found");
  await assertSprintBelongsToProject(input.sprintId, projectId);
  assertTransition(current.status, input.status ?? current.status, BACKLOG_TRANSITIONS as unknown as Record<typeof current.status, (typeof current.status)[]>);
  return prisma.backlogItem.update({ where: { id }, data: input });
}

export async function listSprints(projectId: string) { return prisma.sprint.findMany({ where: { projectId }, orderBy: { startDate: "asc" } }); }

export type PartnerSprint = { externalRef: string; name: string; goal?: string; startDate: Date; endDate: Date; status?: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED" };

/**
 * INT-01: deja los sprints de Sanzu del proyecto iguales a los de Haitani.
 * Crea o actualiza cada sprint por su externalRef y borra los que Haitani ya no tiene
 * (sus ítems del backlog quedan "sin sprint"). Los sprints creados en Sanzu (sin externalRef) no se tocan.
 */
export async function syncPartnerSprints(projectId: string, sprints: PartnerSprint[]) {
  type MirrorSprint = { id: string; externalRef: string | null };
  const existing: MirrorSprint[] = await prisma.sprint.findMany({ where: { projectId, externalRef: { not: null } } });
  const byRef = new Map<string | null, MirrorSprint>(existing.map(sprint => [sprint.externalRef, sprint]));
  const incoming = new Set<string>();
  for (const { externalRef, ...data } of sprints) {
    incoming.add(externalRef);
    const current = byRef.get(externalRef);
    if (current) await prisma.sprint.update({ where: { id: current.id }, data });
    else await prisma.sprint.create({ data: { ...data, externalRef, projectId } });
  }
  const stale = existing.filter(sprint => !incoming.has(sprint.externalRef as string)).map(sprint => sprint.id);
  if (stale.length) {
    await prisma.backlogItem.updateMany({ where: { projectId, sprintId: { in: stale } }, data: { sprintId: null } });
    await prisma.sprint.deleteMany({ where: { id: { in: stale } } });
  }
  return listSprints(projectId);
}
export async function createSprint(projectId: string, input: any) { return prisma.sprint.create({ data: { ...input, projectId } }); }
export async function getSprint(id: string) { return prisma.sprint.findUnique({ where: { id }, include: { tasks: true, backlogItems: true } }); }
export async function updateSprint(id: string, input: any) {
  const current = await prisma.sprint.findUnique({ where: { id } }); if (!current) return notFound("Sprint not found");
  const startDate = input.startDate ?? current.startDate; const endDate = input.endDate ?? current.endDate;
  if (startDate >= endDate) throw new ValidationError("startDate must be before endDate");
  assertTransition(current.status, input.status ?? current.status, { PLANNED: ["ACTIVE", "CANCELLED"], ACTIVE: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] });
  return prisma.sprint.update({ where: { id }, data: input });
}
export async function deleteBacklogItem(id: string) { return prisma.backlogItem.delete({ where: { id } }); }
export async function deleteSprint(id: string) { return prisma.sprint.delete({ where: { id } }); }