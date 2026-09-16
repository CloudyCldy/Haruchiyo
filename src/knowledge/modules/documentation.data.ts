import { DocumentationItem } from "../types";

export const documentationItems: DocumentationItem[] = [
  {
    id: "project-lifecycle-standards",
    title: "Sanzu Project Lifecycle and Delivery Standards",
    category: "STANDARDS",
    version: "2.0.0",
    summary: "Guía de referencia sobre el ciclo de vida del proyecto, estándares de calidad y gobierno técnico.",
    targetAudience: ["Project Managers", "Tech Leads", "Developers"],
    tags: ["governance", "lifecycle", "quality", "methodology"],
    relatedMethodologies: ["SCRUM", "KANBAN", "XP", "LEAN", "WATERFALL", "HYBRID"],
    updatedAt: "2026-09-15",
    sections: [
      {
        id: "vision-purpose",
        title: "1. Vision and Purpose",
        level: 2,
        content: "Sanzu provee una API de gobernanza de proyectos y asistencia predictiva por IA. Esta guía define los estándares operativos indispensables para asegurar trazabilidad, calidad y control de deuda técnica en los proyectos gestionados.",
        keyPoints: [
          "API determinística y autónoma sin dependencia obligatoria de proveedores de IA externos.",
          "Estandarización de flujos de trabajo orientada a clientes como Haitani."
        ]
      },
      {
        id: "methodology-alignment",
        title: "2. Methodology Alignment",
        level: 2,
        content: "Todo proyecto debe tener asignada explícitamente una estrategia metodológica registrada (Scrum, Kanban, XP, Lean, Waterfall o Hybrid). La metodología define las métricas vigentes, las reglas de compliance y los artefactos obligatorios.",
        keyPoints: [
          "Scrum exige Sprint Goal, DoD y ceremonias de inspección.",
          "Kanban exige visualización y límites de trabajo en curso (WIP).",
          "Waterfall exige aprobación formal y secuencial de fases."
        ]
      },
      {
        id: "work-items-tracking",
        title: "3. Mandatory Work Items Tracking",
        level: 2,
        content: "Todo entregable debe originarse en un BacklogItem priorizado. Las tareas en curso deben reflejar dependencias y bloqueos de forma inmediata. Riesgos e incidentes deben contar con severidad, impacto y asignatario antes de pasar a estado activo.",
        keyPoints: [
          "Registro inmediato de dependencias y estados BLOCKED.",
          "Atribución de criticidad e impacto en todo incidente detectado."
        ]
      },
      {
        id: "dor-dod-gateways",
        title: "4. Definition of Ready (DoR) and Done (DoD)",
        level: 2,
        content: "Ninguna tarea puede iniciar sin cumplir con el DoR acordado, ni considerarse terminada sin superar los criterios establecidos en el DoD.",
        keyPoints: [
          "DoR asegura independencia, valor y criterios Gherkin claros.",
          "DoD asegura pruebas unitarias, typecheck y revisión por pares aprobada."
        ]
      }
    ],
    content: `# Sanzu Project Lifecycle and Delivery Standards

## 1. Vision and Purpose
Sanzu provee una API de gobernanza de proyectos y asistencia predictiva por IA. Esta guía define los estándares operativos indispensables para asegurar trazabilidad, calidad y control de deuda técnica en los proyectos gestionados.

## 2. Methodology Alignment
Todo proyecto debe tener asignada explícitamente una estrategia metodológica registrada (Scrum, Kanban, XP, Lean, Waterfall o Hybrid). La metodología define las métricas vigentes, las reglas de compliance y los artefactos obligatorios.

## 3. Mandatory Work Items Tracking
- Todo entregable debe originarse en un BacklogItem priorizado.
- Las tareas en curso deben reflejar dependencias y bloqueos de forma inmediata.
- Riesgos e incidentes deben contar con severidad, impacto y asignatario asignado antes de pasar a estado activo.

## 4. Definition of Ready (DoR) and Done (DoD)
Ninguna tarea puede iniciar sin cumplir con el DoR acordado, ni considerarse terminada sin superar los criterios establecidos en el DoD.`
  },
  {
    id: "risk-and-issue-governance",
    title: "Risk and Issue Management Framework",
    category: "GOVERNANCE",
    version: "2.0.0",
    summary: "Protocolo para la identificación, evaluación de severidad y mitigación proactiva de riesgos e incidentes.",
    targetAudience: ["Project Managers", "Scrum Masters", "Stakeholders"],
    tags: ["risk", "issues", "mitigation", "severity"],
    relatedMethodologies: ["WATERFALL", "SCRUM", "AGILE", "HYBRID"],
    updatedAt: "2026-09-15",
    sections: [
      {
        id: "risk-matrix",
        title: "1. Classification Matrix",
        level: 2,
        content: "Probabilidad: LOW (1), MEDIUM (2), HIGH (3). Impacto: LOW (1), MEDIUM (2), HIGH (3), CRITICAL (4). Severidad calculada de 1 a 12 mediante Probabilidad x Impacto.",
        keyPoints: [
          "Severidad 1-3: Baja exposición, monitoreo pasivo.",
          "Severidad 4-7: Media exposición, revisión semanal en sprint planning.",
          "Severidad 8-12: Alta exposición, mitigación obligatoria con responsable único."
        ]
      },
      {
        id: "incident-protocol",
        title: "2. Incident Response Escalation",
        level: 2,
        content: "Cualquier issue en estado CRITICAL suspende transiciones de release y requiere la formación inmediata de un squad de contingencia.",
        keyPoints: [
          "Notificación automática en el análisis de salud del proyecto.",
          "Replanificación inmediata si compromete el Sprint Goal o hito clave."
        ]
      }
    ],
    content: `# Risk and Issue Management Framework

## 1. Classification
- Probabilidad: LOW, MEDIUM, HIGH.
- Impacto: LOW, MEDIUM, HIGH, CRITICAL.
- Severidad Calculada: Escala de 1 a 12 según matriz Probabilidad x Impacto.

## 2. Response Protocols
- Riesgos con severidad >= 8 exigen plan de contingencia documentado en menos de 24 horas.
- Issues con severidad CRITICAL activan alerta inmediata al Project Manager y reasignación prioritaria de recursos.`
  }
];
