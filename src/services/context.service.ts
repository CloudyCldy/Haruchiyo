/**
 * INT-01 — Contexto de proyecto enviado por Haitani (ST042–ST044).
 *
 * Haitani envía el estado real del proyecto (tareas, equipo, riesgos, sprint,
 * milestones, metodología y documentación) y Sanzu devuelve health, riesgos,
 * problemas, recomendaciones y documentos requeridos. El análisis es
 * determinístico y no guarda nada en la base de datos (stateless).
 */
import { z } from "zod";
import { analyzeProject } from "@/services/analysis.service";
import { generateRecommendations } from "@/services/recommendation.service";
import { riskLevel, riskSeverity, summarizeRisks } from "@/services/risk.service";
import { getStrategy } from "@/methodology/types";
import { KnowledgeService } from "@/knowledge/service";

// ---------- Normalización de valores de Haitani (español / minúsculas) ----------
const TASK_STATUS: Record<string, string> = {
  pendiente: "TODO", todo: "TODO", pending: "TODO", por_hacer: "TODO",
  en_proceso: "IN_PROGRESS", in_progress: "IN_PROGRESS", en_progreso: "IN_PROGRESS", en_revision: "IN_PROGRESS", in_review: "IN_PROGRESS", review: "IN_PROGRESS",
  bloqueada: "BLOCKED", blocked: "BLOCKED",
  completada: "DONE", done: "DONE", completed: "DONE",
  cancelada: "CANCELLED", cancelled: "CANCELLED", canceled: "CANCELLED",
};
const PRIORITY: Record<string, string> = { baja: "LOW", low: "LOW", media: "MEDIUM", medium: "MEDIUM", alta: "HIGH", high: "HIGH", critica: "CRITICAL", "crítica": "CRITICAL", critical: "CRITICAL" };
const LEVEL3: Record<string, string> = { baja: "LOW", low: "LOW", media: "MEDIUM", medium: "MEDIUM", alta: "HIGH", high: "HIGH" };
const RISK_STATUS: Record<string, string> = { open: "OPEN", abierto: "OPEN", mitigated: "MITIGATED", mitigado: "MITIGATED", accepted: "ACCEPTED", aceptado: "ACCEPTED", closed: "CLOSED", cerrado: "CLOSED" };
const MILESTONE_STATUS: Record<string, string> = { pending: "PENDING", pendiente: "PENDING", in_progress: "IN_PROGRESS", en_proceso: "IN_PROGRESS", completed: "COMPLETED", completado: "COMPLETED", completada: "COMPLETED", delayed: "DELAYED", retrasado: "DELAYED", cancelled: "CANCELLED", cancelado: "CANCELLED" };
const SPRINT_STATUS: Record<string, string> = { planned: "PLANNED", planificado: "PLANNED", active: "ACTIVE", activo: "ACTIVE", completed: "COMPLETED", completado: "COMPLETED", cancelled: "CANCELLED", cancelado: "CANCELLED" };
const ISSUE_STATUS: Record<string, string> = { open: "OPEN", abierta: "OPEN", in_review: "IN_PROGRESS", in_progress: "IN_PROGRESS", en_proceso: "IN_PROGRESS", resolved: "RESOLVED", resuelta: "RESOLVED", appealed: "OPEN", closed: "CLOSED", cerrada: "CLOSED" };

const mapped = (table: Record<string, string>, fallback: string) =>
  z.preprocess(v => (v === undefined || v === null || v === "" ? undefined : String(v).trim().toLowerCase().replace(/\s+/g, "_")), z.string().optional())
    .transform((v, ctx) => {
      if (v === undefined) return fallback;
      const upper = v.toUpperCase();
      const value = table[v] ?? (Object.values(table).includes(upper) ? upper : undefined);
      if (!value) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unsupported value "${v}"` }); return z.NEVER; }
      return value;
    });
const id = z.union([z.string(), z.number()]).transform(String);
const optionalId = id.nullable().optional();
const date = z.coerce.date();
const optionalDate = z.union([date, z.null()]).optional();

export const contextSchema = z.object({
  project: z.object({
    name: z.string().trim().min(1),
    description: z.string().nullable().optional(),
    methodology: z.string().trim().min(1).optional(),
    methodologyId: z.string().trim().min(1).optional(),
    status: z.string().optional(),
    phase: z.string().optional(),
    startDate: optionalDate,
    endDate: optionalDate,
    weeklyCapacityHours: z.number().positive().optional(),
  }),
  tasks: z.array(z.object({
    id: optionalId, title: z.string().trim().min(1), status: mapped(TASK_STATUS, "TODO"), priority: mapped(PRIORITY, "MEDIUM"),
    assignedTo: optionalId, estimatedHours: z.number().nonnegative().nullable().optional(), storyPoints: z.number().int().nonnegative().nullable().optional(),
    dueDate: optionalDate, sprintId: optionalId,
  })).max(5000).default([]),
  team: z.array(z.object({ userId: id, name: z.string().optional(), role: z.string().optional(), weeklyCapacityHours: z.number().positive().optional() })).max(500).default([]),
  risks: z.array(z.object({
    id: optionalId, title: z.string().trim().min(1), description: z.string().nullable().optional(),
    probability: mapped(LEVEL3, "MEDIUM"), impact: mapped(PRIORITY, "MEDIUM"), status: mapped(RISK_STATUS, "OPEN"),
    mitigation: z.string().nullable().optional(), ownerId: optionalId,
  })).max(1000).default([]),
  sprint: z.object({ id: optionalId, name: z.string().trim().min(1), goal: z.string().nullable().optional(), startDate: date, endDate: date, status: mapped(SPRINT_STATUS, "ACTIVE") }).nullable().optional(),
  sprints: z.array(z.object({ id: optionalId, name: z.string().trim().min(1), goal: z.string().nullable().optional(), startDate: date, endDate: date, status: mapped(SPRINT_STATUS, "PLANNED") })).max(500).default([]),
  milestones: z.array(z.object({ id: optionalId, name: z.string().trim().min(1), dueDate: date, status: mapped(MILESTONE_STATUS, "PENDING") })).max(500).default([]),
  issues: z.array(z.object({ id: optionalId, title: z.string().trim().min(1), priority: mapped(PRIORITY, "MEDIUM"), status: mapped(ISSUE_STATUS, "OPEN"), assignedTo: optionalId })).max(2000).default([]),
  documentation: z.array(z.object({ id: optionalId, title: z.string().trim().min(1), type: z.string().optional(), url: z.string().optional() })).max(1000).default([]),
});
export type ProjectContextInput = z.infer<typeof contextSchema>;

// ---------- Documentos requeridos ----------
const PHASE_DOCUMENTS: Record<string, string[]> = {
  INITIATION: ["project-charter", "risk-management", "definition-of-ready"],
  PLANNING: ["project-charter", "sprint-planning", "user-story", "definition-of-ready", "definition-of-done", "risk-management", "sprint-lifecycle"],
  EXECUTION: ["user-story", "bug-report", "definition-of-done", "sprint-review-checklist", "architecture-decision-record", "sprint-lifecycle"],
  RELEASE: ["release-readiness-checklist", "release-management", "security-compliance-checklist", "definition-of-done"],
  CLOSING: ["release-readiness-checklist", "release-management"],
};
const PHASE_ALIASES: Record<string, string> = { inicio: "INITIATION", initiation: "INITIATION", planning: "PLANNING", planificacion: "PLANNING", "planificación": "PLANNING", execution: "EXECUTION", ejecucion: "EXECUTION", "ejecución": "EXECUTION", active: "EXECUTION", release: "RELEASE", lanzamiento: "RELEASE", closing: "CLOSING", cierre: "CLOSING", completed: "CLOSING" };

function knowledgeItem(id: string) {
  const t = KnowledgeService.getTemplate(id); if (t) return { id, title: t.name, kind: "TEMPLATE" as const };
  const c = KnowledgeService.getChecklist(id); if (c) return { id, title: c.name, kind: "CHECKLIST" as const };
  const p = KnowledgeService.getProcess(id); if (p) return { id, title: p.name, kind: "PROCESS" as const };
  const d = KnowledgeService.getDocumentation(id); if (d) return { id, title: d.title, kind: "DOCUMENTATION" as const };
  return { id, title: id, kind: "TEMPLATE" as const };
}
const normalizeText = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function resolvePhase(project: { phase?: string; status?: string }) {
  const raw = project.phase ?? project.status;
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  return PHASE_ALIASES[key] ?? (PHASE_DOCUMENTS[raw.toUpperCase()] ? raw.toUpperCase() : undefined);
}

export function requiredDocuments(methodologyId: string, phase: string | undefined, input: Pick<ProjectContextInput, "documentation" | "risks" | "issues">) {
  const strategy = getStrategy(methodologyId);
  const methodologyDocs = new Set([...(strategy.templates ?? []), ...(strategy.processes ?? []), ...(strategy.checklists ?? [])]);
  let ids = phase ? (PHASE_DOCUMENTS[phase] ?? []).filter(d => methodologyDocs.has(d)) : [...methodologyDocs];
  if (input.risks.length && methodologyDocs.has("risk-management")) ids.push("risk-management");
  if (input.issues.length) ids.push("bug-report");
  ids = [...new Set(ids)];
  const provided = input.documentation.map(d => ({ ...d, key: normalizeText(`${d.id ?? ""} ${d.type ?? ""} ${d.title}`) }));
  const items = ids.map(docId => {
    const k = knowledgeItem(docId);
    const needles = [normalizeText(docId.replace(/-/g, " ")), normalizeText(k.title)];
    const match = provided.find(p => needles.some(n => n && p.key.includes(n)));
    return { ...k, provided: Boolean(match), providedAs: match ? { id: match.id ?? null, title: match.title } : null, link: `/api/v1/${k.kind === "CHECKLIST" ? "checklists" : k.kind === "PROCESS" ? "processes" : k.kind === "DOCUMENTATION" ? "documentation" : "templates"}/${docId}` };
  });
  return { methodology: strategy.id, phase: phase ?? null, required: items, missing: items.filter(i => !i.provided), coverage: items.length ? Math.round(items.filter(i => i.provided).length / items.length * 100) : 100 };
}

/** Convierte el contexto de Haitani al modelo interno que usan los servicios de análisis. */
export function toProjectModel(input: ProjectContextInput, projectId: string) {
  const methodologyId = (input.project.methodologyId ?? input.project.methodology ?? "AGILE").toUpperCase();
  const sprints = [...input.sprints, ...(input.sprint ? [input.sprint] : [])].map((s, i) => ({ ...s, id: s.id ?? `sprint-${i}` }));
  return {
    id: projectId,
    name: input.project.name,
    description: input.project.description ?? null,
    methodologyId,
    startDate: input.project.startDate ?? null,
    endDate: input.project.endDate ?? null,
    configuration: input.project.weeklyCapacityHours ? { weeklyCapacityHours: input.project.weeklyCapacityHours } : undefined,
    tasks: input.tasks.map((t, i) => ({ ...t, id: t.id ?? `task-${i}` })),
    backlog: [],
    sprints,
    members: input.team.map(m => ({ userId: m.userId, role: m.role, user: { name: m.name } })),
    risks: input.risks.map((r, i) => ({ ...r, id: r.id ?? `risk-${i}`, severity: riskSeverity(r.probability, r.impact) })),
    issues: input.issues.map((x, i) => ({ ...x, id: x.id ?? `issue-${i}` })),
    milestones: input.milestones.map((m, i) => ({ ...m, id: m.id ?? `milestone-${i}` })),
  };
}

export function analyzeContext(input: ProjectContextInput, projectId: string, now = new Date()) {
  const project = toProjectModel(input, projectId);
  const analysis = analyzeProject(project, now);
  const recommendations = generateRecommendations(project, analysis);
  const phase = resolvePhase(input.project);
  const m = analysis.metrics;
  return {
    projectId,
    analyzedAt: analysis.analyzedAt,
    methodology: analysis.methodology,
    health: analysis.health,
    summary: {
      progress: m.progress,
      totalTasks: m.totalTasks,
      completedTasks: m.completedTasks,
      blockedTasks: m.blockedTasks,
      overdueTasks: m.overdueTasks,
      schedule: m.schedule,
      delays: m.delays,
      workload: m.workload,
      velocity: m.velocity,
    },
    blockedTasks: project.tasks.filter(t => t.status === "BLOCKED").map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedTo ?? null })),
    risks: { items: [...project.risks].sort((a, b) => b.severity - a.severity).map(r => ({ id: r.id, title: r.title, severity: r.severity, level: riskLevel(r.severity), status: r.status, mitigation: r.mitigation ?? null })), summary: summarizeRisks(project.risks) },
    problems: analysis.problems,
    compliance: analysis.compliance,
    recommendations,
    requiredDocuments: requiredDocuments(project.methodologyId, phase, input),
  };
}