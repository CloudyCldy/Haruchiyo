import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checklist = KnowledgeService.getChecklist(id);
  if (!checklist) {
    return fail("CHECKLIST_NOT_FOUND", "Checklist definition not found", 404);
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("section");

  if (sectionId) {
    const section = checklist.sections.find(
      s => s.id.toLowerCase() === sectionId.toLowerCase()
    );
    if (!section) {
      return fail("SECTION_NOT_FOUND", `Section "${sectionId}" not found in checklist "${id}"`, 404);
    }
    return ok({
      checklistId: checklist.id,
      checklistName: checklist.name,
      stage: checklist.stage,
      version: checklist.version,
      section
    });
  }

  return ok(checklist);
}
