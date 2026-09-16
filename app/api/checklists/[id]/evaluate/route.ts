import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

const evaluateSchema = z.object({
  itemStatuses: z.record(z.boolean())
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checklist = KnowledgeService.getChecklist(id);
  if (!checklist) {
    return fail("CHECKLIST_NOT_FOUND", "Checklist definition not found", 404);
  }

  const body = await req.json().catch(() => null);
  const parsed = evaluateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid itemStatuses payload", 422);
  }

  const evaluation = KnowledgeService.evaluateChecklist({
    checklistId: id,
    itemStatuses: parsed.data.itemStatuses
  });

  return ok(evaluation);
}
