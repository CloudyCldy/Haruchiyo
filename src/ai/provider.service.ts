import { KnowledgeService } from "@/knowledge/service";
import { ProjectKnowledgeBase } from "@/knowledge/corpus.types";
import { ExpertEngineService } from "./expert-engine.service";

export interface AIProvider {
  complete(system: string, user: string): Promise<string>;
}

export type CorePayload = {
  question: string;
  context: {
    project: {
      id?: string;
      name: string;
      methodology: string;
      description?: string | null;
      requirements?: unknown;
    };
    findings: {
      metrics: {
        progress: number;
        blockedTasks: number;
        overdueTasks: number;
        pendingTasks: number;
        riskCount: number;
        issueCount: number;
        milestoneProgress: number;
      };
      problems: { type?: string; severity?: string; description: string }[];
      recommendations?: string[];
    };
    knowledgeBase?: ProjectKnowledgeBase;
    tasks?: any[];
    risks?: any[];
    issues?: any[];
    milestones?: any[];
    team?: any[];
  };
};

export class SanzuCoreProvider implements AIProvider {
  async complete(_system: string, user: string): Promise<string> {
    let payload: CorePayload;
    try {
      payload = JSON.parse(user) as CorePayload;
    } catch {
      // Si no es JSON estruturado, delegar directamente a ExpertEngineService
      const res = ExpertEngineService.generateAnswer(user);
      return res.answer;
    }

    const { question, context } = payload;
    const { project, findings, knowledgeBase } = context;
    const metrics = findings?.metrics || {
      progress: 0,
      blockedTasks: 0,
      overdueTasks: 0,
      pendingTasks: 0,
      riskCount: 0,
      issueCount: 0,
      milestoneProgress: 0
    };
    const methodology = (project?.methodology || "AGILE").toUpperCase();
    const questionText = question.toLowerCase();

    // 1. Identify primary problem areas from metrics
    const problemsText = findings?.problems?.length
      ? findings.problems.map(p => p.description).join(" ")
      : "No se detectaron problemas críticos en el análisis actual.";

    // 2. Determine domain-specific action grounded in project methodology
    let suggestedAction = "Prioriza el siguiente trabajo de mayor impacto y revisa el análisis del proyecto.";
    if (questionText.includes("riesgo") || questionText.includes("risk")) {
      suggestedAction = metrics.riskCount
        ? `Asigna mitigaciones y responsables para cada uno de los ${metrics.riskCount} riesgo(s) abierto(s) conforme al marco de gobernanza.`
        : "El registro de riesgos se encuentra controlado; mantén su revisión periódica en cada ciclo.";
    } else if (questionText.includes("retras") || questionText.includes("detrás") || questionText.includes("schedule") || questionText.includes("cronograma")) {
      suggestedAction = metrics.overdueTasks
        ? `Existen ${metrics.overdueTasks} tarea(s) vencidas; replanifica fechas y revisa dependencias críticas inmediatamente.`
        : "El cronograma de entregables se encuentra alineado con las fechas planificadas.";
    } else if (questionText.includes("bloque") || questionText.includes("impedimento") || questionText.includes("block")) {
      if (metrics.blockedTasks) {
        if (methodology === "SCRUM") {
          suggestedAction = `Hay ${metrics.blockedTasks} tarea(s) en estado BLOCKED; inspecciónalas en el Daily Scrum (máximo 15 minutos) y elimina el bloqueo prioritario para proteger el Sprint Goal.`;
        } else if (methodology === "KANBAN") {
          suggestedAction = `Hay ${metrics.blockedTasks} tarea(s) en estado BLOCKED; hazlas visibles en el tablero, limita el WIP y convoca al equipo para desatascar el flujo.`;
        } else {
          suggestedAction = `Hay ${metrics.blockedTasks} tarea(s) en estado BLOCKED; convoca a los asignatarios y elimina el bloqueo más antiguo primero.`;
        }
      } else {
        suggestedAction = "No se registran tareas bloqueadas actualmente en el tablero.";
      }
    } else if (methodology === "KANBAN") {
      suggestedAction = metrics.blockedTasks
        ? "Detén la entrada de nuevas tarjetas, enfoca al equipo en desatascar el flujo y respeta los límites de WIP (Work in Progress)."
        : "Mantén el flujo continuo: extrae la siguiente tarjeta solo cuando se libere capacidad en la columna de destino.";
    } else if (methodology === "SCRUM") {
      suggestedAction = metrics.blockedTasks
        ? "Eleva los bloqueos en el Daily Scrum (máximo 15 minutos) y renegocia el alcance del Sprint si el Sprint Goal está en peligro."
        : "Asegura que el equipo mantenga el foco en el Sprint Goal y valide cada incremento contra el Definition of Done (DoD).";
    } else if (methodology === "WATERFALL") {
      suggestedAction = "Verifica los criterios de salida de la fase actual y asegura la aprobación formal de hitos antes de avanzar.";
    } else if (methodology === "XP") {
      suggestedAction = "Refuerza la integración continua y el desarrollo guiado por pruebas (TDD) para reducir la tasa de defectos.";
    }

    // 3. Grounding sections
    const sections: string[] = [];

    // Diagnostic summary
    sections.push(
      `Contexto de ${project?.name || "Proyecto"}: metodología ${methodology}. Progreso: ${metrics.progress}%. Pendientes: ${metrics.pendingTasks}. Bloqueadas: ${metrics.blockedTasks}. Vencidas: ${metrics.overdueTasks}. Riesgos: ${metrics.riskCount}. Issues: ${metrics.issueCount}. Progreso de hitos: ${metrics.milestoneProgress}%. ${problemsText} Acción sugerida: ${suggestedAction}`
    );

    // Knowledge base tips according to project type and question
    if (knowledgeBase) {
      const tips: string[] = [];

      if (
        questionText.includes("plantilla") ||
        questionText.includes("template") ||
        questionText.includes("historia") ||
        questionText.includes("user story") ||
        questionText.includes("charter") ||
        questionText.includes("adr")
      ) {
        const templates = knowledgeBase.applicableTemplates.length
          ? knowledgeBase.applicableTemplates.join(", ")
          : KnowledgeService.listTemplates({ methodology }).map(t => t.name).join(", ");
        tips.push(`Plantillas recomendadas para ${methodology}: ${templates || "user-story, bug-report"}. Puedes consultar /api/templates.`);
      }

      if (
        questionText.includes("checklist") ||
        questionText.includes("ready") ||
        questionText.includes("done") ||
        questionText.includes("calidad") ||
        questionText.includes("dod") ||
        questionText.includes("dor")
      ) {
        const checklists = knowledgeBase.applicableChecklists.length
          ? knowledgeBase.applicableChecklists.join(", ")
          : KnowledgeService.listChecklists({ methodology }).map(c => c.name).join(", ");
        tips.push(`Checklists aplicables: ${checklists || "Definition of Ready, Definition of Done"}. Evalúa el estado vía /api/checklists/{id}/evaluate.`);
      }

      if (
        questionText.includes("proceso") ||
        questionText.includes("flujo") ||
        questionText.includes("lifecycle") ||
        questionText.includes("sprint") ||
        questionText.includes("fase")
      ) {
        const processes = knowledgeBase.applicableProcesses.length
          ? knowledgeBase.applicableProcesses.join(", ")
          : KnowledgeService.listProcesses({ methodology }).map(p => p.name).join(", ");
        tips.push(`Procesos estándar disponibles: ${processes || "sprint-lifecycle, release-management"}. Consulta /api/processes.`);
      }

      if (knowledgeBase.topChunks && knowledgeBase.topChunks.length > 0) {
        const top = knowledgeBase.topChunks[0];
        tips.push(`Fundamentado en la base de conocimiento: ${top.citation} (${top.chunk.section_title}).`);
      }

      if (knowledgeBase.contradictions && knowledgeBase.contradictions.length > 0) {
        const contra = knowledgeBase.contradictions[0];
        if (questionText.includes("duracion") || questionText.includes("tiempo") || questionText.includes("rol")) {
          tips.push(`Nota bibliográfica sobre ${contra.topic}: ${contra.issue}`);
        }
      }

      if (tips.length > 0) {
        sections.push(tips.join(" "));
      }
    }

    // 4. Also append expert engine structured answer for deep queries
    const expertRes = ExpertEngineService.generateAnswer(question, {
      project: context.project,
      findings: context.findings,
      tasks: context.tasks,
      risks: context.risks,
      team: context.team
    } as any);

    if (expertRes && expertRes.intent !== "general_inquiry" && expertRes.intent !== "project_analysis") {
      sections.push("\n" + expertRes.answer);
    }

    return sections.join(" ");
  }
}

/**
 * Proveedor para Google Gemini API
 */
export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallback: SanzuCoreProvider;

  constructor(apiKey?: string, model = "gemini-2.5-flash") {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || model;
    this.fallback = new SanzuCoreProvider();
  }

  async complete(system: string, user: string): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.complete(system, user);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      });

      if (!res.ok) {
        console.warn(`Gemini API respondió ${res.status}. Usando proveedor determinista.`);
        return this.fallback.complete(system, user);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || this.fallback.complete(system, user);
    } catch (err) {
      console.warn("Fallo al conectar con Gemini:", err instanceof Error ? err.message : err);
      return this.fallback.complete(system, user);
    }
  }
}

/**
 * Proveedor para OpenAI API
 */
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallback: SanzuCoreProvider;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = process.env.OPENAI_MODEL || model;
    this.fallback = new SanzuCoreProvider();
  }

  async complete(system: string, user: string): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.complete(system, user);
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: 0.2,
          max_tokens: 2048
        })
      });

      if (!res.ok) {
        console.warn(`OpenAI API respondió ${res.status}. Usando proveedor determinista.`);
        return this.fallback.complete(system, user);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      return text || this.fallback.complete(system, user);
    } catch (err) {
      console.warn("Fallo al conectar con OpenAI:", err instanceof Error ? err.message : err);
      return this.fallback.complete(system, user);
    }
  }
}

/**
 * Fábrica para instanciar el proveedor de IA adecuado según la configuración
 */
export function getAIProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || "").toLowerCase().trim();

  if (preferred === "gemini" && process.env.GEMINI_API_KEY) {
    return new GeminiAIProvider();
  }

  if (preferred === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  if (process.env.GEMINI_API_KEY) {
    return new GeminiAIProvider();
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  // Por defecto, modo determinista de alto rendimiento y cero dependencias de pago
  return new SanzuCoreProvider();
}
