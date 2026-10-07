import { calculateMetrics, health } from "@/services/metrics.service";
import { getStrategy } from "@/methodology/types";

/**
 * SB-09-ST027 — Análisis del proyecto.
 * Combina las reglas propias de la metodología con detecciones generales
 * (calendario, retrasos, carga, riesgos) y calcula compliance ponderado por severidad.
 */
export type Problem = { type: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string; code?: string };
const SEVERITY_PENALTY: Record<Problem["severity"], number> = { LOW: 4, MEDIUM: 8, HIGH: 12, CRITICAL: 20 };
const SEVERITY_RANK: Record<Problem["severity"], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function detectProblems(project: any, metrics: any): Problem[] {
  const problems: Problem[] = [];
  const s = metrics.schedule;
  if (s?.status === "LATE") problems.push({ code: "SCHEDULE_LATE", type: "SCHEDULE", severity: "CRITICAL", description: `The project passed its end date with ${s.remainingTasks} task(s) still open.` });
  else if (s?.status === "AT_RISK") problems.push({ code: "SCHEDULE_AT_RISK", type: "SCHEDULE", severity: "HIGH", description: s.predictedDelayDays ? `At the current pace the project will finish about ${s.predictedDelayDays} day(s) late.` : `Progress (${s.actualProgress}%) is behind the plan (${s.plannedProgress}%).` });
  if (metrics.overdueTasks) problems.push({ code: "OVERDUE_TASKS", type: "SCHEDULE", severity: metrics.overdueTasks >= 5 ? "HIGH" : "MEDIUM", description: `${metrics.overdueTasks} task(s) are overdue.` });
  if (metrics.delays?.trend === "WORSENING") problems.push({ code: "DELAY_TREND", type: "SCHEDULE", severity: "MEDIUM", description: "Overdue work is growing: most overdue tasks became late in the last 14 days." });
  for (const m of metrics.delays?.delayedMilestones ?? []) problems.push({ code: "MILESTONE_DELAYED", type: "SCHEDULE", severity: "HIGH", description: `Milestone "${m.name}" is delayed.` });
  if (metrics.blockedTasks) problems.push({ code: "BLOCKED_TASKS", type: "WORKFLOW", severity: metrics.blockedTasks > 2 ? "HIGH" : "MEDIUM", description: `${metrics.blockedTasks} task(s) are blocked.` });
  for (const m of metrics.workload?.members ?? []) if (m.status === "OVERLOADED") problems.push({ code: "MEMBER_OVERLOADED", type: "WORKLOAD", severity: m.capacityPercentage >= 150 ? "HIGH" : "MEDIUM", description: `${m.name ?? m.userId} is at ${m.capacityPercentage}% of capacity.` });
  if (metrics.workload?.concentration?.isConcentrated) problems.push({ code: "WORK_CONCENTRATION", type: "WORKLOAD", severity: "MEDIUM", description: `${metrics.workload.concentration.percentage}% of open work is concentrated on one person.` });
  if (metrics.workload?.unassignedTasks >= 3) problems.push({ code: "UNASSIGNED_TASKS", type: "WORKLOAD", severity: "LOW", description: `${metrics.workload.unassignedTasks} open task(s) have no owner.` });
  if (metrics.criticalRiskCount) problems.push({ code: "CRITICAL_RISKS", type: "RISK", severity: "CRITICAL", description: `${metrics.criticalRiskCount} open risk(s) have critical severity.` });
  return problems;
}

export function analyzeProject(project: any, now = new Date()) {
  const metrics = calculateMetrics(project, now);
  const strategy = getStrategy(project.methodologyId ?? "AGILE");
  const methodologyResult = strategy.analyzeProject({ project, tasks: project.tasks ?? [], backlog: project.backlog ?? [], sprints: project.sprints ?? [], members: project.members ?? [], risks: project.risks ?? [], issues: project.issues ?? [], milestones: project.milestones ?? [], metrics });
  const methodologyProblems = methodologyResult.problems as Problem[];
  const general = detectProblems(project, metrics);
  // Evitar duplicados por descripción.
  const seen = new Set<string>();
  const problems = [...methodologyProblems, ...general]
    .filter(p => (seen.has(p.description) ? false : (seen.add(p.description), true)))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  // Compliance: solo penalizan los problemas de la metodología (por severidad).
  const complianceScore = Math.max(0, 100 - methodologyProblems.reduce((sum, p) => sum + (SEVERITY_PENALTY[p.severity] ?? 8), 0));
  const warnings = general.filter(p => p.severity === "LOW" || p.severity === "MEDIUM").map(p => p.description);
  const compliance = {
    methodology: strategy.id,
    score: complianceScore,
    status: complianceScore >= 85 ? "EXCELLENT" : complianceScore >= 70 ? "GOOD" : complianceScore >= 45 ? "WARNING" : "CRITICAL",
    problems: methodologyProblems,
    warnings,
    recommendations: methodologyResult.recommendations,
    rules: strategy.rules,
  };
  return {
    projectId: project.id,
    methodology: strategy.id,
    analyzedAt: now.toISOString(),
    metrics,
    compliance,
    health: health(metrics, complianceScore),
    problems,
    recommendations: methodologyResult.recommendations,
  };
}