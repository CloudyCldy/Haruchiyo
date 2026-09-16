export type KnowledgeCategory = "DOCUMENTATION" | "METHODOLOGY" | "TEMPLATE" | "PROCESS" | "CHECKLIST";

export interface DocumentationSection {
  id: string;
  title: string;
  level: number;
  content: string;
  keyPoints?: string[];
}

export interface DocumentationItem {
  id: string;
  title: string;
  category: "OVERVIEW" | "STANDARDS" | "GOVERNANCE" | "ARCHITECTURE" | "SECURITY";
  version: string;
  summary: string;
  targetAudience: string[];
  tags: string[];
  sections: DocumentationSection[];
  content: string;
  relatedMethodologies: string[];
  updatedAt: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "multiline" | "list" | "number" | "date" | "select";
  required: boolean;
  description: string;
  placeholder?: string;
  options?: string[];
  validationRules?: string[];
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  order: number;
  fields: TemplateField[];
  guidanceText?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  methodologies: string[];
  category: "PLANNING" | "EXECUTION" | "QUALITY" | "ARCHITECTURE" | "REVIEW";
  sections: TemplateSection[];
  fields: TemplateField[];
  markdownTemplate: string;
  exampleFilledContent?: string;
  suggestedFileNaming?: string;
}

export interface ProcessPhase {
  step: number;
  name: string;
  description: string;
  responsibleRoles: string[];
  accountableRole?: string;
  inputs: string[];
  outputs: string[];
  activities: string[];
  exitCriteria: string[];
  bestPractices?: string[];
  potentialBottlenecks?: string[];
}

export interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  methodologies: string[];
  ownerRole: string;
  trigger: string;
  phases: ProcessPhase[];
  keyPerformanceIndicators: string[];
  associatedChecklists: string[];
  associatedTemplates: string[];
}

export interface ChecklistItem {
  id: string;
  section?: string;
  text: string;
  description?: string;
  isMandatory: boolean;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  suggestedActionIfFailed?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  description: string;
  order: number;
  items: ChecklistItem[];
}

export interface ChecklistDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  methodologies: string[];
  stage: "READY" | "DONE" | "REVIEW" | "RELEASE" | "SECURITY";
  sections: ChecklistSection[];
  items: ChecklistItem[];
}

export interface ChecklistEvaluationInput {
  checklistId: string;
  itemStatuses: Record<string, boolean>;
}

export interface ChecklistEvaluationResult {
  checklistId: string;
  checklistName: string;
  totalItems: number;
  completedItems: number;
  completionRate: number;
  isPassed: boolean;
  unmetMandatoryCount: number;
  unmetItems: ChecklistItem[];
  recommendations: string[];
  sectionBreakdown: {
    sectionId: string;
    sectionTitle: string;
    total: number;
    completed: number;
    completionRate: number;
    isPassed: boolean;
  }[];
}
