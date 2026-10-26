import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { documentationSearchSchema, parse } from "@/validators/schemas";
import { searchDocumentation } from "@/services/document-recommendation.service";

/** ST054: búsqueda inteligente de documentación. GET /api/v1/documentation/search?q=riesgos&methodology=SCRUM */
export async function GET(request: NextRequest) {
  return withAuthOrApiKey(request, "projects:read", async () => {
    const query = parse(documentationSearchSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    return ok(searchDocumentation(query));
  });
}
