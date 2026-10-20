import { IntentClassifier, AssistantIntent, ClassificationResult } from "./intent.classifier";
import { dictionaryService } from "@/knowledge/dictionary/service";

export interface ProjectContextData {
  project?: {
    id?: string;
    name: string;
    methodology?: string;
    description?: string | null;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  findings?: {
    metrics: {
      progress: number;
      blockedTasks: number;
      overdueTasks: number;
      pendingTasks: number;
      riskCount: number;
      issueCount: number;
      milestoneProgress: number;
    };
    problems: Array<{ type?: string; severity?: string; description: string }>;
    recommendations?: string[];
  };
  tasks?: Array<{
    id: number | string;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
    assigned_to?: any;
    assignee_name?: string;
  }>;
  team?: Array<{ userId?: any; name: string; role?: string }>;
  risks?: Array<{ title: string; probability: string; impact: string; status: string }>;
  sprint?: { name: string; goal?: string; status: string; startDate?: string; endDate?: string } | null;
}

export interface StructuredAnswer {
  answer: string;
  intent: AssistantIntent;
  confidence: number;
  sources: string[];
  suggestions: string[];
  metadata: {
    provider: "sanzu-deterministic" | "gemini" | "openai";
    version: "v1";
    language: "es" | "en";
    hasProjectContext: boolean;
    timestamp: string;
  };
}

export class ExpertEngineService {
  public static generateAnswer(
    query: string,
    context?: ProjectContextData,
    forcedIntent?: AssistantIntent
  ): StructuredAnswer {
    const classification = IntentClassifier.classify(query);
    const intent = forcedIntent || classification.intent;
    const hasProjectContext = Boolean(context?.project?.name);
    const sources: string[] = [];
    const suggestions: string[] = [];

    let answer = "";

    switch (intent) {
      case "prioritization":
        answer = this.handlePrioritization(classification, context, suggestions, sources);
        break;

      case "risk_assessment":
        answer = this.handleRiskAssessment(classification, context, suggestions, sources);
        break;

      case "project_analysis":
        answer = this.handleProjectAnalysis(classification, context, suggestions, sources);
        break;

      case "definition":
        answer = this.handleDefinition(classification, suggestions, sources);
        break;

      case "comparison":
        answer = this.handleComparison(classification, suggestions, sources);
        break;

      case "metrics_query":
        answer = this.handleMetrics(classification, context, suggestions, sources);
        break;

      case "task_generation":
        answer = this.handleTaskGeneration(classification, suggestions, sources);
        break;

      case "step_by_step":
        answer = this.handleStepByStep(classification, suggestions, sources);
        break;

      case "troubleshooting":
        answer = this.handleTroubleshooting(classification, suggestions, sources);
        break;

      case "dictionary_search":
        answer = this.handleDictionarySearch(classification, suggestions, sources);
        break;

      default:
        answer = this.handleGeneralInquiry(classification, context, suggestions, sources);
        break;
    }

    return {
      answer,
      intent,
      confidence: classification.confidence,
      sources,
      suggestions,
      metadata: {
        provider: "sanzu-deterministic",
        version: "v1",
        language: classification.language,
        hasProjectContext,
        timestamp: new Date().toISOString()
      }
    };
  }

  private static handlePrioritization(
    c: ClassificationResult,
    ctx: ProjectContextData | undefined,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Gestión de Prioridades y Cuellos de Botella (Lean/Agile)");
    suggestions.push("¿Cuáles son los riesgos actuales del sprint?", "Ver resumen para la reunión", "Definición de Definition of Done");

    if (!ctx || !ctx.tasks || ctx.tasks.length === 0) {
      return (
        "### Plan de Acción y Priorización Recomendada\n\n" +
        "> **Nota sobre contexto:** No se recibieron tareas específicas de un proyecto activo. Te presento el marco de priorización ágil estándar para tu jornada:\n\n" +
        "1. **Eliminar Bloqueos (Blockers):** Revisa si hay tareas detenidas por dependencias externas o fallos técnicos y resuélvelas antes de empezar trabajo nuevo.\n" +
        "2. **Proteger el Sprint Goal:** Enfócate en las tareas que contribuyen directamente a la meta del sprint actual.\n" +
        "3. **Tareas cerca de la fecha límite:** Atiende aquellas con fecha de entrega inmediata para no generar retrasos en cascada.\n" +
        "4. **Revisión de Código (PRs):** Revisa los PRs pendientes de tus compañeros para mantener el flujo continuo de entrega (respetando los límites WIP)."
      );
    }

    const tasks = ctx.tasks;
    const blocked = tasks.filter(t => t.status === "bloqueada" || t.status === "BLOCKED");
    const open = tasks.filter(t => t.status !== "completada" && t.status !== "DONE");
    const now = new Date();
    const overdue = open.filter(t => t.due_date && new Date(`${t.due_date}T23:59:59`) < now);
    const critical = open.filter(t => t.priority === "critica" || t.priority === "alta" || t.priority === "CRITICAL" || t.priority === "HIGH");

    let text = `### Prioridades para Hoy (${ctx.project?.name || "Proyecto"})\n\n`;

    if (blocked.length > 0) {
      text += `🚨 **1. Desatascar Tareas Bloqueadas (${blocked.length}):**\n`;
      blocked.slice(0, 3).forEach(t => {
        text += `- **${t.title}** (Prioridad: ${t.priority})\n`;
      });
      text += `*Acción:* Convoca a los involucrados para desbloquear el flujo y proteger la entrega.\n\n`;
    }

    if (overdue.length > 0) {
      text += `⚠️ **2. Tareas Vencidas (${overdue.length}):**\n`;
      overdue.slice(0, 3).forEach(t => {
        text += `- **${t.title}** (Venció el: ${t.due_date?.slice(0, 10)})\n`;
      });
      text += `*Acción:* Replanifica la fecha con el equipo o reasigna capacidad hoy mismo.\n\n`;
    }

    if (critical.length > 0) {
      text += `🎯 **3. Tareas Críticas/Alta Prioridad en Curso (${critical.length}):**\n`;
      critical.slice(0, 3).forEach(t => {
        text += `- **${t.title}** (Estado: ${t.status})\n`;
      });
      text += `*Acción:* Concéntrate en terminar estas tareas antes de abrir nuevas tarjetas.\n\n`;
    }

    if (blocked.length === 0 && overdue.length === 0 && critical.length === 0) {
      text += `✅ **Estado Favorable:** No hay tareas bloqueadas ni vencidas. Avanza en las ${open.length} tareas pendientes planificadas respetando el orden del Sprint Backlog.\n`;
    }

    return text.trim();
  }

  private static handleRiskAssessment(
    c: ClassificationResult,
    ctx: ProjectContextData | undefined,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Matriz de Riesgos (Probabilidad x Impacto) - Sanzu Knowledge");
    suggestions.push("¿Qué debería hacer hoy?", "¿Cómo elaborar un plan de mitigación?", "Definición de Ruta Crítica");

    if (!ctx || !ctx.tasks) {
      return (
        "### Identificación y Gestión de Riesgos de Proyecto\n\n" +
        "Para evaluar los riesgos que amenazan el cumplimiento del sprint o entrega:\n\n" +
        "1. **Tareas Críticas Bloqueadas:** Cada tarea detenida consume tiempo de holgura y puede impactar la ruta crítica.\n" +
        "2. **Sobrecarga de Asignatarios:** Si más del 40% de las tareas críticas recaen en un solo integrante, se eleva el *Bus Factor* y el riesgo de cuello de botella.\n" +
        "3. **Desviación de Fechas:** Tareas con fecha límite anterior a hoy sin completar indican una estimación optimista o impedimentos no reportados.\n" +
        "4. **Severidad:** Calcula $\\text{Severidad} = \\text{Probabilidad} \\times \\text{Impacto}$ y define planes de mitigación preventivos."
      );
    }

    const tasks = ctx.tasks;
    const blocked = tasks.filter(t => t.status === "bloqueada" || t.status === "BLOCKED");
    const now = new Date();
    const overdue = tasks.filter(t => t.status !== "completada" && t.status !== "DONE" && t.due_date && new Date(`${t.due_date}T23:59:59`) < now);
    const risksList = ctx.risks || [];

    let text = `### Análisis de Riesgos (${ctx.project?.name || "Proyecto"})\n\n`;

    if (blocked.length > 0) {
      text += `🛑 **Riesgo Inmediato - Bloqueos (${blocked.length}):**\n`;
      blocked.forEach(t => {
        text += `- Tarea "${t.title}" en estado BLOQUEADA. Si no se resuelve en 24h, impactará la fecha de cierre.\n`;
      });
      text += "\n";
    }

    if (overdue.length > 0) {
      text += `⏰ **Riesgo de Cronograma - Tareas Vencidas (${overdue.length}):**\n`;
      overdue.forEach(t => {
        text += `- Tarea "${t.title}" tiene fecha límite vencida (${t.due_date?.slice(0, 10)}).\n`;
      });
      text += "\n";
    }

    if (risksList.length > 0) {
      text += `📋 **Riesgos Formales Registrados (${risksList.length}):**\n`;
      risksList.forEach(r => {
        text += `- **${r.title}** (Probabilidad: ${r.probability}, Impacto: ${r.impact}, Estado: ${r.status})\n`;
      });
      text += "\n";
    }

    if (blocked.length === 0 && overdue.length === 0 && risksList.length === 0) {
      text += "✅ **Riesgo Bajo:** No se detectan tareas bloqueadas, retrasos ni riesgos abiertos que comprometan el sprint actual.\n";
    }

    return text.trim();
  }

  private static handleProjectAnalysis(
    c: ClassificationResult,
    ctx: ProjectContextData | undefined,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Métricas de Avance y Resumen Ejecutivo");
    suggestions.push("¿Qué debería hacer hoy?", "¿Qué tareas ponen en riesgo el sprint?", "Explicar gráfico burndown");

    if (!ctx || !ctx.tasks) {
      return (
        "### Resumen de Proyecto\n\n" +
        "Para realizar un análisis completo, el sistema requiere el contexto del proyecto (tareas, equipo y sprints). " +
        "En una reunión típica, revisa: avance porcentual, tareas completadas vs pendientes, bloqueos activos y acuerdos de la jornada."
      );
    }

    const tasks = ctx.tasks;
    const completed = tasks.filter(t => t.status === "completada" || t.status === "DONE");
    const open = tasks.filter(t => t.status !== "completada" && t.status !== "DONE");
    const blocked = tasks.filter(t => t.status === "bloqueada" || t.status === "BLOCKED");
    const now = new Date();
    const overdue = open.filter(t => t.due_date && new Date(`${t.due_date}T23:59:59`) < now);
    const critical = open.filter(t => t.priority === "critica" || t.priority === "alta" || t.priority === "CRITICAL" || t.priority === "HIGH");
    const progress = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
    const teamCount = ctx.team?.length || 0;
    const methodology = ctx.project?.methodology || "Ágil";

    return (
      `### Resumen para la reunión (${ctx.project?.name || "Sakura Coffee"})\n\n` +
      `• **Metodología:** ${methodology}.\n` +
      `• **Avance general:** ${progress}% (${completed.length} de ${tasks.length} tareas completadas).\n` +
      `• **Tareas abiertas:** ${open.length} pendientes (${overdue.length} vencidas, ${critical.length} de alta prioridad).\n` +
      `• **Tareas bloqueadas:** ${blocked.length}.\n` +
      `• **Equipo:** ${teamCount} integrante(s) activo(s).\n\n` +
      (overdue.length > 0
        ? `• **Atención inmediata:** ${overdue.length} tarea(s) vencida(s) (${overdue.slice(0, 3).map(t => t.title).join(", ")}${overdue.length > 3 ? "..." : ""}).`
        : "• **Plazos:** Sin tareas vencidas registradas.")
    );
  }

  private static handleDefinition(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    const entry = c.matchedDictionaryEntries[0];
    if (entry) {
      sources.push(`Diccionario Sanzu: ${entry.term} (Categoría: ${entry.category})`);
      if (entry.relatedConcepts.length > 0) {
        suggestions.push(...entry.relatedConcepts.slice(0, 3).map(r => `¿Qué es ${r}?`));
      }

      return (
        `### ${entry.term}\n\n` +
        `**Definición técnica:**\n${entry.definition}\n\n` +
        `**Explicación sencilla (para principiantes):**\n${entry.beginnerExplanation}\n\n` +
        `**Ejemplo práctico:**\n${entry.example}\n\n` +
        `**Buenas prácticas / Recomendaciones:**\n${entry.recommendations.map(r => `- ${r}`).join("\n")}\n\n` +
        `*Categoría:* \`${entry.category}\` | *Traducción:* ${entry.translations.en} / ${entry.translations.es}`
      );
    }

    return (
      "### Concepto de Gestión de Proyectos\n\n" +
      `No se encontró una entrada exacta para "${c.normalizedQuery}". Puedes consultar los términos disponibles en la API de Sanzu en \`GET /api/v1/dictionary\`.`
    );
  }

  private static handleComparison(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    const norm = c.normalizedQuery;
    sources.push("Comparativas Metodológicas - Sanzu Architecture Guide");

    if (norm.includes("scrum") && norm.includes("kanban")) {
      suggestions.push("¿Qué es un Sprint?", "¿Qué es un WIP Limit?", "¿Cómo calcular el Lead Time?");
      return (
        "### Comparativa: Scrum vs Kanban\n\n" +
        "| Característica | Scrum | Kanban |\n" +
        "|---|---|---|\n" +
        "| **Cadencia** | Iteraciones fijas (Sprints de 1-4 semanas) | Flujo continuo sin timeboxes obligatorios |\n" +
        "| **Métricas clave** | Velocidad (Velocity), Burndown | Lead Time, Cycle Time, Throughput |\n" +
        "| **Gestión de cambios** | No se agregan ítems al Sprint activo | Se admiten cambios en cuanto se libera capacidad |\n" +
        "| **Control de carga** | Capacidad del equipo por sprint | Límites de trabajo en progreso (WIP Limits) |\n" +
        "| **Roles formales** | Product Owner, Scrum Master, Developers | Sin roles preestablecidos obligatorios |\n\n" +
        "**¿Cuándo usar cuál?**\n" +
        "- Usa **Scrum** cuando desarrolles productos nuevos con metas claras y entregables planificados.\n" +
        "- Usa **Kanban** cuando gestiones soporte, mantenimiento continuo o peticiones con prioridad cambiante."
      );
    }

    if (norm.includes("tdd") || norm.includes("test")) {
      suggestions.push("Definición de TDD", "Pruebas E2E con Playwright", "Pirámide de Pruebas");
      return (
        "### Comparativa: TDD vs Pruebas Tradicionales al Final\n\n" +
        "| Enfoque | TDD (Test-Driven Development) | Pruebas Tradicionales |\n" +
        "|---|---|---|\n" +
        "| **Momento** | Las pruebas se escriben antes del código | Las pruebas se escriben tras programar la función |\n" +
        "| **Objetivo** | Guiar el diseño y garantizar calidad continua | Verificar que no haya fallos evidentes |\n" +
        "| **Deuda técnica** | Muy baja; el código nace testeable y modular | Mayor riesgo de acoplamiento difícil de probar |\n" +
        "| **Ciclo** | Red-Green-Refactor | Code-Test-Fix |"
      );
    }

    return (
      "### Comparativa de Metodologías y Enfoques\n\n" +
      "Al comparar herramientas o metodologías (como Agile vs Cascada, o Scrum vs Kanban), analiza:\n" +
      "1. Nivel de certidumbre de los requisitos.\n" +
      "2. Frecuencia de entregas requerida.\n" +
      "3. Costo del cambio de rumbo."
    );
  }

  private static handleMetrics(
    c: ClassificationResult,
    ctx: ProjectContextData | undefined,
    suggestions: string[],
    sources: string[]
  ): string {
    const metric = c.detectedMetric || "general";
    sources.push("Guía de Métricas de Software y Toma de Decisiones");
    suggestions.push("Explicar velocidad de equipo", "¿Qué es Lead Time?", "Ver gráfico burndown");

    if (metric === "velocity" || c.normalizedQuery.includes("velocidad")) {
      return (
        "### Velocidad del Equipo (Team Velocity)\n\n" +
        "• **Qué significa:** Cantidad de puntos de historia o unidades de trabajo completadas y aceptadas por el equipo en un sprint.\n" +
        "• **Cómo se calcula:** $\\text{Velocidad} = \\sum \\text{Puntos de historias con DoD cumplida en el sprint}$.\n" +
        "• **Para qué es útil:** Para predecir cuánto trabajo puede comprometer el equipo en el siguiente sprint.\n" +
        "• **Limitaciones:** Nunca debe compararse entre equipos diferentes; es una métrica de previsibilidad interna, no de productividad individual."
      );
    }

    if (metric === "lead_time" || c.normalizedQuery.includes("lead time") || c.normalizedQuery.includes("entrega")) {
      return (
        "### Lead Time (Tiempo de Entrega)\n\n" +
        "• **Qué significa:** Tiempo total transcurrido desde que el usuario solicita una función hasta que está disponible en producción.\n" +
        "• **Cómo se calcula:** $\\text{Lead Time} = \\text{Fecha de Despliegue} - \\text{Fecha de Creación de la Solicitud}$.\n" +
        "• **Para qué es útil:** Medir la capacidad de respuesta de la organización y satisfacer acuerdos de nivel de servicio (SLAs).\n" +
        "• **Limitaciones:** Incluye tiempos de espera muertos en el backlog fuera del control del equipo de ingeniería."
      );
    }

    if (metric === "cycle_time" || c.normalizedQuery.includes("cycle time") || c.normalizedQuery.includes("ciclo")) {
      return (
        "### Cycle Time (Tiempo de Ciclo)\n\n" +
        "• **Qué significa:** Tiempo activo que tarda el equipo en desarrollar una tarea desde que entra a 'En Proceso' hasta que se completa.\n" +
        "• **Cómo se calcula:** $\\text{Cycle Time} = \\text{Fecha de Finalización} - \\text{Fecha de Inicio de Trabajo}$.\n" +
        "• **Para qué es útil:** Es el indicador más fidedigno de la eficiencia del proceso de desarrollo.\n" +
        "• **Limitaciones:** Tareas mal descompuestas (demasiado grandes) distorsionan la métrica."
      );
    }

    if (metric === "burndown" || c.normalizedQuery.includes("burndown") || c.normalizedQuery.includes("quemado")) {
      return (
        "### Gráfico Burndown (Burndown Chart)\n\n" +
        "• **Qué significa:** Visualización del trabajo restante en el sprint día tras día comparado con la línea ideal hacia cero.\n" +
        "• **Interpretación:** Si la línea real está por encima de la ideal, hay riesgo de no completar el alcance; si está por debajo, el equipo avanza más rápido de lo previsto.\n" +
        "• **Limitaciones:** No refleja el valor entregado, solo horas o puntos consumidos."
      );
    }

    const tasks = ctx?.tasks || [];
    const completed = tasks.filter(t => t.status === "completada" || t.status === "DONE").length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return (
      "### Métricas de Proyecto\n\n" +
      `• **Progreso general:** ${progress}% (${completed} de ${tasks.length} tareas completadas).\n` +
      "• **Métricas clave disponibles:** Velocidad de Sprint, Lead Time, Cycle Time y Gráfico Burndown. Pregunta por cualquiera de ellas para ver su cálculo y recomendaciones."
    );
  }

  private static handleTaskGeneration(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Plantillas de Historias y Criterios BDD (KB-01)");
    suggestions.push("¿Qué es Definition of Ready?", "Criterios para pruebas en Playwright");

    return (
      "### Plantilla Estándar: Historia de Usuario y Criterios de Aceptación\n\n" +
      "```markdown\n" +
      "### Historia de Usuario: [Título Descriptivo]\n\n" +
      "Como [rol del usuario],\n" +
      "Quiero [acción o funcionalidad requerida],\n" +
      "Para [beneficio o valor de negocio esperado].\n\n" +
      "#### Criterios de Aceptación (Formato Given-When-Then):\n" +
      "1. Escenario Exitoso:\n" +
      "   - Dado que [condición inicial o usuario autenticado],\n" +
      "   - Cuando [realiza la acción específica],\n" +
      "   - Entonces [el sistema responde con éxito y actualiza el estado].\n\n" +
      "2. Escenario de Error / Validación:\n" +
      "   - Dado que [los datos ingresados son incompletos o inválidos],\n" +
      "   - Cuando [envía la solicitud],\n" +
      "   - Entonces [el sistema devuelve código 422 y un mensaje claro].\n\n" +
      "#### Definición de Terminado (DoD):\n" +
      "- [ ] Código revisado por un par (Code Review aprobado)\n" +
      "- [ ] Pruebas unitarias e integración en verde\n" +
      "- [ ] Documentado en Swagger / OpenAPI\n" +
      "```"
    );
  }

  private static handleStepByStep(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Procesos Estándar de Gestión de Proyectos TI");
    suggestions.push("¿Cómo priorizar el backlog?", "Explicar Daily Scrum");

    return (
      "### Procedimiento Paso a Paso: Planificación de Sprint (Sprint Planning)\n\n" +
      "1. **Revisar la Capacidad del Equipo:** Determina la disponibilidad real de horas y vacaciones de los integrantes para el sprint.\n" +
      "2. **Presentar el Sprint Goal:** El Product Owner expone el objetivo de valor que orientará todo el trabajo del ciclo.\n" +
      "3. **Seleccionar Elementos del Backlog:** Tomar las historias que cumplen la *Definition of Ready* hasta cubrir la velocidad estimada.\n" +
      "4. **Descomponer en Tareas Técnicas:** Dividir cada historia en tareas de diseño, backend, frontend y pruebas (< 8 horas cada una).\n" +
      "5. **Confirmar Compromiso:** El equipo confirma colectivamente que el alcance seleccionado es alcanzable y protege el Sprint Goal."
    );
  }

  private static handleTroubleshooting(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    sources.push("Protocolo de Resolución de Incidencias Técnicas");
    suggestions.push("Ver estado de Sanzu", "Pruebas automatizadas en Playwright");

    return (
      "### Guía de Diagnóstico y Resolución de Errores Técnicos\n\n" +
      "1. **Aislar el Error:** Revisa los logs en busca del código de estado (401: autenticación, 404: recurso no encontrado, 422: validación, 502: servicio no responde).\n" +
      "2. **Reproducir Localmente:** Ejecuta la petición exacta mediante `curl` o un test automatizado con `supertest` para observar el payload devuelto.\n" +
      "3. **Verificar Variables de Entorno:** Confirma que las credenciales (`SANZU_API_KEY`, `SANZU_API_URL`) estén cargadas y sean válidas.\n" +
      "4. **Agregar Prueba de Regresión:** Una vez corregido el fallo, añade una prueba unitaria o E2E que asegure que no vuelva a ocurrir."
    );
  }

  private static handleDictionarySearch(
    c: ClassificationResult,
    suggestions: string[],
    sources: string[]
  ): string {
    const res = dictionaryService.search({ q: c.normalizedQuery.replace(/diccionario|glosario|busca/g, "").trim(), limit: 5 });
    sources.push("Catálogo del Diccionario Sanzu (15 Categorías)");

    if (res.items.length === 0) {
      return (
        "### Diccionario de Gestión de Proyectos\n\n" +
        "Puedes consultar el diccionario completo llamando a `GET /api/v1/dictionary` o filtrando por categorías como `gestion_proyectos`, `scrum_agile`, `kanban_lean`, `qa_testing` y `seguridad`."
      );
    }

    let text = `### Resultados del Diccionario (${res.total} encontrados):\n\n`;
    for (const item of res.items) {
      text += `• **${item.term}** (\`${item.category}\`): ${item.beginnerExplanation}\n`;
      suggestions.push(`Definición de ${item.term}`);
    }
    return text;
  }

  private static handleGeneralInquiry(
    c: ClassificationResult,
    ctx: ProjectContextData | undefined,
    suggestions: string[],
    sources: string[]
  ): string {
    suggestions.push("¿Qué debería hacer hoy?", "¿Qué tareas ponen en riesgo el sprint?", "Resumen para la reunión", "¿Qué es un Sprint?");
    sources.push("Asistente Sanzu IA");

    const projectName = ctx?.project?.name || "tu proyecto";
    const methodology = ctx?.project?.methodology || "Ágil";

    return (
      `Hola. Soy el asistente de gestión inteligente de Sanzu para **${projectName}** (Metodología: ${methodology}).\n\n` +
      "Puedo ayudarte a:\n" +
      "1. **Monitorear el proyecto:** Pregunta por el progreso, tareas vencidas o un resumen para la reunión.\n" +
      "2. **Evaluar riesgos y prioridades:** Pregunta qué tareas deberías priorizar hoy o qué riesgos amenazan el sprint.\n" +
      "3. **Consultar conceptos técnicos:** Pregunta por cualquier término de Scrum, Kanban, XP, DevOps, APIs o pruebas con Playwright."
    );
  }
}
