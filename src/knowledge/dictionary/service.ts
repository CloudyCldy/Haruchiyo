import { initialDictionaryEntries } from "./entries";
import { DictionaryCategory, DictionaryEntry, DictionarySearchParams, DictionarySearchResult } from "./types";

function normalizeString(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class DictionaryService {
  private static instance: DictionaryService | null = null;
  private entries: Map<string, DictionaryEntry> = new Map();
  private entriesByNormalizedTerm: Map<string, DictionaryEntry> = new Map();
  private synonymIndex: Map<string, DictionaryEntry> = new Map();

  private constructor() {
    this.loadEntries(initialDictionaryEntries);
  }

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  private loadEntries(entries: DictionaryEntry[]): void {
    for (const entry of entries) {
      this.indexEntry(entry);
    }
  }

  private indexEntry(entry: DictionaryEntry): void {
    const id = entry.id.toLowerCase();
    this.entries.set(id, entry);

    const normTerm = normalizeString(entry.term);
    this.entriesByNormalizedTerm.set(normTerm, entry);

    // Index synonyms and abbreviations
    for (const syn of entry.synonyms || []) {
      const normSyn = normalizeString(syn);
      if (normSyn) {
        this.synonymIndex.set(normSyn, entry);
      }
    }

    // Index search variants
    for (const variant of entry.searchVariants || []) {
      const normVar = normalizeString(variant);
      if (normVar) {
        this.synonymIndex.set(normVar, entry);
      }
    }

    // Index English and Spanish translations
    if (entry.translations) {
      const normEs = normalizeString(entry.translations.es);
      const normEn = normalizeString(entry.translations.en);
      if (normEs) this.synonymIndex.set(normEs, entry);
      if (normEn) this.synonymIndex.set(normEn, entry);
    }
  }

  public getById(id: string): DictionaryEntry | undefined {
    return this.entries.get(id.toLowerCase());
  }

  public getByExactTermOrSynonym(query: string): DictionaryEntry | undefined {
    const norm = normalizeString(query);
    if (!norm) return undefined;

    // Check direct normalized term
    if (this.entriesByNormalizedTerm.has(norm)) {
      return this.entriesByNormalizedTerm.get(norm);
    }

    // Check ID match
    if (this.entries.has(norm)) {
      return this.entries.get(norm);
    }

    // Check synonyms, searchVariants, translations
    if (this.synonymIndex.has(norm)) {
      return this.synonymIndex.get(norm);
    }

    return undefined;
  }

  public search(params: DictionarySearchParams = {}): DictionarySearchResult {
    const { q, category, mode = "full", page = 1, limit = 20 } = params;
    const cleanQ = normalizeString(q);
    const cleanCat = category ? String(category).toLowerCase().trim() : undefined;

    let matched: Array<{ entry: DictionaryEntry; score: number }> = [];

    for (const entry of this.entries.values()) {
      // Category filter
      if (cleanCat && entry.category.toLowerCase() !== cleanCat) {
        continue;
      }

      if (!cleanQ) {
        matched.push({ entry, score: 1 });
        continue;
      }

      let score = 0;
      const normTerm = normalizeString(entry.term);
      const normId = normalizeString(entry.id);

      // 1. Exact match on term or ID
      if (normTerm === cleanQ || normId === cleanQ) {
        score += 100;
      } else if (normTerm.startsWith(cleanQ)) {
        score += 60;
      } else if (normTerm.includes(cleanQ)) {
        score += 40;
      }

      // 2. Synonyms and abbreviations match
      for (const syn of entry.synonyms) {
        const normSyn = normalizeString(syn);
        if (normSyn === cleanQ) {
          score += 80;
        } else if (normSyn.includes(cleanQ)) {
          score += 30;
        }
      }

      // 3. Search variants match
      for (const variant of entry.searchVariants) {
        const normVar = normalizeString(variant);
        if (normVar === cleanQ) {
          score += 70;
        } else if (normVar.includes(cleanQ)) {
          score += 25;
        }
      }

      // 4. Translations match
      if (entry.translations) {
        if (normalizeString(entry.translations.es) === cleanQ || normalizeString(entry.translations.en) === cleanQ) {
          score += 60;
        }
      }

      // 5. Definition / Beginner explanation partial match
      const normDef = normalizeString(entry.definition);
      const normBeginner = normalizeString(entry.beginnerExplanation);
      if (normDef.includes(cleanQ) || normBeginner.includes(cleanQ)) {
        score += 15;
      }

      if (score > 0) {
        matched.push({ entry, score });
      }
    }

    // Sort by relevance score descending
    matched.sort((a, b) => b.score - a.score);

    const total = matched.length;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginated = matched.slice(startIndex, startIndex + safeLimit).map(m => m.entry);

    // Apply mode transformation if beginner or technical requested
    const formatted = paginated.map(item => {
      if (mode === "beginner") {
        return {
          ...item,
          definition: item.beginnerExplanation,
          recommendations: item.recommendations.slice(0, 1)
        };
      }
      if (mode === "technical") {
        return {
          ...item,
          beginnerExplanation: item.definition
        };
      }
      return item;
    });

    return {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      items: formatted
    };
  }

  public getRelated(idOrTerm: string): DictionaryEntry[] {
    const entry = this.getById(idOrTerm) || this.getByExactTermOrSynonym(idOrTerm);
    if (!entry) return [];

    const related: DictionaryEntry[] = [];
    for (const relId of entry.relatedConcepts || []) {
      const relEntry = this.getById(relId) || this.getByExactTermOrSynonym(relId);
      if (relEntry && relEntry.id !== entry.id) {
        related.push(relEntry);
      }
    }
    return related;
  }

  public addEntry(entry: DictionaryEntry): DictionaryEntry {
    const sanitizedId = normalizeString(entry.id || entry.term).replace(/\s+/g, "-");
    const newEntry: DictionaryEntry = {
      ...entry,
      id: sanitizedId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.indexEntry(newEntry);
    return newEntry;
  }

  public getAllCategories(): DictionaryCategory[] {
    const cats = new Set<DictionaryCategory>();
    for (const entry of this.entries.values()) {
      cats.add(entry.category);
    }
    return Array.from(cats);
  }

  public count(): number {
    return this.entries.size;
  }
}

export const dictionaryService = DictionaryService.getInstance();
