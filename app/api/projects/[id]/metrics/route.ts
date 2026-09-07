import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { calculateMetrics } from "@/services/metrics.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => ok(calculateMetrics(await prisma.project.findUniqueOrThrow({ where: { id }, include: { tasks: true, risks: true, issues: true, milestones: true, sprints: true } })))); }
