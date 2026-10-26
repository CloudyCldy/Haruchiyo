import { NextRequest } from "next/server";
import { withAuthOrApiKey } from "@/lib/route";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/http";
import { generateApiKeyString, hashApiKey } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuthOrApiKey(request, "integrations:manage", async () => {
    try {
      const { id } = await params;
      const client = await prisma.apiClient.findUnique({ where: { id } });
      if (!client) throw new NotFoundError("Clave de integración no encontrada");

      await prisma.apiClient.update({
        where: { id },
        data: {
          active: false,
          revokedAt: new Date(),
        } as any,
      });

      return ok({ id, active: false, revoked: true }, "Clave de integración revocada exitosamente");
    } catch (error) {
      return handleError(error);
    }
  });
}

/** Rotación de clave existente o revocación según action */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuthOrApiKey(request, "integrations:manage", async () => {
    try {
      const { id } = await params;
      const existing = await prisma.apiClient.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Clave de integración no encontrada");

      let body: any = {};
      try {
        body = await request.json();
      } catch {}

      if (body.action === "revoke") {
        await prisma.apiClient.update({
          where: { id },
          data: {
            active: false,
            revokedAt: new Date(),
          } as any,
        });

        return ok({ id, active: false, revoked: true }, "Clave de integración revocada exitosamente");
      }

      const rawKey = generateApiKeyString();
      const keyHash = hashApiKey(rawKey);
      const keyPrefix = rawKey.slice(0, 12);

      const updated = await prisma.apiClient.update({
        where: { id },
        data: {
          keyHash,
          keyPrefix,
          rawKey: null, // Asegurar que no se guarde el secreto en plano
          active: true,
          revokedAt: null,
          usageCount: 0,
          updatedAt: new Date(),
        } as any,
      });

      return ok(
        {
          id: updated.id,
          name: updated.name,
          apiKey: rawKey,
          keyPrefix,
          organizationId: (updated as any).organizationId,
          scopes: (updated as any).scopes,
        },
        "Clave de integración rotada exitosamente. Guarda el nuevo secreto ahora."
      );
    } catch (error) {
      return handleError(error);
    }
  });
}
