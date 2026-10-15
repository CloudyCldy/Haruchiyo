export interface CorpusDocument {
  document_id: string;
  filename: string;
  original_path?: string;
  title: string;
  subtitle?: string | null;
  authors?: string[];
  corporate_authors?: string[];
  publisher?: string | null;
  language: string;
  doc_type?: string;
  source_reliability: string;
  reliability_note?: string;
  in_retrieval_index: boolean;
  page_count: number;
  word_count?: number;
  char_count?: number;
}

export interface CorpusChunkEntity {
  name: string;
  type: string;
  mentions: number;
}

export interface CorpusChunkTable {
  page: number;
  header: string[];
  rows: string[][];
}

export interface CorpusChunk {
  chunk_id: string;
  document_id: string;
  section_title: string;
  section_path: string[];
  sections_covered?: string[];
  page_start: number;
  page_end: number;
  content: string;
  summary?: string | null;
  topic?: string;
  subtopics?: string[];
  keywords: string[];
  language: string;
  source_type?: string;
  source_location: string;
  category: string;
  secondary_categories: string[];
  content_type?: string;
  chunk_role: "content" | "bibliography" | "administrative";
  context: string;
  entities: CorpusChunkEntity[];
  relationships?: string[];
  source_reliability: string;
  fictional_data?: boolean;
  approx_tokens?: number;
  content_hash?: string;
  prev_chunk_id?: string | null;
  next_chunk_id?: string | null;
  tables?: CorpusChunkTable[];
  quality?: {
    needs_review?: boolean;
    notes?: string[];
  };
}

export interface GlossaryEntry {
  glossary_id: string;
  term: string;
  definition: string;
  definition_type: string;
  document_id: string;
  page: number;
  chunk_id?: string;
  needs_review?: boolean;
}

export interface ContradictionEvidence {
  document_id: string;
  filename: string;
  page: number;
  chunk_id: string;
  excerpt: string;
  source_location: string;
}

export interface ContradictionEntry {
  contradiction_id: string;
  topic: string;
  kind: string;
  issue: string;
  evidence: ContradictionEvidence[];
  evidence_complete?: boolean;
  recommendation?: string;
  resolved: boolean;
  identification_method?: string;
}

export interface RelationshipEntry {
  relationship_id: string;
  source: string;
  relation: string;
  target: string;
  support_chunk_count: number;
  evidence_chunk_ids?: string[];
}

export interface RetrievedChunk {
  chunk: CorpusChunk;
  documentTitle: string;
  relevanceScore: number;
  citation: string;
  notes?: string[];
  contradiction?: ContradictionEntry;
}

export interface ProjectKnowledgeBase {
  methodology: string;
  methodologyOverview: string;
  corePrinciples: string[];
  governanceRules: string[];
  topChunks: RetrievedChunk[];
  glossary: GlossaryEntry[];
  applicableChecklists: string[];
  applicableTemplates: string[];
  applicableProcesses: string[];
  contradictions: ContradictionEntry[];
}
