export type DictionaryCategory =
  | "gestion_proyectos"
  | "scrum_agile"
  | "kanban_lean"
  | "xp_practicas"
  | "ingenieria_software"
  | "programacion_arquitectura"
  | "apis_integraciones"
  | "bases_datos"
  | "git_devops"
  | "qa_testing"
  | "seguridad"
  | "cloud_despliegues"
  | "metricas_analisis"
  | "riesgos_incidencias"
  | "colaboracion_equipos";

export interface DictionaryTranslations {
  es: string;
  en: string;
}

export interface DictionaryEntry {
  id: string;
  term: string;
  synonyms: string[];
  definition: string;
  beginnerExplanation: string;
  category: DictionaryCategory;
  example: string;
  relatedConcepts: string[];
  recommendations: string[];
  translations: DictionaryTranslations;
  searchVariants: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DictionarySearchParams {
  q?: string;
  category?: string;
  mode?: "beginner" | "technical" | "full";
  page?: number;
  limit?: number;
}

export interface DictionarySearchResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: DictionaryEntry[];
}
