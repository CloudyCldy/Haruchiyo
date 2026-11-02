import { SanzuCoreProvider } from "@/ai/provider.service";

describe("Sanzu Chatbot & Core Deterministic Provider (SB-12)", () => {
  const provider = new SanzuCoreProvider();

  const mockContext = {
    project: { name: "Sakura Coffee", methodology: "SCRUM" },
    findings: {
      metrics: {
        progress: 45,
        blockedTasks: 1,
        overdueTasks: 2,
        pendingTasks: 5,
        riskCount: 1,
        issueCount: 2,
        milestoneProgress: 60,
      },
      problems: [
        { description: "Existe 1 tarea bloqueada en el sprint actual." }
      ],
      recommendations: [
        { description: "Desbloquear la tarea de autenticación." }
      ]
    }
  };

  test("1. Responde considerando el contexto real de tareas sin requerir IA externa", async () => {
    const payload = JSON.stringify({
      question: "¿Cuál es el estado de las tareas pendientes y bloqueadas?",
      context: mockContext
    });

    const response = await provider.complete("system", payload);
    expect(response).toBeDefined();
    expect(response).toContain("Contexto de Sakura Coffee");
    expect(response).toContain("metodología SCRUM");
    expect(response).toContain("Pendientes: 5");
    expect(response).toContain("Bloqueadas: 1");
    expect(response).toContain("Vencidas: 2");
    expect(response).toContain("Desglose de tareas");
  });

  test("2. Responde considerando las métricas reales del proyecto", async () => {
    const payload = JSON.stringify({
      question: "¿Cuáles son las métricas de rendimiento y avance del proyecto?",
      context: mockContext
    });

    const response = await provider.complete("system", payload);
    expect(response).toContain("Progreso: 45%");
    expect(response).toContain("Progreso de hitos: 60%");
    expect(response).toContain("Métricas clave");
    expect(response).toContain("Progreso de tareas 45%");
  });

  test("3. Responde considerando la metodología del proyecto (Scrum, Kanban, etc.)", async () => {
    const payload = JSON.stringify({
      question: "¿Cómo funciona la metodología Scrum en este proyecto?",
      context: mockContext
    });

    const response = await provider.complete("system", payload);
    expect(response).toContain("SCRUM");
    expect(response).toContain("Metodología SCRUM: Enfocada en sprints iterativos");
  });

  test("4. El motor determinístico funciona de forma local y autónoma sin claves externas", async () => {
    const kanbanContext = {
      project: { name: "Kanban Ops", methodology: "KANBAN" },
      findings: {
        metrics: {
          progress: 80,
          blockedTasks: 0,
          overdueTasks: 0,
          pendingTasks: 2,
          riskCount: 0,
          issueCount: 0,
          milestoneProgress: 100,
        },
        problems: []
      }
    };

    const payload = JSON.stringify({
      question: "¿Qué metodología seguimos y qué acción sugiere?",
      context: kanbanContext
    });

    const response = await provider.complete("system", payload);
    expect(response).toContain("KANBAN");
    expect(response).toContain("limitación de trabajo en curso (WIP)");
  });
});
