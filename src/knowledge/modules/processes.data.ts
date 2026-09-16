import { ProcessDefinition } from "../types";

export const processDefinitions: ProcessDefinition[] = [
  {
    id: "sprint-lifecycle",
    name: "Sprint Lifecycle Process",
    description: "Ciclo completo de iteración Scrum desde el refinamiento y planificación hasta la retrospectiva.",
    version: "2.0.0",
    methodologies: ["SCRUM", "HYBRID"],
    ownerRole: "SCRUM_MASTER",
    trigger: "Inicio programado de un nuevo ciclo de desarrollo de 2 semanas.",
    keyPerformanceIndicators: ["Sprint Goal Success Rate", "Velocity Stability", "Say-Do Ratio"],
    associatedChecklists: ["definition-of-ready", "definition-of-done", "sprint-review-checklist"],
    associatedTemplates: ["sprint-planning", "user-story"],
    phases: [
      {
        step: 1,
        name: "Refinamiento de Backlog",
        description: "El Product Owner y el equipo aclaran requerimientos y validan el Definition of Ready.",
        responsibleRoles: ["PRODUCT_OWNER", "DEVELOPER"],
        accountableRole: "PRODUCT_OWNER",
        inputs: ["Ideas de producto", "Feedback de clientes", "Historias en borrador"],
        outputs: ["Historias estimadas listas para planificar", "Criterios de aceptación detallados"],
        activities: ["Dividir historias grandes", "Estimar con Planning Poker", "Verificar criterios DoR"],
        exitCriteria: ["Al menos 1.5 Sprints de trabajo cumplen con Definition of Ready"],
        bestPractices: [
          "Mantener la sesión limitada a máximo 1 hora por semana.",
          "Priorizar el backlog antes de la llamada de refinamiento."
        ],
        potentialBottlenecks: [
          "Dependencias externas no identificadas tempranamente.",
          "Falta de disponibilidad del Product Owner para resolver dudas de negocio."
        ]
      },
      {
        step: 2,
        name: "Sprint Planning",
        description: "Compromiso colectivo sobre el Sprint Goal y desglose de tareas técnicas.",
        responsibleRoles: ["PRODUCT_OWNER", "SCRUM_MASTER", "DEVELOPER"],
        accountableRole: "SCRUM_MASTER",
        inputs: ["Backlog refinado", "Capacidad disponible del equipo"],
        outputs: ["Sprint Goal oficial", "Sprint Backlog con tareas asignadas"],
        activities: ["Presentar prioridades", "Acordar Sprint Goal", "Desglosar historias en tareas"],
        exitCriteria: ["Sprint Backlog confirmado en estado PLANNED y Sprint Goal publicado"],
        bestPractices: [
          "Enfocar el objetivo en impacto de valor, no en una simple lista de tareas.",
          "Considerar tiempo libre, vacaciones o deuda técnica en el cálculo de capacidad."
        ]
      },
      {
        step: 3,
        name: "Ejecución Diaria e Inspección",
        description: "Desarrollo iterativo guiado por sincronizaciones de 15 minutos (Daily Scrum).",
        responsibleRoles: ["DEVELOPER", "SCRUM_MASTER"],
        accountableRole: "DEVELOPER",
        inputs: ["Sprint Backlog"],
        outputs: ["Incremento de código", "Tablero de tareas actualizado"],
        activities: ["Daily Scrum", "Identificación proactiva de bloqueos", "Desarrollo y pruebas"],
        exitCriteria: ["Todas las tareas pasan a DONE cumpliendo con el Definition of Done"],
        bestPractices: [
          "Marcar inmediatamente cualquier tarea bloqueada en el tablero con estado BLOCKED.",
          "Resolver impedimentos en reuniones separadas (16th minute) para no extender el Daily."
        ]
      },
      {
        step: 4,
        name: "Sprint Review y Retrospectiva",
        description: "Demostración del incremento a stakeholders e inspección de dinámicas de equipo.",
        responsibleRoles: ["PRODUCT_OWNER", "SCRUM_MASTER", "DEVELOPER", "STAKEHOLDER"],
        accountableRole: "SCRUM_MASTER",
        inputs: ["Incremento funcional finalizado"],
        outputs: ["Feedback de stakeholders", "Plan de mejora para el siguiente Sprint"],
        activities: ["Demo en vivo", "Recolección de feedback", "Retrospectiva del equipo"],
        exitCriteria: ["Sprint cerrado en el sistema y plan de mejora registrado"],
        bestPractices: [
          "Demostrar únicamente funcionalidades que cumplan 100% el Definition of Done.",
          "Registrar un máximo de 2 acciones de mejora concretas por retrospectiva."
        ]
      }
    ]
  },
  {
    id: "risk-management",
    name: "Continuous Risk Management Process",
    description: "Identificación periódica, cálculo de exposición, mitigación y seguimiento de contingencias.",
    version: "2.0.0",
    methodologies: ["WATERFALL", "SCRUM", "AGILE", "HYBRID", "LEAN"],
    ownerRole: "PROJECT_MANAGER",
    trigger: "Planificación de fase, cambio de alcance o detección de impedimentos críticos.",
    keyPerformanceIndicators: ["Total Exposure Score", "Open High Risks Count", "Mitigation Closure Time"],
    associatedChecklists: ["security-compliance-checklist"],
    associatedTemplates: ["project-charter"],
    phases: [
      {
        step: 1,
        name: "Identificación de Riesgos",
        description: "Relevamiento de amenazas técnicas, organizacionales o de cronograma.",
        responsibleRoles: ["PROJECT_MANAGER", "DEVELOPER", "STAKEHOLDER"],
        accountableRole: "PROJECT_MANAGER",
        inputs: ["Arquitectura", "Dependencias externas", "Requerimientos"],
        outputs: ["Registro de riesgos preliminar"],
        activities: ["Sesión de lluvia de ideas", "Análisis de lecciones aprendidas"],
        exitCriteria: ["Riesgos registrados con título y descripción clara"]
      },
      {
        step: 2,
        name: "Evaluación Cuantitativa y Cualitativa",
        description: "Asignación de probabilidad e impacto para obtener la severidad.",
        responsibleRoles: ["PROJECT_MANAGER"],
        accountableRole: "PROJECT_MANAGER",
        inputs: ["Registro de riesgos"],
        outputs: ["Matriz de riesgos calculada"],
        activities: ["Puntuación de probabilidad e impacto", "Ordenamiento por severidad descendente"],
        exitCriteria: ["Todos los riesgos cuentan con puntuación de severidad válida"]
      },
      {
        step: 3,
        name: "Planificación de Mitigación",
        description: "Asignación de responsables y medidas preventivas o correctivas.",
        responsibleRoles: ["PROJECT_MANAGER", "OWNER"],
        accountableRole: "PROJECT_MANAGER",
        inputs: ["Riesgos de severidad media y alta"],
        outputs: ["Acciones de mitigación con fechas compromiso"],
        activities: ["Definir plan de contingencia", "Asignar owner al riesgo"],
        exitCriteria: ["Riesgos abiertos con severidad >= 8 cuentan con mitigación documentada"]
      }
    ]
  },
  {
    id: "release-management",
    name: "Production Release Process",
    description: "Proceso estandarizado de empaquetado, pruebas de regresión, pase a producción y verificación post-deploy.",
    version: "2.0.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "WATERFALL", "HYBRID"],
    ownerRole: "PROJECT_MANAGER",
    trigger: "Aprobación de candidatos de versión para despliegue en entorno productivo.",
    keyPerformanceIndicators: ["Change Failure Rate", "Deployment Frequency", "Mean Time to Recover"],
    associatedChecklists: ["release-readiness-checklist", "security-compliance-checklist"],
    associatedTemplates: ["architecture-decision-record"],
    phases: [
      {
        step: 1,
        name: "Verificación de Entregables (Staging Freeze)",
        description: "Congelamiento de código candidado y ejecución de pruebas automatizadas.",
        responsibleRoles: ["DEVELOPER", "TESTER"],
        accountableRole: "DEVELOPER",
        inputs: ["Rama release", "Changelog preliminar"],
        outputs: ["Reporte de tests de regresión satisfactorio"],
        activities: ["Ejecución de suite E2E", "Verificación de migraciones de base de datos"],
        exitCriteria: ["Cero defectos críticos o bloqueantes abiertos"]
      },
      {
        step: 2,
        name: "Aprobación y Despliegue",
        description: "Ejecución del pipeline de despliegue con estrategia canary o blue-green.",
        responsibleRoles: ["DEVELOPER", "PROJECT_MANAGER"],
        accountableRole: "PROJECT_MANAGER",
        inputs: ["Release checklist firmado"],
        outputs: ["Versión desplegada en producción"],
        activities: ["Backup preventivo", "Despliegue automatizado", "Smoke testing"],
        exitCriteria: ["Health check productivo con respuesta exitosa 200"]
      },
      {
        step: 3,
        name: "Monitoreo y Cierre",
        description: "Seguimiento de métricas de telemetría y comunicación a usuarios.",
        responsibleRoles: ["DEVELOPER", "PROJECT_MANAGER"],
        accountableRole: "PROJECT_MANAGER",
        inputs: ["Dashboards de monitoreo", "Logs de aplicación"],
        outputs: ["Acta de pase a producción exitosa"],
        activities: ["Inspección de logs de error durante 60 minutos", "Publicación de notas de versión"],
        exitCriteria: ["Tasa de errores dentro del margen de operación normal"]
      }
    ]
  }
];
