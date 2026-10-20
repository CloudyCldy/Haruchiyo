import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/http";
import { NotFoundError } from "@/lib/errors";
import { dictionaryService } from "@/knowledge/dictionary/service";
import { assertRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ term: string }> }) {
  try {
    assertRateLimit(request, { keyPrefix: "dictionary-term", max: 120, windowMs: 60_000 });
    const { term } = await params;
    const decodedTerm = decodeURIComponent(term);
    const entry = dictionaryService.getById(decodedTerm) || dictionaryService.getByExactTermOrSynonym(decodedTerm);
    if (!entry) {
      throw new NotFoundError(`El término "${decodedTerm}" no fue encontrado en el diccionario.`);
    }
    const related = dictionaryService.getRelated(entry.id);
    return ok({
      entry,
      related
    });
  } catch (error) {
    return handleError(error);
  }
}
