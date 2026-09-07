import { ok } from "@/lib/http";

export async function GET() {
  return ok({
    name: "Sanzu",
    description: "Project Management and AI Assistant REST API",
    status: "online",
    health: "/api/health",
    documentation: "/API_DOCUMENTATION.md",
  });
}
