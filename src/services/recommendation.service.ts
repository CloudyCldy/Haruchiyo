import { analyzeProject } from "@/services/analysis.service";
import { riskLevel } from "@/services/risk.service";

/**
 * SB-09-ST066 / SB-11 — Motor de recomendaciones basado en reglas.
 * Cada recomendación incluye tipo, prioridad, motivo (reason) y acción sugerida.
 * Se generan solo a partir de datos del proyecto (sin texto libre ni IA).
 */
export type GeneratedRecommendation = {
  projectId: string;
  type: "PERFORMANCE" | "RISK" | "METHODOLOGY" | "TEAM" | "SCHEDULE" | "QUALITY" | "WORKLOAD";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  reason: string;
  suggestedAction: string;
};
const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

export function generateRecommendations(project: any, analysis = analyzeProject(project)): GeneratedRecommendation[] {
  const m = analysis.metrics;
  const projectId = project.id;
  const items: GeneratedRecommendation[] = [];
  const add = (r: Omit<GeneratedRecommendation, "projectId">) => items.push({ projectId, ...r });

  if (m.schedule?.status === "LATE") add({ type: "SCHEDULE", priority: "CRITICAL", title: "Re-baseline the delivery date", description: `The end date has passed with ${m.schedule.remainingTasks} open task(s).`, reason: "The committed deadline is no longer achievable with the current scope.", suggestedAction: "Agree a new date with stakeholders or cut scope to the must-have items." });
  else if (m.schedule?.status === "AT_RISK") add({ type: "SCHEDULE", priority: "HIGH", title: "Recover schedule slippage", description: m.schedule.predictedDelayDays ? `Forecast: ${m.schedule.predictedDelayDays} day(s) late (predicted ${String(m.schedule.predictedCompletionDate).slice(0, 10)}).` : `Actual progress ${m.schedule.actualProgress}% vs planned ${m.schedule.plannedProgress}%.`, reason: "The current throughput does not reach the end date.", suggestedAction: "Prioritize critical-path tasks, remove blockers and consider reducing scope." });
  if (m.blockedTasks) add({ type: "WORKLOAD", priority: "HIGH", title: "Unblock active work", description: `${m.blockedTasks} task(s) are blocked.`, reason: "Blocked work reduces flow and delays delivery.", suggestedAction: "Review blockers with owners and resolve or re-plan them." });
  if (m.overdueTasks) add({ type: "SCHEDULE", priority: m.overdueTasks >= 5 ? "HIGH" : "MEDIUM", title: "Recover overdue work", description: `${m.overdueTasks} task(s) are overdue (avg. ${m.delays.averageDaysOverdue} day(s)).`, reason: "Overdue tasks threaten the delivery schedule.", suggestedAction: "Re-plan overdue work and address its dependencies." });
  if (m.delays?.trend === "WORSENING") add({ type: "SCHEDULE", priority: "MEDIUM", title: "Stop the delay trend", description: `${m.delays.overdueLast14Days} task(s) became overdue in the last 14 days.`, reason: "Delays are accumulating faster than they are being resolved.", suggestedAction: "Review estimates in the next planning session and limit new work in progress." });
  for (const ms of m.delays?.delayedMilestones ?? []) add({ type: "SCHEDULE", priority: "HIGH", title: `Recover milestone: ${ms.name}`, description: `Milestone due ${String(ms.dueDate).slice(0, 10)} is not completed.`, reason: "Missed milestones usually shift every dependent delivery.", suggestedAction: "Identify the remaining work for this milestone and update its date if needed." });
  for (const member of m.workload?.members ?? []) if (member.status === "OVERLOADED") add({ type: "TEAM", priority: member.capacityPercentage >= 150 ? "HIGH" : "MEDIUM", title: `Rebalance workload of ${member.name ?? member.userId}`, description: `${member.hours} h assigned (${member.capacityPercentage}% of ${member.capacityHours} h).`, reason: "Overloaded people become bottlenecks and burn out.", suggestedAction: "Reassign or postpone part of this person's open tasks." });
  if (m.workload?.concentration?.isConcentrated) add({ type: "TEAM", priority: "MEDIUM", title: "Reduce work concentration", description: `${m.workload.concentration.percentage}% of open tasks belong to one person.`, reason: "Concentrated work creates a single point of failure.", suggestedAction: "Distribute tasks and pair on the most critical ones to share knowledge." });
  if (m.workload?.unassignedTasks >= 3) add({ type: "TEAM", priority: "LOW", title: "Assign owners to open tasks", description: `${m.workload.unassignedTasks} open task(s) have no assignee.`, reason: "Work without an owner tends to be forgotten.", suggestedAction: "Assign an owner to every open task in the next stand-up." });
  for (const risk of (project.risks ?? []).filter((r: any) => r.status === "OPEN" && !r.mitigation)) {
    const level = riskLevel(risk.severity ?? 0);
    add({ type: "RISK", priority: level === "CRITICAL" ? "CRITICAL" : level === "HIGH" ? "HIGH" : "MEDIUM", title: `Mitigate risk: ${risk.title}`, description: `Open risk with severity ${risk.severity ?? "?"}/12 has no mitigation plan.`, reason: "Unmitigated risks can become schedule or quality incidents.", suggestedAction: risk.ownerId ? "Ask the risk owner to record a concrete mitigation plan." : "Assign an owner and record a concrete mitigation plan." });
  }
  const criticalIssues = (project.issues ?? []).filter((i: any) => i.priority === "CRITICAL" && ["OPEN", "IN_PROGRESS"].includes(i.status));
  if (criticalIssues.length) add({ type: "QUALITY", priority: "CRITICAL", title: "Resolve critical issues", description: `${criticalIssues.length} critical issue(s) are unresolved.`, reason: "Critical issues directly affect users or the release.", suggestedAction: "Assign each critical issue today and track it daily until closed." });
  if (project.methodologyId === "KANBAN" && (m.kanban?.wip ?? 0) > 10) add({ type: "METHODOLOGY", priority: "MEDIUM", title: "Reduce Kanban WIP", description: `Work in progress is ${m.kanban?.wip}.`, reason: "High WIP increases cycle time and hides bottlenecks.", suggestedAction: "Pause new work and finish the oldest active items first." });
  if (project.methodologyId === "SCRUM" && m.velocity?.trend === "DOWN") add({ type: "PERFORMANCE", priority: "MEDIUM", title: "Investigate falling velocity", description: `Velocity is trending down (avg. ${m.velocity.average} points).`, reason: "A falling velocity signals impediments or over-commitment.", suggestedAction: "Discuss causes in the retrospective and adjust sprint commitment." });
  for (const p of analysis.compliance.problems) add({ type: "METHODOLOGY", priority: p.severity === "CRITICAL" ? "CRITICAL" : p.severity === "HIGH" ? "HIGH" : "MEDIUM", title: `Methodology: ${p.description}`, description: p.description, reason: `Required by ${analysis.methodology} practices.`, suggestedAction: "Apply the corresponding methodology rule (see /methodologies/:id/rules)." });

  const seen = new Set<string>();
  return items
    .filter(r => (seen.has(r.title) ? false : (seen.add(r.title), true)))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}