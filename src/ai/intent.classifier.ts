import { dictionaryService } from "@/knowledge/dictionary/service";

export type AssistantIntent =
  | "definition"
  | "comparison"
  | "step_by_step"
  | "troubleshooting"
  | "project_analysis"
  | "risk_assessment"
  | "prioritization"
  | "metrics_query"
  | "dictionary_search"
  | "task_generation"
  | "general_inquiry";

export interface ClassificationResult {
  intent: AssistantIntent;
  confidence: number;
  normalizedQuery: string;
  matchedTerms: string[];
  matchedDictionaryEntries: Array<ReturnType<typeof dictionaryService.getById>>;
  detectedMethodology?: string;
  detectedMetric?: string;
  requiresProjectContext: boolean;
  language: "es" | "en";
}

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class IntentClassifier {
  public static classify(query: string): ClassificationResult {
    const raw = String(query || "").trim();
    const norm = normalize(raw);

    // Language detection: default es, detect english keywords
    const isEn = /\b(what is|how to|difference between|compare|help me with|in english)\b/i.test(raw);
    const language: "es" | "en" = isEn ? "en" : "es";

    // 1. Matched dictionary entries and terms
    const matchedTerms: string[] = [];
    const matchedEntries: Array<any> = [];

    const cleanedQ = norm
      .replace(/^(que es|que significa|definicion de|definir|define|concepto de|a que se refiere|como funciona|que son|diferencia entre|diferencias entre|what is|meaning of)\s+(el|la|los|las|un|una|unos|unas|the|a|an)?\s*/i, "")
      .trim();

    // Check direct cleaned query or synonyms
    const directMatch = dictionaryService.getByExactTermOrSynonym(cleanedQ);
    if (directMatch) {
      matchedTerms.push(directMatch.term);
      matchedEntries.push(directMatch);
    }

    // Extract inside parentheses like (DoD), (DoR), (WBS), etc.
    const parenMatches = raw.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const p of parenMatches) {
        const inner = p.replace(/[()]/g, "").trim();
        const found = dictionaryService.getByExactTermOrSynonym(inner);
        if (found && !matchedEntries.some(e => e.id === found.id)) {
          matchedTerms.push(found.term);
          matchedEntries.push(found);
        }
      }
    }

    const searchRes = dictionaryService.search({ q: cleanedQ || norm, limit: 3 });
    for (const item of searchRes.items) {
      if (!matchedEntries.some(e => e.id === item.id)) {
        matchedTerms.push(item.term);
        matchedEntries.push(item);
      }
    }


    // Detect methodology
    let detectedMethodology: string | undefined;
    if (/\b(scrum)\b/.test(norm)) detectedMethodology = "SCRUM";
    else if (/\b(kanban)\b/.test(norm)) detectedMethodology = "KANBAN";
    else if (/\b(xp|extreme programming)\b/.test(norm)) detectedMethodology = "XP";
    else if (/\b(waterfall|cascada)\b/.test(norm)) detectedMethodology = "WATERFALL";
    else if (/\b(lean)\b/.test(norm)) detectedMethodology = "LEAN";
    else if (/\b(hibrid|bimodal)\b/.test(norm)) detectedMethodology = "HYBRID";

    // Detect metric
    let detectedMetric: string | undefined;
    if (/\b(velocidad|velocity)\b/.test(norm)) detectedMetric = "velocity";
    else if (/\b(lead time|tiempo de entrega)\b/.test(norm)) detectedMetric = "lead_time";
    else if (/\b(cycle time|tiempo de ciclo)\b/.test(norm)) detectedMetric = "cycle_time";
    else if (/\b(burndown|quemado)\b/.test(norm)) detectedMetric = "burndown";
    else if (/\b(throughput|rendimiento)\b/.test(norm)) detectedMetric = "throughput";
    else if (/\b(progreso|avance|porcentaje)\b/.test(norm)) detectedMetric = "progress";

    // 2. Intent matching rules with scoring
    let intent: AssistantIntent = "general_inquiry";
    let confidence = 0.5;
    let requiresContext = false;

    // Prioritization: "¿Qué debería hacer hoy?", "¿Qué hago hoy?", "priorizar", "prioridades"
    if (
      /\b(que (deberia|debo|hago|hacer|tengo que hacer)|hoy|priorizar|prioridad|prioridades|siguiente paso|proximo paso|que sigue)\b/.test(norm) ||
      /\b(what should i do|what to do today|next steps|priorities)\b/.test(norm)
    ) {
      intent = "prioritization";
      confidence = 0.95;
      requiresContext = true;
    }
    // Risk assessment: "¿Qué tareas ponen en riesgo el sprint?", "riesgos", "amenazas", "peligro"
    else if (
      /\b(riesgo|riesgos|amenaza|peligro|poner en riesgo|en riesgo el sprint|risk|risks)\b/.test(norm)
    ) {
      intent = "risk_assessment";
      confidence = 0.9;
      requiresContext = true;
    }
    // Project analysis / Status: "resumen para la reunión", "cómo va el proyecto", "estado del proyecto", "tareas vencidas"
    else if (
      /\b(resumen para|reunion|como va el proyecto|estado del proyecto|avance del proyecto|progreso del proyecto|tareas vencidas|vencid|retras|bloquead)\b/.test(norm)
    ) {
      intent = "project_analysis";
      confidence = 0.9;
      requiresContext = true;
    }
    // Comparison: "Diferencia entre...", "vs", "comparar"
    else if (
      /\b(diferencia entre|diferencias|comparar|comparacion|versus|\bvs\b|difference between|compare)\b/.test(norm)
    ) {
      intent = "comparison";
      confidence = 0.92;
      requiresContext = false;
    }
    // Task generation / Acceptance criteria: "crea una historia", "criterios de aceptacion", "genera una tarea", "escribe una historia"
    else if (
      /\b(criterios de aceptacion|acceptance criteria|escribe una historia|generar tarea|crear historia|generar historia|criterios para)\b/.test(norm)
    ) {
      intent = "task_generation";
      confidence = 0.88;
      requiresContext = false;
    }
    // Step by step / Guide: "pasos para", "cómo planificar", "guía para", "procedimiento", "how to"
    else if (
      /\b(pasos para|como (planificar|hacer|ejecutar|iniciar|cerrar|configurar)|guia para|instrucciones|procedimiento|how to)\b/.test(norm)
    ) {
      intent = "step_by_step";
      confidence = 0.85;
      requiresContext = false;
    }
    // Troubleshooting: "error", "fallo", "problema", "bug", "como solucionar", "502", "500", "solucionar"
    else if (
      /\b(error|fallo|falla|problema|bug|excepcion|como solucionar|resolver error|troubleshoot)\b/.test(norm)
    ) {
      intent = "troubleshooting";
      confidence = 0.82;
      requiresContext = false;
    }
    // Dictionary search: "busca en el diccionario", "términos de", "glosario", "diccionario"
    else if (
      /\b(diccionario|glosario|busca en el diccionario|terminos relacionados|buscar concepto)\b/.test(norm)
    ) {
      intent = "dictionary_search";
      confidence = 0.95;
      requiresContext = false;
    }
    // Definition: "qué es", "que significa", "definicion de", "define", "concepto de", "what is"
    else if (
      /\b(que es|que significa|definicion de|definir|define|concepto de|a que se refiere|what is|meaning of)\b/.test(norm) ||
      (matchedEntries.length > 0 && norm.split(/\s+/).length <= 4)
    ) {
      intent = "definition";
      confidence = 0.9;
      requiresContext = false;
    }
    // Metrics query: "¿cuál es la velocidad?", "cómo se calcula el lead time", "métricas"
    else if (
      detectedMetric !== undefined ||
      /\b(metrica|metricas|formula|calculo|calcular)\b/.test(norm)
    ) {
      intent = "metrics_query";
      confidence = 0.85;
      requiresContext = detectedMetric === "progress";
    }

    return {
      intent,
      confidence,
      normalizedQuery: norm,
      matchedTerms,
      matchedDictionaryEntries: matchedEntries,
      detectedMethodology,
      detectedMetric,
      requiresProjectContext: requiresContext,
      language
    };
  }
}
