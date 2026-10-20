import { checklistDefinitions, documentationItems, processDefinitions, templateDefinitions } from "./data";
import {
  ChecklistDefinition,
  ChecklistEvaluationInput,
  ChecklistEvaluationResult,
  DocumentationItem,
  ProcessDefinition,
  TemplateDefinition
} from "./types";
import { corpusService } from "./corpus.service";
import { dictionaryService } from "./dictionary/service";

export const KnowledgeService = {
  // Documentation
  listDocumentation(category?: string): DocumentationItem[] {
    if (!category) return documentationItems;
    return documentationItems.filter(item => item.category.toUpperCase() === category.toUpperCase());
  },

  getDocumentation(id: string): DocumentationItem | undefined {
    return documentationItems.find(item => item.id === id);
  },

  // Templates
  listTemplates(filters?: { methodology?: string; category?: string }): TemplateDefinition[] {
    return templateDefinitions.filter(tmpl => {
      if (filters?.methodology && !tmpl.methodologies.includes(filters.methodology.toUpperCase())) {
        return false;
      }
      if (filters?.category && tmpl.category.toUpperCase() !== filters.category.toUpperCase()) {
        return false;
      }
      return true;
    });
  },

  getTemplate(id: string): TemplateDefinition | undefined {
    return templateDefinitions.find(tmpl => tmpl.id === id);
  },

  // Processes
  listProcesses(filters?: { methodology?: string }): ProcessDefinition[] {
    return processDefinitions.filter(proc => {
      if (filters?.methodology && !proc.methodologies.includes(filters.methodology.toUpperCase())) {
        return false;
      }
      return true;
    });
  },

  getProcess(id: string): ProcessDefinition | undefined {
    return processDefinitions.find(proc => proc.id === id);
  },

  // Checklists
  listChecklists(filters?: { methodology?: string; stage?: string }): ChecklistDefinition[] {
    return checklistDefinitions.filter(chk => {
      if (filters?.methodology && !chk.methodologies.includes(filters.methodology.toUpperCase())) {
        return false;
      }
      if (filters?.stage && chk.stage.toUpperCase() !== filters.stage.toUpperCase()) {
        return false;
      }
      return true;
    });
  },

  getChecklist(id: string): ChecklistDefinition | undefined {
    return checklistDefinitions.find(chk => chk.id === id);
  },

  evaluateChecklist(input: ChecklistEvaluationInput): ChecklistEvaluationResult {
    const checklist = this.getChecklist(input.checklistId);
    if (!checklist) {
      throw new Error(`Checklist with id "${input.checklistId}" not found`);
    }

    const totalItems = checklist.items.length;
    let completedItems = 0;
    const unmetItems = [];
    const recommendations: string[] = [];

    for (const item of checklist.items) {
      const isComplete = Boolean(input.itemStatuses[item.id]);
      if (isComplete) {
        completedItems += 1;
      } else {
        unmetItems.push(item);
        if (item.isMandatory) {
          const actionTip = item.suggestedActionIfFailed ? ` (${item.suggestedActionIfFailed})` : "";
          recommendations.push(`Completar requisito obligatorio: "${item.text}"${actionTip}`);
        }
      }
    }

    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
    const unmetMandatoryCount = unmetItems.filter(i => i.isMandatory).length;
    const isPassed = unmetMandatoryCount === 0;

    const sectionBreakdown = (checklist.sections || []).map(section => {
      const secTotal = section.items.length;
      let secCompleted = 0;
      let secMandatoryFail = 0;

      for (const item of section.items) {
        if (input.itemStatuses[item.id]) {
          secCompleted += 1;
        } else if (item.isMandatory) {
          secMandatoryFail += 1;
        }
      }

      return {
        sectionId: section.id,
        sectionTitle: section.title,
        total: secTotal,
        completed: secCompleted,
        completionRate: secTotal > 0 ? Math.round((secCompleted / secTotal) * 100) : 100,
        isPassed: secMandatoryFail === 0
      };
    });

    return {
      checklistId: checklist.id,
      checklistName: checklist.name,
      totalItems,
      completedItems,
      completionRate,
      isPassed,
      unmetMandatoryCount,
      unmetItems,
      recommendations,
      sectionBreakdown
    };
  },

  // Corpus & AI Knowledge Base
  searchCorpus(options: Parameters<typeof corpusService.searchChunks>[0]) {
    return corpusService.searchChunks(options);
  },

  getProjectKnowledge(options: Parameters<typeof corpusService.getKnowledgeForProject>[0]) {
    return corpusService.getKnowledgeForProject(options);
  },

  listCorpusDocuments() {
    return corpusService.listDocuments();
  },

  getCorpusDocument(id: string) {
    return corpusService.getDocument(id);
  },

  getCorpusChunk(id: string) {
    return corpusService.getChunk(id);
  },

  getCorpusGlossaryTerm(term: string) {
    return corpusService.getGlossaryTerm(term);
  },

  getCorpusContradictions() {
    return corpusService.getContradictions();
  },

  // Specialized Project Management and Software Engineering Dictionary
  searchDictionary(params?: Parameters<typeof dictionaryService.search>[0]) {
    return dictionaryService.search(params);
  },

  getDictionaryTerm(term: string) {
    return dictionaryService.getById(term) || dictionaryService.getByExactTermOrSynonym(term);
  },

  getRelatedDictionaryTerms(term: string) {
    return dictionaryService.getRelated(term);
  },

  addDictionaryEntry(entry: Parameters<typeof dictionaryService.addEntry>[0]) {
    return dictionaryService.addEntry(entry);
  }
};

