/**
 * SB-09 — Métricas y health score del proyecto.
 * Todo es determinístico: el mismo proyecto + la misma fecha `now` producen
 * exactamente el mismo resultado. No depende de ningún proveedor de IA.
 */
const DAY = 24 * 60 * 60 * 1000;
const OPEN_TASK = (t: any) => !["DONE", "CANCELLED"].includes(t.status);
const round = (n: number, digits = 0) => { const f = 10 ** digits; return Math.round(n * f) / f; };
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const toDate = (v: unknown) => (v ? new Date(v as string) : null);

export const DEFAULT_WEEKLY_CAPACITY_HOURS = 40;

function weeklyCapacity(project: any) {
  const configured = Number(project?.configuration?.weeklyCapacityHours);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_WEEKLY_CAPACITY_HOURS;
}

/** Workload por persona con % de capacidad (SB-07-ST064) y concentración de trabajo (SB-09-ST068). */
export function calculateWorkload(project: any) {
  const tasks = (project.tasks ?? []).filter(OPEN_TASK);
  const capacity = weeklyCapacity(project);
  const names = new Map<string, string>();
  for (const m of project.members ?? []) if (m.userId) names.set(String(m.userId), m.user?.name ?? m.name ?? undefined);
  const byUser = new Map<string, { hours: number; openTasks: number; blockedTasks: number; overdueTasks: number }>();
  const now = Date.now();
  let unassignedTasks = 0;
  for (const t of tasks) {
    if (!t.assignedTo) { unassignedTasks++; continue; }
    const key = String(t.assignedTo);
    const entry = byUser.get(key) ?? { hours: 0, openTasks: 0, blockedTasks: 0, overdueTasks: 0 };
    entry.hours += t.estimatedHours ?? 0;
    entry.openTasks += 1;
    if (t.status === "BLOCKED") entry.blockedTasks += 1;
    if (t.dueDate && new Date(t.dueDate).getTime() < now) entry.overdueTasks += 1;
    byUser.set(key, entry);
  }
  const members = [...byUser.entries()].map(([userId, e]) => {
    const capacityPercentage = round(e.hours / capacity * 100);
    return { userId, name: names.get(userId), hours: round(e.hours, 1), openTasks: e.openTasks, blockedTasks: e.blockedTasks, overdueTasks: e.overdueTasks, capacityHours: capacity, capacityPercentage, status: capacityPercentage > 100 ? "OVERLOADED" : capacityPercentage >= 80 ? "AT_CAPACITY" : capacityPercentage === 0 ? "IDLE" : "OK" };
  }).sort((a, b) => b.hours - a.hours || b.openTasks - a.openTasks);
  const totalOpenTasks = members.reduce((s, m) => s + m.openTasks, 0);
  const top = members[0];
  const concentration = top && totalOpenTasks ? round(top.openTasks / totalOpenTasks * 100) : 0;
  return {
    capacityHoursPerPerson: capacity,
    members,
    unassignedTasks,
    overloadedMembers: members.filter(m => m.status === "OVERLOADED").map(m => m.userId),
    concentration: { topUserId: top?.userId ?? null, percentage: concentration, isConcentrated: members.length > 1 && concentration >= 50 },
  };
}

/** Velocidad: puntos completados por sprint cerrado (tareas + ítems de backlog DONE). */
export function calculateVelocity(project: any) {
  const completedSprints = (project.sprints ?? []).filter((s: any) => s.status === "COMPLETED");
  const items = [...(project.tasks ?? []), ...(project.backlog ?? [])];
  const perSprint = completedSprints
    .sort((a: any, b: any) => +new Date(a.endDate) - +new Date(b.endDate))
    .map((s: any) => ({ sprintId: s.id, name: s.name, points: items.filter(i => i.sprintId === s.id && i.status === "DONE").reduce((sum, i) => sum + (i.storyPoints ?? 0), 0) }));
  const average = perSprint.length ? round(perSprint.reduce((s: number, x: any) => s + x.points, 0) / perSprint.length, 1) : 0;
  const last = perSprint.slice(-3);
  const trend = last.length < 2 ? "STABLE" : last[last.length - 1].points > last[0].points ? "UP" : last[last.length - 1].points < last[0].points ? "DOWN" : "STABLE";
  return { average, perSprint, trend };
}

/** SB-09-ST067: predicción de calendario a partir del ritmo real de cierre de tareas. */
export function predictSchedule(project: any, now = new Date()) {
  const tasks = (project.tasks ?? []).filter((t: any) => t.status !== "CANCELLED");
  const done = tasks.filter((t: any) => t.status === "DONE").length;
  const remaining = tasks.length - done;
  const start = toDate(project.startDate) ?? toDate(project.createdAt);
  const end = toDate(project.endDate);
  const actualProgress = tasks.length ? round(done / tasks.length * 100) : 0;
  if (!start) return { status: "UNKNOWN", reason: "Project has no start date", actualProgress, remainingTasks: remaining } as const;
  const elapsedDays = Math.max(1, (now.getTime() - start.getTime()) / DAY);
  const ratePerDay = done / elapsedDays;
  const predictedCompletionDate = remaining === 0 ? now.toISOString() : ratePerDay > 0 ? new Date(now.getTime() + remaining / ratePerDay * DAY).toISOString() : null;
  const base = { startDate: start.toISOString(), endDate: end?.toISOString() ?? null, actualProgress, remainingTasks: remaining, throughputPerWeek: round(ratePerDay * 7, 2), predictedCompletionDate };
  if (!end) return { ...base, status: "UNKNOWN", reason: "Project has no end date", plannedProgress: null, scheduleVariance: null, daysRemaining: null, predictedDelayDays: null };
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / DAY);
  const plannedProgress = round(clamp((now.getTime() - start.getTime()) / DAY / totalDays * 100));
  const scheduleVariance = actualProgress - plannedProgress;
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / DAY);
  const predictedDelayDays = predictedCompletionDate ? Math.max(0, Math.ceil((new Date(predictedCompletionDate).getTime() - end.getTime()) / DAY)) : null;
  const status = remaining === 0 ? "ON_TRACK"
    : daysRemaining < 0 ? "LATE"
    : predictedDelayDays === null ? (plannedProgress > 25 ? "AT_RISK" : "ON_TRACK")
    : predictedDelayDays > 0 || scheduleVariance <= -20 ? "AT_RISK" : "ON_TRACK";
  return { ...base, status, plannedProgress, scheduleVariance, daysRemaining, predictedDelayDays };
}

/** SB-09-ST068: tendencias de retraso. */
export function calculateDelayTrend(project: any, now = new Date()) {
  const withDue = (project.tasks ?? []).filter((t: any) => t.dueDate && t.status !== "CANCELLED");
  const overdue = withDue.filter((t: any) => OPEN_TASK(t) && new Date(t.dueDate) < now);
  const avgDaysOverdue = overdue.length ? round(overdue.reduce((s: number, t: any) => s + (now.getTime() - new Date(t.dueDate).getTime()) / DAY, 0) / overdue.length, 1) : 0;
  const recentWindow = new Date(now.getTime() - 14 * DAY);
  const recent = overdue.filter((t: any) => new Date(t.dueDate) >= recentWindow).length;
  const older = overdue.length - recent;
  const milestones = project.milestones ?? [];
  const delayedMilestones = milestones.filter((m: any) => m.status === "DELAYED" || (!["COMPLETED", "CANCELLED"].includes(m.status) && new Date(m.dueDate) < now));
  return {
    overdueRatio: withDue.length ? round(overdue.length / withDue.length * 100) : 0,
    averageDaysOverdue: avgDaysOverdue,
    overdueLast14Days: recent,
    overdueOlder: older,
    trend: recent > older ? "WORSENING" : overdue.length === 0 ? "NONE" : "STABLE",
    delayedMilestones: delayedMilestones.map((m: any) => ({ id: m.id, name: m.name, dueDate: m.dueDate })),
  };
}

export function calculateMetrics(project: any, now = new Date()) {
  const tasks = project.tasks ?? [];
  const active = tasks.filter((t: any) => t.status !== "CANCELLED");
  const total = active.length;
  const completed = active.filter((t: any) => t.status === "DONE").length;
  const overdue = active.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && OPEN_TASK(t)).length;
  const points = active.reduce((sum: number, t: any) => sum + (t.storyPoints ?? 0), 0);
  const completedPoints = active.filter((t: any) => t.status === "DONE").reduce((sum: number, t: any) => sum + (t.storyPoints ?? 0), 0);
  const openRisks = (project.risks ?? []).filter((r: any) => ["OPEN", "ACCEPTED"].includes(r.status ?? "OPEN"));
  const openIssues = (project.issues ?? []).filter((i: any) => ["OPEN", "IN_PROGRESS"].includes(i.status ?? "OPEN"));
  const workload = calculateWorkload(project);
  const progress = total ? Math.round(completed / total * 100) : 0;
  const velocity = calculateVelocity(project);
  return {
    taskCompletionPercentage: progress,
    progress,
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: total - completed,
    inProgressTasks: active.filter((t: any) => t.status === "IN_PROGRESS").length,
    blockedTasks: active.filter((t: any) => t.status === "BLOCKED").length,
    overdueTasks: overdue,
    storyPoints: { total: points, completed: completedPoints },
    velocity,
    teamWorkload: workload.members.map(m => ({ userId: m.userId, hours: m.hours, capacityPercentage: m.capacityPercentage, status: m.status })),
    workload,
    riskCount: openRisks.length,
    criticalRiskCount: openRisks.filter((r: any) => (r.severity ?? 0) >= 9).length,
    issueCount: openIssues.length,
    criticalIssueCount: openIssues.filter((i: any) => i.priority === "CRITICAL").length,
    milestoneProgress: project.milestones?.length ? Math.round(project.milestones.filter((m: any) => m.status === "COMPLETED").length / project.milestones.length * 100) : 0,
    schedule: predictSchedule(project, now),
    delays: calculateDelayTrend(project, now),
    scrum: project.methodologyId === "SCRUM" ? { storyPoints: points, completedPoints, sprintCount: project.sprints?.length ?? 0, velocity: velocity.average } : undefined,
    kanban: project.methodologyId === "KANBAN" ? { wip: active.filter((t: any) => ["TODO", "IN_PROGRESS", "BLOCKED"].includes(t.status)).length, throughput: completed } : undefined,
  };
}

/**
 * Health score 0–100 (SB-09-ST023). Pesos fijos y documentados:
 *  progreso/calendario 25%, entrega (vencidas+bloqueadas) 20%, riesgos 15%,
 *  incidencias 10%, carga del equipo 10%, cumplimiento de metodología 20%.
 */
export const HEALTH_WEIGHTS = { schedule: 0.25, delivery: 0.2, risks: 0.15, issues: 0.1, teamWorkload: 0.1, methodologyCompliance: 0.2 } as const;

export function health(metrics: any, compliance = 100) {
  const total = Math.max(1, metrics.totalTasks ?? (metrics.completedTasks + metrics.pendingTasks));
  const sched = metrics.schedule;
  const schedule = sched && typeof sched.scheduleVariance === "number"
    ? clamp(100 + sched.scheduleVariance * 1.5 - (sched.predictedDelayDays ?? 0) * 2)
    : metrics.progress;
  const delivery = clamp(100 - (metrics.overdueTasks / total) * 150 - (metrics.blockedTasks / total) * 100);
  const risks = clamp(100 - (metrics.riskCount ?? 0) * 8 - (metrics.criticalRiskCount ?? 0) * 15);
  const issues = clamp(100 - (metrics.issueCount ?? 0) * 10 - (metrics.criticalIssueCount ?? 0) * 20);
  const workloadMembers = metrics.workload?.members ?? metrics.teamWorkload ?? [];
  const maxCapacity = workloadMembers.length ? Math.max(...workloadMembers.map((m: any) => m.capacityPercentage ?? m.hours / 0.4)) : 0;
  const teamWorkload = clamp(maxCapacity <= 100 ? 100 : 100 - (maxCapacity - 100)) - (metrics.workload?.concentration?.isConcentrated ? 15 : 0);
  const factors = { schedule: round(schedule), delivery: round(delivery), risks: round(risks), issues: round(issues), teamWorkload: round(clamp(teamWorkload)), methodologyCompliance: round(clamp(compliance)), progress: metrics.progress };
  const score = Math.round(
    factors.schedule * HEALTH_WEIGHTS.schedule + factors.delivery * HEALTH_WEIGHTS.delivery + factors.risks * HEALTH_WEIGHTS.risks +
    factors.issues * HEALTH_WEIGHTS.issues + factors.teamWorkload * HEALTH_WEIGHTS.teamWorkload + factors.methodologyCompliance * HEALTH_WEIGHTS.methodologyCompliance,
  );
  return { score, status: score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : score >= 45 ? "WARNING" : "CRITICAL", factors, weights: HEALTH_WEIGHTS };
}