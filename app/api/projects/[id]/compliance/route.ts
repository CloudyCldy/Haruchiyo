import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withProject } from "@/lib/route";
import { ok } from "@/lib/http";
import { analyzeProject } from "@/services/analysis.service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return withProject(request, id, async () => ok(analyzeProject(await prisma.project.findUniqueOrThrow({ where: { id }, include: { tasks: true, backlog: true, sprints: true, members: true, risks: true, issues: true, milestones: true } })) .compliance)); }
