import { CorpusService, corpusService } from "@/knowledge/corpus.service";
import { KnowledgeService } from "@/knowledge/service";
import { buildAgentPrompt } from "@/ai/prompt.service";
import { SanzuCoreProvider } from "@/ai/provider.service";
import { answerMessage } from "@/ai/chatbot.service";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUniqueOrThrow: jest.fn()
    },
    chatConversation: {
      findFirstOrThrow: jest.fn(),
      create: jest.fn()
    },
    chatMessage: {
      create: jest.fn()
    }
  }
}));

describe("Corpus Knowledge Base Engine", () => {
  it("loads documents, chunks, glossary and contradictions", () => {
    const docs = corpusService.listDocuments();
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.some(d => d.document_id === "doc_0001")).toBe(true);
    // doc_0007 (Lean 4 prover) must be excluded from active retrieval index
    expect(docs.some(d => d.document_id === "doc_0007")).toBe(false);

    const contradictions = corpusService.getContradictions();
    expect(contradictions.length).toBeGreaterThan(0);
    expect(contradictions.some(c => c.contradiction_id === "contra_001")).toBe(true);
  });

  it("retrieves methodology-grounded knowledge for SCRUM projects", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "SCRUM",
      query: "Cómo planificamos el sprint y aseguramos la calidad con DoD?"
    });

    expect(kb.methodology).toBe("SCRUM");
    expect(kb.topChunks.length).toBeGreaterThan(0);
    expect(kb.topChunks[0].citation).toMatch(/\[.*, p\. \d+\]/);
    expect(kb.applicableChecklists).toEqual(
      expect.arrayContaining(["Definition of Ready (DoR)", "Definition of Done (DoD)"])
    );
    expect(kb.applicableTemplates).toEqual(
      expect.arrayContaining(["User Story Template", "Sprint Planning Canvas"])
    );
  });

  it("retrieves methodology-grounded knowledge for KANBAN projects", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "KANBAN",
      query: "Cómo limitar el WIP y gestionar los cuellos de botella?"
    });

    expect(kb.methodology).toBe("KANBAN");
    expect(kb.topChunks.length).toBeGreaterThan(0);
    const hasKanbanContent = kb.topChunks.some(
      c => c.chunk.category === "kanban" || c.chunk.content.toLowerCase().includes("kanban") || c.chunk.content.toLowerCase().includes("wip")
    );
    expect(hasKanbanContent).toBe(true);
    expect(kb.governanceRules).toEqual(expect.arrayContaining(["Respect WIP limits"]));
  });

  it("retrieves methodology-grounded knowledge for WATERFALL projects", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "WATERFALL",
      query: "Requisitos y control de fases"
    });

    expect(kb.methodology).toBe("WATERFALL");
    expect(kb.applicableTemplates).toEqual(expect.arrayContaining(["Project Charter Template"]));
    expect(kb.governanceRules).toEqual(expect.arrayContaining(["Respect phase dependencies"]));
  });

  it("searches glossary terms accurately", () => {
    const term = corpusService.getGlossaryTerm("Sprint");
    expect(term).toBeDefined();
    expect(term?.term.toLowerCase()).toContain("sprint");

    const flowTerm = corpusService.getGlossaryTerm("Definition of Workflow");
    expect(flowTerm).toBeDefined();

    const matches = corpusService.searchGlossary(["sprint", "wip"]);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("KnowledgeService delegates corpus search and retrieval methods", () => {
    const results = KnowledgeService.searchCorpus({
      methodology: "SCRUM",
      query: "Sprint Goal",
      limit: 2
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].citation).toBeTruthy();
  });
});

describe("AI Agent Prompt Construction & Persona Adaptation", () => {
  it("builds a Scrum Master persona prompt for SCRUM projects with corpus citations", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "SCRUM",
      query: "planificación"
    });

    const prompt = buildAgentPrompt({
      methodology: "SCRUM",
      projectName: "E-Commerce Plataforma",
      knowledgeBase: kb
    });

    expect(prompt).toContain("Sanzu Agile/Scrum Project Assistant");
    expect(prompt).toContain("Selected Methodology: SCRUM");
    expect(prompt).toContain("Definition of Done");
    expect(prompt).toContain("Applicable Checklists: Definition of Ready (DoR)");
    expect(prompt).toContain("Grounding Corpus Excerpts");
  });

  it("builds a Kanban Flow Assistant prompt for KANBAN projects", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "KANBAN"
    });

    const prompt = buildAgentPrompt({
      methodology: "KANBAN",
      projectName: "Soporte TI",
      knowledgeBase: kb
    });

    expect(prompt).toContain("Sanzu Kanban Flow Assistant");
    expect(prompt).toContain("Work In Progress (WIP)");
  });

  it("builds a Predictive Delivery prompt for WATERFALL projects", () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "WATERFALL"
    });

    const prompt = buildAgentPrompt({
      methodology: "WATERFALL",
      projectName: "Infraestructura Cloud",
      knowledgeBase: kb
    });

    expect(prompt).toContain("Sanzu Predictive Delivery Assistant");
    expect(prompt).toContain("phase gating");
  });
});

describe("SanzuCoreProvider Grounded Execution", () => {
  const provider = new SanzuCoreProvider();

  it("generates response with project diagnostics, methodology rules and citations for Scrum", async () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "SCRUM",
      query: "bloqueos"
    });

    const payload = {
      question: "¿Cómo resolvemos las tareas bloqueadas en este Sprint?",
      context: {
        project: { name: "Portal Cliente", methodology: "SCRUM" },
        findings: {
          metrics: {
            progress: 40,
            blockedTasks: 2,
            overdueTasks: 1,
            pendingTasks: 5,
            riskCount: 1,
            issueCount: 0,
            milestoneProgress: 50
          },
          problems: [{ description: "Existen tareas bloqueadas." }]
        },
        knowledgeBase: kb
      }
    };

    const response = await provider.complete("system", JSON.stringify(payload));
    expect(response).toContain("Portal Cliente");
    expect(response).toContain("metodología SCRUM");
    expect(response).toContain("Bloqueadas: 2");
    expect(response).toContain("Daily Scrum");
    expect(response).toContain("Fundamentado en la base de conocimiento");
    expect(response).toMatch(/\[.*, p\. \d+\]/);
  });

  it("provides Kanban-specific flow advice for Kanban projects", async () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "KANBAN",
      query: "flujo"
    });

    const payload = {
      question: "¿Cuál es la siguiente acción?",
      context: {
        project: { name: "Mesa de Ayuda", methodology: "KANBAN" },
        findings: {
          metrics: {
            progress: 80,
            blockedTasks: 0,
            overdueTasks: 0,
            pendingTasks: 3,
            riskCount: 0,
            issueCount: 0,
            milestoneProgress: 100
          },
          problems: []
        },
        knowledgeBase: kb
      }
    };

    const response = await provider.complete("system", JSON.stringify(payload));
    expect(response).toContain("metodología KANBAN");
    expect(response).toContain("flujo continuo");
  });

  it("suggests templates and checklists when asked", async () => {
    const kb = corpusService.getKnowledgeForProject({
      methodology: "SCRUM",
      query: "plantilla y checklist"
    });

    const payload = {
      question: "¿Qué plantilla y checklist recomiendas?",
      context: {
        project: { name: "Core Banking", methodology: "SCRUM" },
        findings: {
          metrics: {
            progress: 10,
            blockedTasks: 0,
            overdueTasks: 0,
            pendingTasks: 10,
            riskCount: 0,
            issueCount: 0,
            milestoneProgress: 0
          },
          problems: []
        },
        knowledgeBase: kb
      }
    };

    const response = await provider.complete("system", JSON.stringify(payload));
    expect(response).toContain("Plantillas recomendadas");
    expect(response).toContain("Checklists aplicables");
  });
});

describe("Chatbot Service Integration with Knowledge Base", () => {
  it("answers message and enriches result with citations and recommendations", async () => {
    (prisma.project.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "proj-1",
      name: "App Móvil",
      description: "Desarrollo de app móvil",
      methodologyId: "SCRUM",
      methodology: { id: "SCRUM", name: "SCRUM" },
      tasks: [
        { id: "t1", status: "TODO", assignedTo: "u1", estimatedHours: 8 },
        { id: "t2", status: "BLOCKED", assignedTo: "u2", estimatedHours: 12 }
      ],
      backlog: [],
      sprints: [{ id: "s1", name: "Sprint 1", goal: "Auth MVP", status: "ACTIVE" }],
      members: [{ userId: "u1" }, { userId: "u2" }],
      risks: [{ id: "r1", title: "API delay", probability: "HIGH", impact: "HIGH", severity: 9, status: "OPEN" }],
      issues: [],
      milestones: []
    });

    (prisma.chatConversation.create as jest.Mock).mockResolvedValue({
      id: "conv-1",
      userId: "user-1",
      projectId: "proj-1"
    });

    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: "msg-1"
    });

    const result = await answerMessage("user-1", "proj-1", "¿Cómo resolvemos el bloqueo en el sprint?");

    expect(result.conversationId).toBe("conv-1");
    expect(result.methodology).toBe("SCRUM");
    expect(result.knowledgeBase).toBeDefined();
    expect(result.knowledgeBase.citations.length).toBeGreaterThan(0);
    expect(result.knowledgeBase.citations[0].citation).toMatch(/\[.*, p\. \d+\]/);
    expect(result.knowledgeBase.checklists).toEqual(expect.arrayContaining(["Definition of Ready (DoR)"]));
    expect(result.response).toContain("Contexto de App Móvil");
    expect(result.response).toContain("metodología SCRUM");
  });
});
