import { analyzeContext, contextSchema } from "@/services/context.service";
import { parse } from "@/validators/schemas";

const haitaniPayload = {
  project: { name: "Haitani + Sanzu", methodology: "scrum", phase: "ejecución", startDate: "2026-09-13", endDate: "2026-10-24" },
  tasks: [
    { id: 1, title: "API v1", status: "completada", priority: "alta", assignedTo: 7, estimatedHours: 12, dueDate: "2026-09-19" },
    { id: 2, title: "Contrato", status: "bloqueada", priority: "critica", assignedTo: 7, estimatedHours: 12 },
    { id: 3, title: "Kanban", status: "en_proceso", priority: "media", assignedTo: 8, dueDate: "2026-10-01" },
    { id: 4, title: "Revisión", status: "en_revision", assignedTo: 8 },
  ],
  team: [{ userId: 7, name: "Alberto", role: "DEVELOPER" }, { userId: 8, name: "Claudia" }],
  risks: [{ title: "Sanzu caído", probability: "alta", impact: "alta", status: "abierto" }],
  sprint: { name: "Sprint 2", goal: "Kanban", startDate: "2026-09-28", endDate: "2026-10-09", status: "activo" },
  milestones: [{ name: "Release v1.0", dueDate: "2026-10-24", status: "pendiente" }],
  documentation: [{ title: "User Story Template", type: "template" }],
};

describe("INT-01 project context", () => {
  it("accepts Haitani values (Spanish, lowercase, numeric ids)", () => {
    const input = parse(contextSchema, haitaniPayload);
    expect(input.tasks.map(t => t.status)).toEqual(["DONE", "BLOCKED", "IN_PROGRESS", "IN_PROGRESS"]);
    expect(input.tasks[1].priority).toBe("CRITICAL");
    expect(input.tasks[0].assignedTo).toBe("7");
    expect(input.risks[0]).toMatchObject({ probability: "HIGH", impact: "HIGH", status: "OPEN" });
  });

  it("returns health, risks, problems, recommendations and required documents", () => {
    const result = analyzeContext(parse(contextSchema, haitaniPayload), "haitani-proj-1", new Date("2026-10-07T12:00:00Z"));
    expect(result.health.score).toBeGreaterThanOrEqual(0);
    expect(result.methodology).toBe("SCRUM");
    expect(result.blockedTasks).toEqual([{ id: "2", title: "Contrato", assignedTo: "7" }]);
    expect(result.risks.items[0]).toMatchObject({ severity: 9, level: "CRITICAL" });
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.requiredDocuments.phase).toBe("EXECUTION");
    const userStory = result.requiredDocuments.required.find(d => d.id === "user-story");
    expect(userStory?.provided).toBe(true);
    expect(result.requiredDocuments.missing.some(d => d.id === "definition-of-done")).toBe(true);
  });

  it("rejects unknown status values with a clear message", () => {
    expect(() => parse(contextSchema, { ...haitaniPayload, tasks: [{ title: "x", status: "volando" }] })).toThrow(/tasks.0.status: unsupported value "volando"/);
  });

  it("requires a project name", () => {
    expect(() => parse(contextSchema, { project: {} })).toThrow(/project.name/);
  });
});