import { KnowledgeService } from "@/knowledge/service";

describe("KnowledgeService (Modular & Section-Aware)", () => {
  test("lists documentation items with sections and keyPoints", () => {
    const allDocs = KnowledgeService.listDocumentation();
    expect(allDocs.length).toBeGreaterThan(0);

    const doc = KnowledgeService.getDocumentation("project-lifecycle-standards");
    expect(doc).toBeDefined();
    expect(doc?.sections.length).toBeGreaterThan(0);
    expect(doc?.sections[0].keyPoints?.length).toBeGreaterThan(0);
  });

  test("templates contain structured sections and validation rules", () => {
    const userStory = KnowledgeService.getTemplate("user-story");
    expect(userStory).toBeDefined();
    expect(userStory?.sections.length).toBe(3);
    expect(userStory?.sections[0].fields.some(f => f.name === "role")).toBe(true);
    expect(userStory?.exampleFilledContent).toContain("Exportación de Reportes");
  });

  test("processes include accountability roles and best practices", () => {
    const process = KnowledgeService.getProcess("sprint-lifecycle");
    expect(process).toBeDefined();
    expect(process?.phases[0].accountableRole).toBe("PRODUCT_OWNER");
    expect(process?.phases[0].bestPractices?.length).toBeGreaterThan(0);
  });

  test("checklists calculate section breakdown during evaluation", () => {
    const evaluation = KnowledgeService.evaluateChecklist({
      checklistId: "definition-of-done",
      itemStatuses: {
        "dod-1": true,
        "dod-2": true,
        "dod-3": true,
        "dod-4": true,
        "dod-5": true,
        "dod-6": false
      }
    });

    expect(evaluation.isPassed).toBe(true);
    expect(evaluation.sectionBreakdown.length).toBe(2);
    expect(evaluation.sectionBreakdown[0].sectionId).toBe("code-quality-and-tests");
    expect(evaluation.sectionBreakdown[0].isPassed).toBe(true);
    expect(evaluation.sectionBreakdown[0].completionRate).toBe(100);
  });

  test("fails section when mandatory item in that section is unmet", () => {
    const evaluation = KnowledgeService.evaluateChecklist({
      checklistId: "definition-of-done",
      itemStatuses: {
        "dod-1": false
      }
    });

    expect(evaluation.isPassed).toBe(false);
    expect(evaluation.sectionBreakdown[0].isPassed).toBe(false);
    expect(evaluation.recommendations[0]).toContain("Completar la lógica faltante");
  });
});
