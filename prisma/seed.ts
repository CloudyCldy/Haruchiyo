import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const methodologies = [["AGILE", "Agile", "Iterative delivery with continuous feedback."], ["SCRUM", "Scrum", "Empirical delivery through timeboxed Sprints."], ["KANBAN", "Kanban", "Continuous flow managed with visible WIP."], ["XP", "Extreme Programming", "Engineering discipline through rapid feedback."], ["LEAN", "Lean", "Maximize value by eliminating waste."], ["WATERFALL", "Waterfall", "Sequential phase-based delivery."], ["HYBRID", "Hybrid", "A configured combination of practices."]] as const;

async function main() {
  for (const [id, name, description] of methodologies) await prisma.methodology.upsert({ where: { id }, update: { name, description }, create: { id, name, description, principles: [], roles: [], events: [], artifacts: [], practices: [], metrics: [], rules: [], recommendations: [] } });
  const password = await bcrypt.hash("SanzuDemo123!", 12);
  const manager = await prisma.user.upsert({ where: { email: "manager@sanzu.dev" }, update: {}, create: { name: "Demo Manager", email: "manager@sanzu.dev", password, role: "PROJECT_MANAGER" } });
  for (const [name, methodologyId] of [["Commerce Platform", "SCRUM"], ["Support Flow", "KANBAN"]] as const) {
    const existing = await prisma.project.findFirst({ where: { name, managerId: manager.id } });
    if (existing) continue;
    const project = await prisma.project.create({ data: { name, description: "Seed project for demonstrating Sanzu analysis.", methodologyId, managerId: manager.id, status: "ACTIVE", definitionOfDone: "Reviewed, tested, and deployable", members: { create: { userId: manager.id, role: "PROJECT_MANAGER" } } } });
    await prisma.task.createMany({ data: [{ projectId: project.id, title: "Define delivery scope", status: "DONE", priority: "HIGH", storyPoints: 3 }, { projectId: project.id, title: "Implement core workflow", status: "IN_PROGRESS", priority: "HIGH", storyPoints: 5 }, { projectId: project.id, title: "Resolve integration blocker", status: "BLOCKED", priority: "CRITICAL", storyPoints: 3 }] });
  }
}

main().finally(() => prisma.$disconnect());
