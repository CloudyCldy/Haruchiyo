import fs from "fs";
import path from "path";
import {
  CorpusChunk,
  CorpusDocument,
  GlossaryEntry,
  ContradictionEntry,
  RelationshipEntry,
  RetrievedChunk,
  ProjectKnowledgeBase
} from "./corpus.types";
import { KnowledgeService } from "./service";
import { getStrategy } from "@/methodology/types";

const METHODOLOGY_CATEGORY_MAP: Record<string, string[]> = {
  SCRUM: ["scrum", "metodologias_agiles", "planificacion", "equipos_roles", "calidad_pruebas"],
  KANBAN: ["kanban", "metodologias_agiles", "metricas", "lanzamiento_operacion"],
  WATERFALL: ["metodologias_predictivas", "planificacion", "riesgos", "costes_recursos", "requisitos_alcance"],
  XP: ["xp", "calidad_pruebas", "metodologias_agiles", "devops_ci"],
  LEAN: ["lean", "metodologias_agiles", "metricas"],
  HYBRID: ["hibrida_bimodal", "scrum", "metodologias_predictivas", "metodologias_agiles", "riesgos"],
  AGILE: ["metodologias_agiles", "scrum", "kanban", "xp", "equipos_roles", "calidad_pruebas"]
};

const STOP_WORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "en", "para", "por",
  "con", "sobre", "del", "al", "que", "es", "son", "se", "como", "su", "sus", "the", "a",
  "an", "and", "or", "in", "on", "for", "with", "about", "of", "to", "at", "is", "are", "it"
]);

function normalize(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: unknown): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

export class CorpusService {
  private static instance: CorpusService | null = null;

  private documents: Map<string, CorpusDocument> = new Map();
  private chunks: CorpusChunk[] = [];
  private chunksById: Map<string, CorpusChunk> = new Map();
  private chunksByCategory: Map<string, CorpusChunk[]> = new Map();
  private glossary: Map<string, GlossaryEntry> = new Map();
  private contradictions: ContradictionEntry[] = [];
  private contradictionsById: Map<string, ContradictionEntry> = new Map();
  private relationships: RelationshipEntry[] = [];
  private initialized = false;

  private constructor() {
    this.loadCorpus();
  }

  public static getInstance(): CorpusService {
    if (!CorpusService.instance) {
      CorpusService.instance = new CorpusService();
    }
    return CorpusService.instance;
  }

  private resolveCorpusDir(): string {
    const candidates = [
      path.resolve(process.cwd(), "src/knowledge/corpus"),
      path.resolve(process.cwd(), "app/api/chatbot/conversations/[id]/knowledge"),
      path.resolve(__dirname, "corpus"),
      path.resolve(__dirname, "../../app/api/chatbot/conversations/[id]/knowledge")
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir) && fs.existsSync(path.join(dir, "documents.json"))) {
        return dir;
      }
    }
    return candidates[0];
  }

  private loadCorpus(): void {
    if (this.initialized) return;

    try {
      const corpusDir = this.resolveCorpusDir();
      if (!fs.existsSync(corpusDir)) {
        this.initialized = true;
        return;
      }

      // 1. Documents
      const docsPath = path.join(corpusDir, "documents.json");
      if (fs.existsSync(docsPath)) {
        const raw = JSON.parse(fs.readFileSync(docsPath, "utf-8"));
        const docList: CorpusDocument[] = raw.documents || [];
        for (const doc of docList) {
          this.documents.set(doc.document_id, doc);
        }
      }

      // 2. Chunks (from knowledge_chunks.jsonl or knowledge_base.json)
      const chunksPath = path.join(corpusDir, "knowledge_chunks.jsonl");
      if (fs.existsSync(chunksPath)) {
        const lines = fs.readFileSync(chunksPath, "utf-8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed) as CorpusChunk;
            // Exclude off-topic doc_0007 as documented in the knowledge guide
            if (chunk.document_id === "doc_0007") continue;
            this.chunks.push(chunk);
            this.chunksById.set(chunk.chunk_id, chunk);

            const cat = (chunk.category || "general").toLowerCase();
            if (!this.chunksByCategory.has(cat)) {
              this.chunksByCategory.set(cat, []);
            }
            this.chunksByCategory.get(cat)!.push(chunk);
          } catch {
            // skip malformed line
          }
        }
      } else {
        const kbPath = path.join(corpusDir, "knowledge_base.json");
        if (fs.existsSync(kbPath)) {
          const raw = JSON.parse(fs.readFileSync(kbPath, "utf-8"));
          const chunks = raw.chunks || [];
          for (const chunk of chunks) {
            if (chunk.document_id === "doc_0007") continue;
            this.chunks.push(chunk);
            this.chunksById.set(chunk.chunk_id, chunk);
            const cat = (chunk.category || "general").toLowerCase();
            if (!this.chunksByCategory.has(cat)) {
              this.chunksByCategory.set(cat, []);
            }
            this.chunksByCategory.get(cat)!.push(chunk);
          }
        }
      }

      // 3. Glossary
      const glossaryPath = path.join(corpusDir, "glossary.json");
      if (fs.existsSync(glossaryPath)) {
        const raw = JSON.parse(fs.readFileSync(glossaryPath, "utf-8"));
        const list: GlossaryEntry[] = raw.glossary || raw || [];
        for (const item of list) {
          this.glossary.set(normalize(item.term), item);
        }
      }

      // 4. Contradictions
      const contradictionsPath = path.join(corpusDir, "contradictions.json");
      if (fs.existsSync(contradictionsPath)) {
        const raw = JSON.parse(fs.readFileSync(contradictionsPath, "utf-8"));
        this.contradictions = raw.contradictions || [];
        for (const contra of this.contradictions) {
          this.contradictionsById.set(contra.contradiction_id, contra);
        }
      }

      // 5. Relationships
      const relationshipsPath = path.join(corpusDir, "relationships.json");
      if (fs.existsSync(relationshipsPath)) {
        const raw = JSON.parse(fs.readFileSync(relationshipsPath, "utf-8"));
        this.relationships = raw.relationships || [];
      }

      this.initialized = true;
    } catch (err) {
      console.error("Error loading knowledge corpus:", err);
      this.initialized = true;
    }
  }

  public listDocuments(): CorpusDocument[] {
    return Array.from(this.documents.values()).filter(d => d.in_retrieval_index);
  }

  public getDocument(id: string): CorpusDocument | undefined {
    return this.documents.get(id);
  }

  public getChunk(id: string): CorpusChunk | undefined {
    return this.chunksById.get(id);
  }

  public getContradictions(): ContradictionEntry[] {
    return this.contradictions;
  }

  public getGlossaryTerm(term: string): GlossaryEntry | undefined {
    const key = normalize(term);
    if (this.glossary.has(key)) return this.glossary.get(key);
    for (const [k, v] of this.glossary.entries()) {
      if (k.includes(key) || key.includes(k)) return v;
    }
    return undefined;
  }

  public searchGlossary(tokens: string[]): GlossaryEntry[] {
    const matches: GlossaryEntry[] = [];
    const seen = new Set<string>();
    for (const token of tokens) {
      if (token.length < 3) continue;
      for (const [key, entry] of this.glossary.entries()) {
        if (!seen.has(entry.glossary_id) && key.includes(token)) {
          seen.add(entry.glossary_id);
          matches.push(entry);
          if (matches.length >= 8) break;
        }
      }
      if (matches.length >= 8) break;
    }
    return matches;
  }

  public searchChunks(options: {
    query?: string;
    methodology?: string;
    category?: string;
    limit?: number;
    includeAdjacent?: boolean;
  }): RetrievedChunk[] {
    const { query = "", methodology, category, limit = 5, includeAdjacent = false } = options;
    const normMethodology = methodology ? methodology.toUpperCase() : undefined;
    const allowedCategories = normMethodology ? METHODOLOGY_CATEGORY_MAP[normMethodology] : undefined;
    const tokens = tokenize(query);

    const scored: { chunk: CorpusChunk; score: number }[] = [];

    for (const chunk of this.chunks) {
      if (chunk.chunk_role === "administrative") continue;

      let score = 0;
      const chunkCat = (chunk.category || "").toLowerCase();
      const secCats = (chunk.secondary_categories || []).map(c => c.toLowerCase());

      // Methodology category alignment
      if (allowedCategories) {
        if (allowedCategories.includes(chunkCat)) {
          score += 15;
        } else if (secCats.some(c => allowedCategories.includes(c))) {
          score += 8;
        } else if (tokens.length === 0) {
          // If no query and category doesn't match methodology, skip
          continue;
        }
      }

      // Explicit category filter
      if (category && chunkCat !== category.toLowerCase()) {
        continue;
      }

      if (tokens.length > 0) {
        const normContent = normalize(chunk.content);
        const normContext = normalize(chunk.context);
        const normTitle = normalize(chunk.section_title);
        const keywords = (chunk.keywords || []).filter(Boolean).map(normalize);
        const entities = (chunk.entities || []).filter(e => e && e.name).map(e => normalize(e.name));

        let tokenMatches = 0;
        for (const token of tokens) {
          let tokenHit = false;
          // Entity match
          if (entities.some(e => e.includes(token))) {
            score += 10;
            tokenHit = true;
          }
          // Keyword match
          if (keywords.some(k => k.includes(token))) {
            score += 6;
            tokenHit = true;
          }
          // Title / context match
          if (normTitle.includes(token) || normContext.includes(token)) {
            score += 6;
            tokenHit = true;
          }
          // Content match
          if (normContent.includes(token)) {
            score += 2;
            tokenHit = true;
          }
          if (tokenHit) tokenMatches++;
        }

        if (tokenMatches === 0 && !allowedCategories) {
          continue;
        }
      }

      // Boost by source reliability
      if (chunk.source_reliability === "primary_official") score *= 1.25;
      else if (chunk.source_reliability === "primary_book") score *= 1.15;
      else if (chunk.source_reliability === "secondary_vendor") score *= 0.95;

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    return top.map(({ chunk, score }) => {
      const doc = this.documents.get(chunk.document_id);
      const docTitle = doc ? doc.title : chunk.document_id;
      const citation = `[${docTitle}, p. ${chunk.page_start}]`;

      // Check if chunk has contradiction notes
      let contradiction: ContradictionEntry | undefined;
      const notes = chunk.quality?.notes || [];
      for (const note of notes) {
        const match = note.match(/contra_\d+/);
        if (match && this.contradictionsById.has(match[0])) {
          contradiction = this.contradictionsById.get(match[0]);
          break;
        }
      }

      return {
        chunk,
        documentTitle: docTitle,
        relevanceScore: Math.round(score * 10) / 10,
        citation,
        notes: notes.length ? notes : undefined,
        contradiction
      };
    });
  }

  public getKnowledgeForProject(options: {
    methodology: string;
    phase?: string;
    query?: string;
    projectState?: {
      blockedCount?: number;
      overdueCount?: number;
      riskCount?: number;
      issuesCount?: number;
    };
  }): ProjectKnowledgeBase {
    const { methodology, query = "" } = options;
    const strategy = getStrategy(methodology);
    const normMeth = (methodology || "AGILE").toUpperCase();

    // 1. Core Chunks for this Methodology & Query
    const topChunks = this.searchChunks({
      methodology: normMeth,
      query: query || strategy.name,
      limit: 4
    });

    // 2. Glossary entries matching methodology keywords and query
    const searchTokens = [...tokenize(query), ...tokenize(strategy.name), normMeth.toLowerCase()];
    const glossary = this.searchGlossary(searchTokens);

    // 3. Contradictions relevant to this methodology
    const contradictions = this.contradictions.filter(c => {
      const topic = normalize(c.topic + " " + c.issue);
      return (
        topic.includes(normMeth.toLowerCase()) ||
        searchTokens.some(t => t.length > 3 && topic.includes(t))
      );
    });

    // 4. Artifacts from Sanzu Knowledge Modules
    const applicableChecklists = KnowledgeService.listChecklists({ methodology: normMeth }).map(c => c.name);
    const applicableTemplates = KnowledgeService.listTemplates({ methodology: normMeth }).map(t => t.name);
    const applicableProcesses = KnowledgeService.listProcesses({ methodology: normMeth }).map(p => p.name);

    return {
      methodology: normMeth,
      methodologyOverview: strategy.description,
      corePrinciples: strategy.principles.length ? strategy.principles : strategy.rules,
      governanceRules: strategy.rules,
      topChunks,
      glossary,
      applicableChecklists,
      applicableTemplates,
      applicableProcesses,
      contradictions
    };
  }
}

export const corpusService = CorpusService.getInstance();
