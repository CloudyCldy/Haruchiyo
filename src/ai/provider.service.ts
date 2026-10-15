import { KnowledgeService } from "@/knowledge/service";
import { ProjectKnowledgeBase, RetrievedChunk } from "@/knowledge/corpus.types";

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
  };
};

export class SanzuCoreProvider implements AIProvider {
  async complete(_system: string, user: string): Promise<string> {
    let payload: CorePayload;
    try {
      payload = JSON.parse(user) as CorePayload;
    } catch {
      return "Error: Payload no válido para el asistente Sanzu.";
    }

    const { question, context } = payload;
    const { project, findings, knowledgeBase } = context;
    const metrics = findings.metrics;
    const methodology = (project.methodology || "AGILE").toUpperCase();
    const questionText = question.toLowerCase();

    // 1. Identify primary problem areas from metrics
    const problemsText = findings.problems.length
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

    // 3. Knowledge base grounding and citations
    const sections: string[] = [];

    // Context & Status summary (maintains exact compatibility with expected format)
    sections.push(
      `Contexto de ${project.name}: metodología ${methodology}. Progreso: ${metrics.progress}%. Pendientes: ${metrics.pendingTasks}. Bloqueadas: ${metrics.blockedTasks}. Vencidas: ${metrics.overdueTasks}. Riesgos: ${metrics.riskCount}. Issues: ${metrics.issueCount}. Progreso de hitos: ${metrics.milestoneProgress}%. ${problemsText} Acción sugerida: ${suggestedAction}`
    );

    // Knowledge base tips according to project type and question
    if (knowledgeBase) {
      const tips: string[] = [];

      // Relevant Templates
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

      // Relevant Checklists
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

      // Relevant Processes
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

      // Corpus Grounding Citations
      if (knowledgeBase.topChunks.length > 0) {
        const top = knowledgeBase.topChunks[0];
        tips.push(`Fundamentado en la base de conocimiento: ${top.citation} (${top.chunk.section_title}).`);
      }

      // Contradiction awareness
      if (knowledgeBase.contradictions.length > 0) {
        const contra = knowledgeBase.contradictions[0];
        if (questionText.includes("duracion") || questionText.includes("tiempo") || questionText.includes("rol") || questionText.includes("tiempo")) {
          tips.push(`Nota bibliográfica sobre ${contra.topic}: ${contra.issue}`);
        }
      }

      if (tips.length > 0) {
        sections.push(tips.join(" "));
      }
    } else {
      // Fallback knowledge lookup if knowledgeBase wasn't populated in context
      if (questionText.includes("plantilla") || questionText.includes("template") || questionText.includes("historia") || questionText.includes("user story")) {
        const templates = KnowledgeService.listTemplates({ methodology });
        const names = templates.map(t => t.name).join(", ");
        sections.push(`Plantillas recomendadas para ${methodology}: ${names || "user-story, bug-report"}. Puedes consultar /api/templates.`);
      } else if (questionText.includes("checklist") || questionText.includes("ready") || questionText.includes("done") || questionText.includes("calidad") || questionText.includes("dod") || questionText.includes("dor")) {
        const checklists = KnowledgeService.listChecklists({ methodology });
        const names = checklists.map(c => c.name).join(", ");
        sections.push(`Checklists aplicables: ${names || "Definition of Ready, Definition of Done"}. Evalúa el estado vía /api/checklists/{id}/evaluate.`);
      } else if (questionText.includes("proceso") || questionText.includes("flujo") || questionText.includes("lifecycle") || questionText.includes("sprint")) {
        const processes = KnowledgeService.listProcesses({ methodology });
        const names = processes.map(p => p.name).join(", ");
        sections.push(`Procesos estándar disponibles: ${names || "sprint-lifecycle, release-management"}. Consulta /api/processes.`);
      }
    }

    return sections.join(" ");
  }
}
