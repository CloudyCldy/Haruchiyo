jest.mock("jose", () => ({ jwtVerify: jest.fn(), SignJWT: jest.fn() }));

import { dictionaryService } from "@/knowledge/dictionary/service";
import { IntentClassifier } from "@/ai/intent.classifier";
import { ExpertEngineService } from "@/ai/expert-engine.service";
import { NextRequest } from "next/server";
import { GET as getDictionary } from "../app/api/dictionary/route";
import { GET as getTerm } from "../app/api/dictionary/[term]/route";
import { prisma } from "@/lib/prisma";


jest.mock("@/lib/prisma", () => ({
  prisma: {
    apiClient: { findFirst: jest.fn() },
    project: { findUnique: jest.fn(), create: jest.fn(), findUniqueOrThrow: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn() },
    chatConversation: { findFirstOrThrow: jest.fn(), create: jest.fn() },
    chatMessage: { create: jest.fn() }
  }
}));

describe("Specialized Dictionary (Section 4)", () => {
  it("covers all 15 required categories with verified entries", () => {
    const categories = dictionaryService.getAllCategories();
    expect(categories.length).toBe(15);
    expect(categories).toContain("gestion_proyectos");
    expect(categories).toContain("scrum_agile");
    expect(categories).toContain("kanban_lean");
    expect(categories).toContain("xp_practicas");
    expect(categories).toContain("ingenieria_software");
    expect(categories).toContain("programacion_arquitectura");
    expect(categories).toContain("apis_integraciones");
    expect(categories).toContain("bases_datos");
    expect(categories).toContain("git_devops");
    expect(categories).toContain("qa_testing");
    expect(categories).toContain("seguridad");
    expect(categories).toContain("cloud_despliegues");
    expect(categories).toContain("metricas_analisis");
    expect(categories).toContain("riesgos_incidencias");
    expect(categories).toContain("colaboracion_equipos");
  });

  it("finds terms by exact term name and ID", () => {
    const entry1 = dictionaryService.getByExactTermOrSynonym("sprint");
    expect(entry1).toBeDefined();
    expect(entry1?.id).toBe("sprint");

    const entry2 = dictionaryService.getById("wip-limit");
    expect(entry2).toBeDefined();
    expect(entry2?.term).toContain("WIP Limit");
  });

  it("finds terms by synonyms and abbreviations", () => {
    const dod = dictionaryService.getByExactTermOrSynonym("DoD");
    expect(dod).toBeDefined();
    expect(dod?.id).toBe("definition-of-done");

    const dor = dictionaryService.getByExactTermOrSynonym("DoR");
    expect(dor).toBeDefined();
    expect(dor?.id).toBe("definition-of-ready");

    const pr = dictionaryService.getByExactTermOrSynonym("PR");
    expect(pr).toBeDefined();
    expect(pr?.id).toBe("pull-request");

    const cpm = dictionaryService.getByExactTermOrSynonym("CPM");
    expect(cpm).toBeDefined();
    expect(cpm?.id).toBe("ruta-critica");
  });

  it("performs partial and fuzzy search with ranking", () => {
    const res = dictionaryService.search({ q: "quemado" });
    expect(res.total).toBeGreaterThan(0);
    expect(res.items.some(i => i.id === "burndown-chart")).toBe(true);

    const res2 = dictionaryService.search({ q: "playwright" });
    expect(res2.total).toBeGreaterThan(0);
    expect(res2.items[0].id).toBe("pruebas-e2e");
  });

  it("filters search results by category", () => {
    const agileOnly = dictionaryService.search({ category: "scrum_agile" });
    expect(agileOnly.items.length).toBeGreaterThan(0);
    expect(agileOnly.items.every(i => i.category === "scrum_agile")).toBe(true);

    const qaOnly = dictionaryService.search({ category: "qa_testing" });
    expect(qaOnly.items.length).toBeGreaterThan(0);
    expect(qaOnly.items.every(i => i.category === "qa_testing")).toBe(true);
  });

  it("supports beginner vs technical explanations mode", () => {
    const beginnerRes = dictionaryService.search({ q: "wip-limit", mode: "beginner" });
    expect(beginnerRes.items[0].definition).toBe(beginnerRes.items[0].beginnerExplanation);

    const techRes = dictionaryService.search({ q: "wip-limit", mode: "technical" });
    expect(techRes.items[0].beginnerExplanation).toBe(techRes.items[0].definition);
  });

  it("supports pagination", () => {
    const page1 = dictionaryService.search({ limit: 5, page: 1 });
    expect(page1.items.length).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBeGreaterThan(1);

    const page2 = dictionaryService.search({ limit: 5, page: 2 });
    expect(page2.items.length).toBe(5);
    expect(page2.page).toBe(2);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
  });

  it("retrieves related concepts for a term", () => {
    const related = dictionaryService.getRelated("sprint");
    expect(related.length).toBeGreaterThan(0);
    expect(related.some(r => r.id === "sprint-backlog" || r.id === "product-backlog")).toBe(true);
  });

  it("allows adding a new term with automatic indexing", () => {
    const newTerm = dictionaryService.addEntry({
      id: "feature-flag",
      term: "Feature Flag (Interruptor de Funcionalidad)",
      synonyms: ["Feature Toggle", "Interruptor"],
      definition: "Técnica de desarrollo que permite activar o desactivar funcionalidades en tiempo de ejecución sin redesplegar código.",
      beginnerExplanation: "Un interruptor de luz en el software para prender o apagar funciones a voluntad.",
      category: "ingenieria_software",
      example: "Activar el nuevo módulo de pagos solo para el 10% de los usuarios.",
      relatedConcepts: ["ci-cd"],
      recommendations: ["Retirar las flags obsoletas tras la adopción."],
      translations: { es: "Interruptor de Funcionalidad", en: "Feature Flag" },
      searchVariants: ["feature toggle", "feature flags"]
    });

    expect(newTerm.id).toBe("feature-flag");
    const found = dictionaryService.getByExactTermOrSynonym("Feature Toggle");
    expect(found).toBeDefined();
    expect(found?.id).toBe("feature-flag");
  });
});

describe("Intent Classifier & Expert Engine (Section 3 & 5)", () => {
  it("classifies prioritization intent correctly", () => {
    const res = IntentClassifier.classify("¿Qué debería hacer hoy?");
    expect(res.intent).toBe("prioritization");
    expect(res.requiresProjectContext).toBe(true);
  });

  it("classifies risk assessment intent correctly", () => {
    const res = IntentClassifier.classify("¿Qué tareas ponen en riesgo el sprint?");
    expect(res.intent).toBe("risk_assessment");
    expect(res.requiresProjectContext).toBe(true);
  });

  it("classifies project analysis intent correctly", () => {
    const res = IntentClassifier.classify("Dame un resumen para la reunión");
    expect(res.intent).toBe("project_analysis");
    expect(res.requiresProjectContext).toBe(true);
  });

  it("classifies concept definition intent correctly", () => {
    const res = IntentClassifier.classify("¿Qué es la Definición de Terminado (DoD)?");
    expect(res.intent).toBe("definition");
    expect(res.matchedTerms.length).toBeGreaterThan(0);
  });

  it("classifies comparison intent correctly", () => {
    const res = IntentClassifier.classify("Diferencia entre Scrum y Kanban");
    expect(res.intent).toBe("comparison");
  });

  it("classifies metrics query intent correctly", () => {
    const res = IntentClassifier.classify("¿Cómo se calcula el lead time y la velocidad?");
    expect(res.intent).toBe("metrics_query");
  });

  it("classifies task/criteria generation intent correctly", () => {
    const res = IntentClassifier.classify("Genera criterios de aceptación para login");
    expect(res.intent).toBe("task_generation");
  });

  it("generates structured answer with prioritization based on real tasks context", () => {
    const context = {
      project: { name: "Sakura Coffee", methodology: "SCRUM" },
      tasks: [
        { id: 1, title: "Pasarela de pago", status: "bloqueada", priority: "alta" },
        { id: 2, title: "Migración BD", status: "en_proceso", priority: "critica", due_date: "2026-09-01" },
        { id: 3, title: "Actualizar logo", status: "pendiente", priority: "baja" }
      ],
      team: [{ name: "Carlos" }, { name: "Alberto" }]
    };

    const res = ExpertEngineService.generateAnswer("¿Qué debería hacer hoy?", context);
    expect(res.intent).toBe("prioritization");
    expect(res.metadata.hasProjectContext).toBe(true);
    // Debe poner la tarea bloqueada en el paso 1
    expect(res.answer).toContain("Pasarela de pago");
    expect(res.answer).toContain("Migración BD");
    expect(res.suggestions.length).toBeGreaterThan(0);
  });

  it("communicates honestly when project context is missing for contextual queries", () => {
    const res = ExpertEngineService.generateAnswer("¿Qué debería hacer hoy?", undefined);
    expect(res.intent).toBe("prioritization");
    expect(res.metadata.hasProjectContext).toBe(false);
    expect(res.answer).toContain("No se recibieron tareas específicas");
  });
});

describe("Dictionary API Endpoints (Section 2 & 4)", () => {
  it("GET /api/v1/dictionary returns paginated results", async () => {
    const req = new NextRequest("http://localhost/api/v1/dictionary?q=sprint&limit=5");
    const res = await getDictionary(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/dictionary/:term returns exact entry and related concepts", async () => {
    const req = new NextRequest("http://localhost/api/v1/dictionary/sprint");
    const res = await getTerm(req, { params: Promise.resolve({ term: "sprint" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.entry.id).toBe("sprint");
    expect(body.data.related.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/dictionary/:term returns 404 for unknown terms", async () => {
    const req = new NextRequest("http://localhost/api/v1/dictionary/termino-inexistente-xyz");
    const res = await getTerm(req, { params: Promise.resolve({ term: "termino-inexistente-xyz" }) });
    expect(res.status).toBe(404);
  });
});
