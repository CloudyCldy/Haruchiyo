import { corpusService } from "@/knowledge/corpus.service";
import { KnowledgeService } from "@/knowledge/service";

/**
 * SB-13 · ST054 / ST055
 * Búsqueda inteligente de documentación y recomendación de documentos según
 * el proyecto, su metodología y la fase en la que se encuentra.
 */

export type ProjectPhase = "INICIO" | "EJECUCION" | "CIERRE";
export const PROJECT_PHASES: ProjectPhase[] = ["INICIO", "EJECUCION", "CIERRE"];

// Qué tipo de material sirve en cada fase.
const PHASE_GUIDE: Record<ProjectPhase, {
  label: string;
  query: string;
  templateCategories: string[];
  checklistStages: string[];
  docCategories: string[];
}> = {
  INICIO: {
    label: "Inicio y planeación",
    query: "planning backlog requirements scope roles sprint planning objetivos alcance",
    templateCategories: ["PLANNING", "ARCHITECTURE"],
    checklistStages: ["READY"],
    docCategories: ["OVERVIEW", "GOVERNANCE", "ARCHITECTURE"],
  },
  EJECUCION: {
    label: "Ejecución y seguimiento",
    query: "daily review metrics quality testing risks impediments seguimiento calidad riesgos",
    templateCategories: ["EXECUTION", "QUALITY"],
    checklistStages: ["DONE", "REVIEW"],
    docCategories: ["STANDARDS", "ARCHITECTURE", "SECURITY"],
  },
  CIERRE: {
    label: "Cierre y entrega",
    query: "release retrospective lessons learned closure delivery acceptance cierre entrega",
    templateCategories: ["REVIEW", "QUALITY"],
    checklistStages: ["RELEASE", "SECURITY"],
    docCategories: ["GOVERNANCE", "SECURITY", "STANDARDS"],
  },
};

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tokens = (text: string) => normalize(text).split(/[^a-z0-9]+/).filter(token => token.length > 2);
const snippet = (text: string, max = 280) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

/** Deduce la fase del proyecto a partir de su estado y de cuánto tiempo del plan ha pasado. */
export function inferPhase(project: { status?: string | null; startDate?: Date | string | null; endDate?: Date | string | null }, now: Date = new Date()): ProjectPhase {
  const status = String(project.status || "").toUpperCase();
  if (status === "PLANNING") return "INICIO";
  if (status === "COMPLETED" || status === "CANCELLED") return "CIERRE";
  const start = project.startDate ? new Date(project.startDate).getTime() : NaN;
  const end = project.endDate ? new Date(project.endDate).getTime() : NaN;
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const elapsed = (now.getTime() - start) / (end - start);
    if (elapsed < 0.15) return "INICIO";
    if (elapsed >= 0.8) return "CIERRE";
  }
  return "EJECUCION";
}

export function parsePhase(value: string | null | undefined): ProjectPhase | undefined {
  if (!value) return undefined;
  const clean = normalize(value).toUpperCase();
  return (PROJECT_PHASES as string[]).includes(clean) ? (clean as ProjectPhase) : undefined;
}

/** ST054: busca en el corpus de conocimiento y en la documentación de Sanzu. */
export function searchDocumentation(options: { q: string; methodology?: string; category?: string; limit?: number }) {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 25);
  const methodology = options.methodology?.toUpperCase();
  const queryTokens = tokens(options.q);

  const chunks = corpusService.searchChunks({ query: options.q, methodology, category: options.category, limit }).map(result => ({
    source: "corpus" as const,
    documentId: result.chunk.document_id,
    documentTitle: result.documentTitle,
    section: result.chunk.section_title,
    page: result.chunk.page_start,
    snippet: snippet(result.chunk.summary || result.chunk.content),
    score: result.relevanceScore,
    citation: result.citation,
  }));

  // Coincidencias en la documentación propia de Sanzu (título, resumen y etiquetas)
  const guides = KnowledgeService.listDocumentation()
    .filter(doc => !methodology || doc.relatedMethodologies.includes(methodology))
    .map(doc => {
      const title = normalize(doc.title), summary = normalize(doc.summary), tags = doc.tags.map(normalize);
      const score = queryTokens.reduce((sum, token) => sum + (title.includes(token) ? 6 : 0) + (tags.some(tag => tag.includes(token)) ? 4 : 0) + (summary.includes(token) ? 2 : 0), 0);
      return { source: "guide" as const, documentId: doc.id, documentTitle: doc.title, section: doc.category, page: null, snippet: snippet(doc.summary), score, citation: `[${doc.title}, v${doc.version}]` };
    })
    .filter(doc => doc.score > 0);

  const results = [...guides, ...chunks].sort((a, b) => b.score - a.score).slice(0, limit);
  return { query: options.q, methodology: methodology ?? null, total: results.length, results };
}

/** ST055: recomienda documentos según el proyecto, su metodología y su fase. */
export function recommendDocuments(options: { methodology: string; phase: ProjectPhase; query?: string; limit?: number }) {
  const methodology = (options.methodology || "AGILE").toUpperCase();
  const guide = PHASE_GUIDE[options.phase];
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 15);

  const templates = KnowledgeService.listTemplates({ methodology })
    .filter(t => guide.templateCategories.includes(t.category))
    .map(t => ({ id: t.id, name: t.name, category: t.category, description: t.description }));
  const checklists = KnowledgeService.listChecklists({ methodology })
    .filter(c => guide.checklistStages.includes(c.stage))
    .map(c => ({ id: c.id, name: c.name, stage: c.stage, description: c.description }));
  const processes = KnowledgeService.listProcesses({ methodology })
    .map(p => ({ id: p.id, name: p.name }));
  const documentation = KnowledgeService.listDocumentation()
    .filter(d => guide.docCategories.includes(d.category) && (d.relatedMethodologies.length === 0 || d.relatedMethodologies.includes(methodology)))
    .map(d => ({ id: d.id, title: d.title, category: d.category, summary: snippet(d.summary, 200) }));
  const readings = corpusService.searchChunks({ methodology, query: `${options.query ?? ""} ${guide.query}`.trim(), limit })
    .map(r => ({ documentTitle: r.documentTitle, section: r.chunk.section_title, page: r.chunk.page_start, citation: r.citation, snippet: snippet(r.chunk.summary || r.chunk.content, 200) }));

  return { methodology, phase: options.phase, phaseLabel: guide.label, templates, checklists, processes, documentation, readings };
}