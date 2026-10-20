import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/http";
import { documentationSearchSchema, parse } from "@/validators/schemas";
import { searchDocumentation } from "@/services/document-recommendation.service";

/** ST054: búsqueda inteligente de documentación. GET /api/v1/documentation/search?q=riesgos&methodology=SCRUM */
export async function GET(request: NextRequest) {
  try {
    const query = parse(documentationSearchSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    return ok(searchDocumentation(query));
  } catch (error) {
    return handleError(error);
  }
}