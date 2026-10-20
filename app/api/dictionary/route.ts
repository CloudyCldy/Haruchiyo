import { NextRequest } from "next/server";
import { handleError, ok, created } from "@/lib/http";
import { dictionaryCreateSchema, dictionarySearchSchema, parse } from "@/validators/schemas";
import { dictionaryService } from "@/knowledge/dictionary/service";
import { withApiKey } from "@/lib/route";
import { assertRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    assertRateLimit(request, { keyPrefix: "dictionary", max: 120, windowMs: 60_000 });
    const query = parse(dictionarySearchSchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
    const result = dictionaryService.search(query);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  return withApiKey(request, async () => {
    assertRateLimit(request, { keyPrefix: "dictionary-post", max: 30, windowMs: 60_000 });
    const body = parse(dictionaryCreateSchema, await request.json());
    const newEntry = dictionaryService.addEntry({
      id: body.id || body.term.toLowerCase().replace(/\s+/g, "-"),
      term: body.term,
      synonyms: body.synonyms,
      definition: body.definition,
      beginnerExplanation: body.beginnerExplanation || body.definition,
      category: body.category as any,
      example: body.example || "Sin ejemplo especificado.",
      relatedConcepts: body.relatedConcepts,
      recommendations: body.recommendations,
      translations: {
        es: body.translations?.es || body.term,
        en: body.translations?.en || body.term
      },
      searchVariants: body.searchVariants
    });
    return created(newEntry, "Término agregado al diccionario exitosamente.");
  });
}
