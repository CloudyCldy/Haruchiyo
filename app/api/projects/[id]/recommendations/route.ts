import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { created } from "@/lib/http";
import { generateRecommendations } from "@/services/recommendation.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => ({ ...(await import("@/lib/http")).ok(await prisma.recommendation.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } })) } as Response)); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => { const project = await prisma.project.findUniqueOrThrow({ where: { id }, include: { tasks: true, backlog: true, sprints: true, members: true, risks: true, issues: true, milestones: true } }); const recommendations = generateRecommendations(project); if (recommendations.length) await prisma.recommendation.createMany({ data: recommendations }); return created(recommendations); }); }
