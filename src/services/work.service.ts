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

export async function listBacklog(projectId: string) { return prisma.backlogItem.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }); }
export async function createBacklogItem(projectId: string, input: any) { await assertSprintBelongsToProject(input.sprintId, projectId); return prisma.backlogItem.create({ data: { ...input, projectId } }); }
export async function getBacklogItem(id: string) { return prisma.backlogItem.findUnique({ where: { id } }); }
export async function updateBacklogItem(id: string, projectId: string, input: any) {
  const current = await getBacklogItem(id); if (!current) return notFound("Backlog item not found");
  await assertSprintBelongsToProject(input.sprintId, projectId);
  assertTransition(current.status, input.status ?? current.status, { BACKLOGGED: ["READY"], READY: ["IN_PROGRESS"], IN_PROGRESS: ["DONE"], DONE: [] });
  return prisma.backlogItem.update({ where: { id }, data: input });
}

export async function listSprints(projectId: string) { return prisma.sprint.findMany({ where: { projectId }, orderBy: { startDate: "asc" } }); }
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