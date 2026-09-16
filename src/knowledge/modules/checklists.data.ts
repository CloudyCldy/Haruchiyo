import { ChecklistDefinition } from "../types";

export const checklistDefinitions: ChecklistDefinition[] = [
  {
    id: "definition-of-ready",
    name: "Definition of Ready (DoR)",
    description: "Criterios mínimos que debe cumplir un ítem de trabajo antes de ser planificado en un ciclo de desarrollo.",
    version: "2.1.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "HYBRID"],
    stage: "READY",
    sections: [
      {
        id: "clarity-and-value",
        title: "1. Claridad y Valor de Negocio",
        description: "Comprensión compartida del requerimiento y retorno de inversión.",
        order: 1,
        items: [
          {
            id: "dor-1",
            section: "clarity-and-value",
            text: "El título y la descripción explican claramente la necesidad y el valor de negocio.",
            description: "El formato sigue: Como [Rol], Quiero [Acción] Para [Beneficio].",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Alinear con el Product Owner para redactar el beneficio tangible antes de presentar la historia."
          },
          {
            id: "dor-2",
            section: "clarity-and-value",
            text: "Los criterios de aceptación están definidos en formato verificable (ej. Gherkin).",
            description: "Contiene escenarios Given/When/Then comprobables por QA.",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Añadir al menos un escenario de éxito y uno de contingencia en la plantilla de la historia."
          }
        ]
      },
      {
        id: "feasibility-and-sizing",
        title: "2. Factibilidad Técnica y Estimación",
        description: "Validación de dependencias externas, diseño y tamaño adecuado para la iteración.",
        order: 2,
        items: [
          {
            id: "dor-3",
            section: "feasibility-and-sizing",
            text: "Las dependencias técnicas o externas han sido identificadas y no bloquean el inicio.",
            description: "Endpoints de terceros, certificados o librerías listas.",
            isMandatory: true,
            criticality: "HIGH",
            suggestedActionIfFailed: "Crear un spike técnico o esperar a la liberación de la dependencia antes de planificar."
          },
          {
            id: "dor-4",
            section: "feasibility-and-sizing",
            text: "El ítem ha sido estimado en esfuerzo o puntos de historia por el equipo.",
            description: "Consenso alcanzado mediante Planning Poker u otra técnica.",
            isMandatory: true,
            criticality: "HIGH",
            suggestedActionIfFailed: "Llevar la historia a la sesión de refinamiento de backlog para votación del equipo."
          },
          {
            id: "dor-5",
            section: "feasibility-and-sizing",
            text: "Los prototipos UI/UX o especificaciones de diseño están adjuntos (si aplica).",
            description: "Figma o especificaciones validadas.",
            isMandatory: false,
            criticality: "MEDIUM",
            suggestedActionIfFailed: "Solicitar al diseñador UI/UX el enlace de Figma en los comentarios de la historia."
          },
          {
            id: "dor-6",
            section: "feasibility-and-sizing",
            text: "El ítem puede completarse dentro de un único Sprint según la capacidad del equipo.",
            description: "No excede el límite recomendado de puntos por historia (ej. máximo 8 puntos).",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Desglosar la historia en dos o más historias independientes más pequeñas."
          }
        ]
      }
    ],
    items: [
      { id: "dor-1", section: "clarity-and-value", text: "El título y la descripción explican claramente la necesidad y el valor de negocio.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Alinear con el Product Owner para redactar el beneficio tangible." },
      { id: "dor-2", section: "clarity-and-value", text: "Los criterios de aceptación están definidos en formato verificable (ej. Gherkin).", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Añadir escenarios Given/When/Then comprobables." },
      { id: "dor-3", section: "feasibility-and-sizing", text: "Las dependencias técnicas o externas han sido identificadas y no bloquean el inicio.", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Crear un spike técnico o esperar a la liberación de la dependencia." },
      { id: "dor-4", section: "feasibility-and-sizing", text: "El ítem ha sido estimado en esfuerzo o puntos de historia por el equipo.", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Llevar la historia a refinamiento de backlog." },
      { id: "dor-5", section: "feasibility-and-sizing", text: "Los prototipos UI/UX o especificaciones de diseño están adjuntos (si aplica).", isMandatory: false, criticality: "MEDIUM" },
      { id: "dor-6", section: "feasibility-and-sizing", text: "El ítem puede completarse dentro de un único Sprint según la capacidad del equipo.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Desglosar la historia en historias más pequeñas." }
    ]
  },
  {
    id: "definition-of-done",
    name: "Definition of Done (DoD)",
    description: "Criterios exhaustivos de calidad que garantizan que una tarea o incremento está potencialmente desplegable.",
    version: "2.1.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "HYBRID"],
    stage: "DONE",
    sections: [
      {
        id: "code-quality-and-tests",
        title: "1. Calidad de Código y Pruebas Automatizadas",
        description: "Requisitos técnicos innegociables de sanidad y cobertura de código.",
        order: 1,
        items: [
          {
            id: "dod-1",
            section: "code-quality-and-tests",
            text: "El código implementa todos los criterios de aceptación sin funcionalidad pendiente.",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Completar la lógica faltante antes de solicitar el cierre de la tarea."
          },
          {
            id: "dod-2",
            section: "code-quality-and-tests",
            text: "Se ha realizado revisión por pares (Code Review) y ha sido aprobada por al menos un revisor.",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Asignar revisor al Pull Request y atender todas las observaciones pendientes."
          },
          {
            id: "dod-3",
            section: "code-quality-and-tests",
            text: "Las pruebas unitarias y de integración pasan satisfactoriamente en el entorno de CI.",
            isMandatory: true,
            criticality: "BLOCKER",
            suggestedActionIfFailed: "Ejecutar npm test localmente y corregir los casos en fallo."
          },
          {
            id: "dod-4",
            section: "code-quality-and-tests",
            text: "No se introducen advertencias ni errores en la verificación de tipos de TypeScript (typecheck).",
            isMandatory: true,
            criticality: "HIGH",
            suggestedActionIfFailed: "Ejecutar npm run typecheck y resolver los tipos 'any' o discrepancias de schema."
          }
        ]
      },
      {
        id: "documentation-and-staging",
        title: "2. Documentación y Verificación en Staging",
        description: "Validación en entorno pre-productivo y actualización de contratos de API.",
        order: 2,
        items: [
          {
            id: "dod-5",
            section: "documentation-and-staging",
            text: "La documentación técnica de API o de usuario ha sido actualizada si hubo cambios de contrato.",
            isMandatory: true,
            criticality: "HIGH",
            suggestedActionIfFailed: "Actualizar openapi.yaml y API_DOCUMENTATION.md."
          },
          {
            id: "dod-6",
            section: "documentation-and-staging",
            text: "La funcionalidad ha sido desplegada y validada en entorno de pruebas/staging.",
            isMandatory: false,
            criticality: "MEDIUM",
            suggestedActionIfFailed: "Desplegar en staging y ejecutar smoke test."
          }
        ]
      }
    ],
    items: [
      { id: "dod-1", section: "code-quality-and-tests", text: "El código implementa todos los criterios de aceptación sin funcionalidad pendiente.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Completar la lógica faltante." },
      { id: "dod-2", section: "code-quality-and-tests", text: "Se ha realizado revisión por pares (Code Review) y ha sido aprobada por al menos un revisor.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Obtener aprobación en el Pull Request." },
      { id: "dod-3", section: "code-quality-and-tests", text: "Las pruebas unitarias y de integración pasan satisfactoriamente en el entorno de CI.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Ejecutar npm test y resolver fallos." },
      { id: "dod-4", section: "code-quality-and-tests", text: "No se introducen advertencias ni errores en la verificación de tipos de TypeScript (typecheck).", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Ejecutar npm run typecheck." },
      { id: "dod-5", section: "documentation-and-staging", text: "La documentación técnica de API o de usuario ha sido actualizada si hubo cambios de contrato.", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Actualizar openapi.yaml y documentación." },
      { id: "dod-6", section: "documentation-and-staging", text: "La funcionalidad ha sido desplegada y validada en entorno de pruebas/staging.", isMandatory: false, criticality: "MEDIUM" }
    ]
  },
  {
    id: "sprint-review-checklist",
    name: "Sprint Review Checklist",
    description: "Comprobación de preparación para la ceremonia de demostración e inspección con interesados.",
    version: "2.0.0",
    methodologies: ["SCRUM", "HYBRID"],
    stage: "REVIEW",
    sections: [
      {
        id: "demo-readiness",
        title: "1. Preparación de la Demostración",
        description: "Condiciones de entorno y coherencia del tablero.",
        order: 1,
        items: [
          { id: "srv-1", section: "demo-readiness", text: "El incremento de software funciona de extremo a extremo en un entorno similar a producción.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Verificar base de datos y datos demo antes de iniciar la sesión." },
          { id: "srv-2", section: "demo-readiness", text: "Se ha actualizado el estado de todos los items en el tablero antes de la sesión.", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Mover tareas terminadas a DONE y documentar bloqueos." },
          { id: "srv-3", section: "demo-readiness", text: "Se cuenta con un guión claro de demostración enfocado en el valor para los usuarios.", isMandatory: false, criticality: "MEDIUM" }
        ]
      },
      {
        id: "stakeholder-engagement",
        title: "2. Métricas y Concurrencia de Stakeholders",
        description: "Participación y transparencia de métricas de entrega.",
        order: 2,
        items: [
          { id: "srv-4", section: "stakeholder-engagement", text: "Los stakeholders clave han confirmado asistencia o tienen delegado asignado.", isMandatory: false, criticality: "MEDIUM" },
          { id: "srv-5", section: "stakeholder-engagement", text: "Se dispone de métricas de velocidad y porcentaje de consecución del Sprint Goal para compartir.", isMandatory: true, criticality: "HIGH", suggestedActionIfFailed: "Generar el reporte de métricas desde /api/projects/:id/metrics." }
        ]
      }
    ],
    items: [
      { id: "srv-1", section: "demo-readiness", text: "El incremento de software funciona de extremo a extremo en un entorno similar a producción.", isMandatory: true, criticality: "BLOCKER" },
      { id: "srv-2", section: "demo-readiness", text: "Se ha actualizado el estado de todos los items en el tablero antes de la sesión.", isMandatory: true, criticality: "HIGH" },
      { id: "srv-3", section: "demo-readiness", text: "Se cuenta con un guión claro de demostración enfocado en el valor para los usuarios.", isMandatory: false, criticality: "MEDIUM" },
      { id: "srv-4", section: "stakeholder-engagement", text: "Los stakeholders clave han confirmado asistencia o tienen delegado asignado.", isMandatory: false, criticality: "MEDIUM" },
      { id: "srv-5", section: "stakeholder-engagement", text: "Se dispone de métricas de velocidad y porcentaje de consecución del Sprint Goal para compartir.", isMandatory: true, criticality: "HIGH" }
    ]
  },
  {
    id: "release-readiness-checklist",
    name: "Production Release Readiness Checklist",
    description: "Verificaciones críticas antes de proceder con el despliegue a producción de una versión.",
    version: "2.0.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "WATERFALL", "HYBRID"],
    stage: "RELEASE",
    sections: [
      {
        id: "infra-and-data",
        title: "1. Infraestructura y Datos",
        description: "Copias de seguridad, migraciones de base de datos y rollback.",
        order: 1,
        items: [
          { id: "rel-1", section: "infra-and-data", text: "Todas las migraciones de base de datos han sido probadas con datos sintéticos y poseen rollback comprobado.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Probar el script de migración en un entorno sandbox antes de continuar." },
          { id: "rel-2", section: "infra-and-data", text: "Las variables de entorno de producción están configuradas y validadas.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Comprobar el archivo de secretos en el gestor de configuración." },
          { id: "rel-3", section: "infra-and-data", text: "Se realizó backup completo de la base de datos previo a la ventana de despliegue.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Ejecutar mongodump o snapshot de la base de datos." }
        ]
      },
      {
        id: "contingency-and-comms",
        title: "2. Plan de Contingencia y Comunicación",
        description: "Estrategia de recuperación y canales de monitoreo activos.",
        order: 2,
        items: [
          { id: "rel-4", section: "contingency-and-comms", text: "Las pruebas de carga y estrés no presentan degradación con respecto a la versión anterior.", isMandatory: false, criticality: "HIGH" },
          { id: "rel-5", section: "contingency-and-comms", text: "Existe un plan de rollback documentado con tiempo máximo de ejecución definido.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Redactar el procedimiento de vuelta atrás detallado." },
          { id: "rel-6", section: "contingency-and-comms", text: "El canal de comunicación con el equipo de soporte e incidencias está activo y monitoreado.", isMandatory: false, criticality: "MEDIUM" }
        ]
      }
    ],
    items: [
      { id: "rel-1", section: "infra-and-data", text: "Todas las migraciones de base de datos han sido probadas con datos sintéticos y poseen rollback comprobado.", isMandatory: true, criticality: "BLOCKER" },
      { id: "rel-2", section: "infra-and-data", text: "Las variables de entorno de producción están configuradas y validadas.", isMandatory: true, criticality: "BLOCKER" },
      { id: "rel-3", section: "infra-and-data", text: "Se realizó backup completo de la base de datos previo a la ventana de despliegue.", isMandatory: true, criticality: "BLOCKER" },
      { id: "rel-4", section: "contingency-and-comms", text: "Las pruebas de carga y estrés no presentan degradación con respecto a la versión anterior.", isMandatory: false, criticality: "HIGH" },
      { id: "rel-5", section: "contingency-and-comms", text: "Existe un plan de rollback documentado con tiempo máximo de ejecución definido.", isMandatory: true, criticality: "BLOCKER" },
      { id: "rel-6", section: "contingency-and-comms", text: "El canal de comunicación con el equipo de soporte e incidencias está activo y monitoreado.", isMandatory: false, criticality: "MEDIUM" }
    ]
  },
  {
    id: "security-compliance-checklist",
    name: "Security and Privacy Compliance Checklist",
    description: "Lista de verificación de seguridad, manejo de secretos, autenticación y protección de datos.",
    version: "2.0.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "LEAN", "WATERFALL", "HYBRID"],
    stage: "SECURITY",
    sections: [
      {
        id: "secrets-and-auth",
        title: "1. Gestión de Secretos y Autenticación",
        description: "Controles contra filtraciones de credenciales y brechas de sesión.",
        order: 1,
        items: [
          { id: "sec-1", section: "secrets-and-auth", text: "No existen credenciales, claves privadas o tokens en código fuente ni commits de git.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Ejecutar git-secrets o trufflehog y rotar claves expuestas." },
          { id: "sec-2", section: "secrets-and-auth", text: "Las entradas de usuario están validadas y sanitizadas con schemas (ej. Zod) para prevenir inyecciones.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Aplicar schema Zod estricto en la ruta correspondiente." },
          { id: "sec-3", section: "secrets-and-auth", text: "Las contraseñas se almacenan con algoritmos seguros y factores de costo adecuados (ej. bcrypt).", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Asegurar salt rounds >= 10 en bcrypt." }
        ]
      },
      {
        id: "access-and-headers",
        title: "2. Control de Acceso y Cabeceras HTTP",
        description: "Validación de privilegios de usuario y políticas defensivas de red.",
        order: 2,
        items: [
          { id: "sec-4", section: "access-and-headers", text: "Todas las rutas privadas verifican tokens JWT válidos y membresía obligatoria del proyecto.", isMandatory: true, criticality: "BLOCKER", suggestedActionIfFailed: "Incorporar middleware de autenticación y verificación de membresía." },
          { id: "sec-5", section: "access-and-headers", text: "Los encabezados de seguridad HTTP (CORS, HSTS) están configurados adecuadamente.", isMandatory: false, criticality: "HIGH" }
        ]
      }
    ],
    items: [
      { id: "sec-1", section: "secrets-and-auth", text: "No existen credenciales, claves privadas o tokens en código fuente ni commits de git.", isMandatory: true, criticality: "BLOCKER" },
      { id: "sec-2", section: "secrets-and-auth", text: "Las entradas de usuario están validadas y sanitizadas con schemas (ej. Zod) para prevenir inyecciones.", isMandatory: true, criticality: "BLOCKER" },
      { id: "sec-3", section: "secrets-and-auth", text: "Las contraseñas se almacenan con algoritmos seguros y factores de costo adecuados (ej. bcrypt).", isMandatory: true, criticality: "BLOCKER" },
      { id: "sec-4", section: "access-and-headers", text: "Todas las rutas privadas verifican tokens JWT válidos y membresía obligatoria del proyecto.", isMandatory: true, criticality: "BLOCKER" },
      { id: "sec-5", section: "access-and-headers", text: "Los encabezados de seguridad HTTP (CORS, HSTS) están configurados adecuadamente.", isMandatory: false, criticality: "HIGH" }
    ]
  }
];
