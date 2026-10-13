import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertObjectId, AuthenticationError, AuthorizationError } from "@/lib/errors";
import { createHash, randomBytes } from "node:crypto";

function jwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be configured in production");
  return new TextEncoder().encode(value || "development-only-change-me");
}

export async function signToken(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(jwtSecret());
}

export async function getAuthUser(request: NextRequest) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new AuthenticationError("Authentication required");
  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(value.slice(7), jwtSecret());
    userId = typeof payload.userId === "string" ? payload.userId : undefined;
  } catch {
    throw new AuthenticationError("Invalid or expired token");
  }
  if (!userId || !/^[a-f\d]{24}$/i.test(userId)) throw new AuthenticationError("Invalid token");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthenticationError("Authentication required");
  return user;
}

export async function getAuthClient(request: NextRequest) {
  const key = request.headers.get("X-Api-Key");
  if (!key) throw new AuthenticationError("API key required");
  const keyHash = createHash("sha256").update(key).digest("hex");
  const client = await prisma.apiClient.findFirst({ where: { keyHash, active: true } });
  if (!client) throw new AuthenticationError("Invalid API key");
  return client;
}

export function generateApiKeyString() {
  return `sz_live_${randomBytes(24).toString("base64url")}`;
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function getOrCreateUserApiKey(userId: string, email: string) {
  let client = await prisma.apiClient.findFirst({
    where: {
      OR: [
        { userId, active: true },
        { name: `User:${userId}`, active: true },
        { name: `User:${email}`, active: true },
      ],
    },
  });

  if (client && client.rawKey) {
    return client.rawKey;
  }

  const rawKey = generateApiKeyString();
  const keyHash = hashApiKey(rawKey);

  if (client) {
    client = await prisma.apiClient.update({
      where: { id: client.id },
      data: {
        keyHash,
        rawKey,
        userId,
        active: true,
      },
    });
  } else {
    client = await prisma.apiClient.create({
      data: {
        name: `User:${userId}`,
        keyHash,
        rawKey,
        userId,
        active: true,
      },
    });
  }

  return rawKey;
}

export async function rotateUserApiKey(userId: string, email: string) {
  const rawKey = generateApiKeyString();
  const keyHash = hashApiKey(rawKey);

  const existing = await prisma.apiClient.findFirst({
    where: {
      OR: [
        { userId, active: true },
        { name: `User:${userId}`, active: true },
        { name: `User:${email}`, active: true },
      ],
    },
  });

  if (existing) {
    await prisma.apiClient.update({
      where: { id: existing.id },
      data: {
        keyHash,
        rawKey,
        userId,
        active: true,
      },
    });
  } else {
    await prisma.apiClient.create({
      data: {
        name: `User:${userId}`,
        keyHash,
        rawKey,
        userId,
        active: true,
      },
    });
  }

  return rawKey;
}

export function publicUser(user: { id: string; name: string; email: string; role: string; createdAt: Date; updatedAt: Date }) {
  const { id, name, email, role, createdAt, updatedAt } = user;
  return { id, name, email, role, createdAt, updatedAt };
}

/** Un usuario tiene acceso si es manager del proyecto o miembro (ProjectMember). */
export async function requireProjectAccess(userId: string, projectId: string) {
  assertObjectId(projectId, "projectId");
  const project = await prisma.project.findFirst({ where: { id: projectId, OR: [{ managerId: userId }, { members: { some: { userId } } }] } });
  if (!project) throw new AuthorizationError("Project not found or access denied");
  return project;
}

/** Para editar/eliminar el proyecto: manager o miembro con rol PROJECT_MANAGER (SB-02). */
export async function requireProjectManager(userId: string, projectId: string) {
  const project = await requireProjectAccess(userId, projectId);
  if (project.managerId === userId) return project;
  const membership = await prisma.projectMember.findFirst({ where: { projectId, userId, role: "PROJECT_MANAGER" } });
  if (!membership) throw new AuthorizationError("Only the project manager can perform this action");
  return project;
}