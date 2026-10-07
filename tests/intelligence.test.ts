import { calculateMetrics, health, predictSchedule, calculateWorkload } from "@/services/metrics.service";
import { analyzeProject } from "@/services/analysis.service";
import { generateRecommendations } from "@/services/recommendation.service";
import { riskSeverity, riskLevel, summarizeRisks } from "@/services/risk.service";

const now = new Date("2026-10-07T12:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86400000);
const project = {
  id: "p1", methodologyId: "SCRUM", startDate: day(-30), endDate: day(10), createdAt: day(-30),
  members: [{ userId: "u1", user: { name: "Alberto" } }, { userId: "u2", user: { name: "Claudia" } }],
  tasks: [
    { id: "t1", status: "DONE", assignedTo: "u1", estimatedHours: 5, storyPoints: 3, sprintId: "s1" },
    { id: "t2", status: "BLOCKED", assignedTo: "u1", estimatedHours: 30 },
    { id: "t3", status: "IN_PROGRESS", assignedTo: "u1", estimatedHours: 30, dueDate: day(-3) },
    { id: "t4", status: "TODO", assignedTo: "u2", estimatedHours: 4, dueDate: day(-20) },
    { id: "t5", status: "CANCELLED", assignedTo: "u2", estimatedHours: 50 },
  ],
  sprints: [{ id: "s1", name: "Sprint 1", goal: "Auth", status: "COMPLETED", endDate: day(-15) }],
  risks: [{ id: "r1", title: "API rate limit", status: "OPEN", probability: "HIGH", impact: "CRITICAL", severity: 12, mitigation: null }],
  issues: [], milestones: [{ id: "m1", name: "Beta", dueDate: day(-1), status: "IN_PROGRESS" }], backlog: [],
};

describe("SB-07 risks", () => {
  it("calculates severity from probability x impact", () => {
    expect(riskSeverity("HIGH", "CRITICAL")).toBe(12);
    expect(riskSeverity("LOW", "LOW")).toBe(1);
    expect(riskLevel(6)).toBe("HIGH");
    expect(summarizeRisks(project.risks).byLevel.CRITICAL).toBe(1);
  });
});

describe("SB-09 metrics", () => {
  const metrics = calculateMetrics(project, now);
  it("excludes cancelled tasks and counts overdue/blocked work", () => {
    expect(metrics.totalTasks).toBe(4);
    expect(metrics.progress).toBe(25);
    expect(metrics.blockedTasks).toBe(1);
    expect(metrics.overdueTasks).toBe(2);
    expect(metrics.velocity.average).toBe(3);
  });
  it("computes workload capacity % and concentration (ST064, ST068)", () => {
    const w = calculateWorkload(project);
    expect(w.members[0]).toMatchObject({ userId: "u1", hours: 60, capacityPercentage: 150, status: "OVERLOADED", name: "Alberto" });
    expect(w.concentration.isConcentrated).toBe(true);
  });
  it("predicts the schedule (ST067)", () => {
    const s = predictSchedule(project, now) as any;
    expect(s.plannedProgress).toBe(75);
    expect(s.status).toBe("AT_RISK");
    expect(s.predictedDelayDays).toBeGreaterThan(0);
  });
  it("is deterministic and does not depend on AI", () => {
    expect(health(calculateMetrics(project, now))).toEqual(health(calculateMetrics(project, now)));
    const h = health(metrics);
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });
  it("a healthy finished project scores high", () => {
    const good = { id: "p", methodologyId: "KANBAN", startDate: day(-10), endDate: day(10), tasks: [{ status: "DONE" }, { status: "DONE" }], risks: [], issues: [], milestones: [], sprints: [], members: [] };
    expect(analyzeProject(good, now).health.status).toBe("EXCELLENT");
  });
});

describe("SB-09 analysis and recommendations", () => {
  const analysis = analyzeProject(project, now);
  it("detects problems sorted by severity", () => {
    const codes = analysis.problems.map((p: any) => p.code).filter(Boolean);
    expect(codes).toEqual(expect.arrayContaining(["SCHEDULE_AT_RISK", "MILESTONE_DELAYED", "MEMBER_OVERLOADED", "CRITICAL_RISKS", "BLOCKED_TASKS"]));
    expect(analysis.problems[0].severity).toBe("CRITICAL");
  });
  it("every recommendation has type, priority, reason and suggestedAction", () => {
    const recs = generateRecommendations(project, analysis);
    expect(recs.length).toBeGreaterThan(3);
    for (const r of recs) { expect(r.type).toBeTruthy(); expect(r.priority).toBeTruthy(); expect(r.reason).toBeTruthy(); expect(r.suggestedAction).toBeTruthy(); }
    expect(recs[0].priority).toBe("CRITICAL");
    expect(new Set(recs.map(r => r.title)).size).toBe(recs.length);
  });
});