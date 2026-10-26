import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuthOrApiKey(req, "projects:read", async () => {
    const { id } = await params;
    const template = KnowledgeService.getTemplate(id);
    if (!template) {
      return fail("TEMPLATE_NOT_FOUND", "Template definition not found", 404);
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("section");

    if (sectionId) {
      const section = template.sections.find(
        s => s.id.toLowerCase() === sectionId.toLowerCase()
      );
      if (!section) {
        return fail("SECTION_NOT_FOUND", `Section "${sectionId}" not found in template "${id}"`, 404);
      }
      return ok({
        templateId: template.id,
        templateName: template.name,
        category: template.category,
        version: template.version,
        section
      }, "Operation completed successfully", 200, {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      });
    }

    return ok(template, "Operation completed successfully", 200, {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    });
  });
}
