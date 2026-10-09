import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export const partnerProjectInclude = {
  methodology: true,
  tasks: true,
  backlog: true,
  sprints: true,
  members: true,
  risks: true,
  issues: true,
  milestones: true,
} as const;

export async function getPartnerProject(externalRef: string) {
  const project = await prisma.project.findUnique({ where: { externalRef }, include: partnerProjectInclude });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function getPartnerServiceUser() {
  const existing = await prisma.user.findUnique({ where: { email: "partner-service@sanzu.internal" } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: "Partner Service",
      email: "partner-service@sanzu.internal",
      password: await bcrypt.hash("sanzu-partner-service", 12),
      role: "PROJECT_MANAGER",
    },
  });
}


/** Id de Sanzu del proyecto de Haitani (por externalRef), sin cargar relaciones. */
export async function getPartnerProjectId(externalRef: string) {
  const project = await prisma.project.findUnique({ where: { externalRef }, select: { id: true } });
  if (!project) throw new NotFoundError("Project not found. Sync it first with POST /api/v1/partner/projects");
  return project.id;
}