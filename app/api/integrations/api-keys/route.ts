import { NextRequest } from "next/server";
import { withAuthOrApiKey } from "@/lib/route";
import { prisma } from "@/lib/prisma";
import { created, ok, handleError } from "@/lib/http";
import { createEnterpriseApiKey } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(2).max(100),
  organizationId: z.string().min(1).max(100).optional(),
  scopes: z.array(z.string()).default(["projects:read", "projects:create", "projects:update", "analysis:run", "chat:use"]),
  expiresInDays: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, { keyPrefix: "api-keys-create", max: 20, windowMs: 60_000 });
  } catch (error) {
    return handleError(error);
  }

  return withAuthOrApiKey(request, "integrations:manage", async (identity) => {
    try {
      const body = await request.json();
      const parsed = createKeySchema.parse(body);
      const organizationId = parsed.organizationId || identity.client?.organizationId || identity.user?.organizationId || "default-org";

      const credential = await createEnterpriseApiKey({
        name: parsed.name,
        organizationId,
        scopes: parsed.scopes,
        expiresInDays: parsed.expiresInDays,
      });

      return created(
        credential,
        "Clave de API empresarial generada exitosamente. Guarda el secreto ahora, no se volverá a mostrar."
      );
    } catch (error) {
      return handleError(error);
    }
  });
}

export async function GET(request: NextRequest) {
  return withAuthOrApiKey(request, "integrations:manage", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get("organizationId");

      const where: any = {};
      if (organizationId) {
        where.organizationId = organizationId;
      }

      const keys = await prisma.apiClient.findMany({
        where,
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          organizationId: true,
          scopes: true,
          active: true,
          expiresAt: true,
          lastUsedAt: true,
          usageCount: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return ok(keys, "Claves de integración listadas exitosamente");
    } catch (error) {
      return handleError(error);
    }
  });
}
