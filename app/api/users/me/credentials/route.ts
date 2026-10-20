import { NextRequest } from "next/server";
import { withAuth } from "@/lib/route";
import { getOrCreateUserApiKey, rotateUserApiKey } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { assertRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const authHeader = request.headers.get("authorization") || "";
      const currentToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

      const apiKey = await getOrCreateUserApiKey(user.id, user.email);

      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const baseUrl = process.env.API_URL || `${protocol}://${host}`;
      const apiUrl = `${baseUrl}/api`;

      return ok(
        {
          url: apiUrl,
          baseUrl,
          token: currentToken,
          apiKey,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          headers: {
            authorization: `Bearer ${currentToken}`,
            apiKey: apiKey,
          },
          endpoints: [
            { method: "GET", path: "/api/projects", description: "Listado de operaciones y proyectos", auth: "Bearer Token" },
            { method: "POST", path: "/api/projects", description: "Crear una nueva operación", auth: "Bearer Token" },
            { method: "GET", path: "/api/projects/:id/analysis", description: "Análisis táctico y cumplimiento", auth: "Bearer Token" },
            { method: "POST", path: "/api/projects/:id/context", description: "Evaluación contextual estratégica", auth: "Token o X-Api-Key" },
            { method: "POST", path: "/api/chat", description: "Asistente de Inteligencia Estratégica Sanzu", auth: "Bearer Token" },
            { method: "GET", path: "/api/partner/projects/:externalRef", description: "Sincronización entre plataformas", auth: "X-Api-Key" },
          ],
          curlExamples: {
            withToken: `curl -X GET "${apiUrl}/projects" -H "Authorization: Bearer ${currentToken}"`,
            withApiKey: `curl -X POST "${apiUrl}/projects/PROYECTO_ID/context" -H "X-Api-Key: ${apiKey}" -H "Content-Type: application/json" -d '{"project":{"name":"Test","methodology":"SCRUM"}}'`,
          },
        },
        "Credenciales de API obtenidas exitosamente"
      );
    } catch (error) {
      return handleError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, { keyPrefix: "cred-rotate", max: 10, windowMs: 60_000 });
  } catch (error) {
    return handleError(error);
  }
  return withAuth(request, async (user) => {
    try {
      const apiKey = await rotateUserApiKey(user.id, user.email);
      return ok({ apiKey }, "API Key regenerada exitosamente");
    } catch (error) {
      return handleError(error);
    }
  });
}
