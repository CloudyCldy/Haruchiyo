import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertObjectId } from "@/lib/errors";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "development-only-change-me");
export async function signToken(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function getAuthUser(request: NextRequest) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new Error("Authentication required");
  try {
    const { payload } = await jwtVerify(value.slice(7), secret);
    const userId = typeof payload.userId === "string" ? payload.userId : undefined;
    if (!userId) throw new Error("Invalid token");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    return user;
  } catch { throw new Error("Authentication required"); }
}
export function publicUser(user: { id: string; name: string; email: string; role: string; createdAt: Date; updatedAt: Date }) {
  const { id, name, email, role, createdAt, updatedAt } = user;
  return { id, name, email, role, createdAt, updatedAt };
}
export async function requireProjectAccess(userId: string, projectId: string) {
  assertObjectId(projectId, "projectId");
  const project = await prisma.project.findFirst({ where: { id: projectId, OR: [{ managerId: userId }, { members: { some: { userId } } }] } });
  if (!project) { const error = new Error("Project not found or access denied"); error.name = "AuthorizationError"; throw error; }
  return project;
}
