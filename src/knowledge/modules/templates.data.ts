import { TemplateDefinition } from "../types";

export const templateDefinitions: TemplateDefinition[] = [
  {
    id: "user-story",
    name: "User Story Template",
    description: "Plantilla estructurada para redactar historias de usuario con criterios de aceptación en formato Gherkin.",
    version: "2.1.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "LEAN", "HYBRID"],
    category: "EXECUTION",
    sections: [
      {
        id: "core-narrative",
        title: "1. Narrativa Central del Usuario",
        description: "Define quién es el usuario, qué necesita y qué beneficio concreto persigue.",
        order: 1,
        guidanceText: "Asegúrate de que el beneficio no repita el deseo, sino el impacto de negocio o ahorro de esfuerzo.",
        fields: [
          { name: "title", label: "Título de la Historia", type: "text", required: true, description: "Título conciso en formato: Como [Rol], Quiero [Acción]..." },
          { name: "role", label: "Rol / Usuario", type: "text", required: true, description: "El actor que se beneficia del valor." },
          { name: "goal", label: "Objetivo / Deseo", type: "text", required: true, description: "La funcionalidad o comportamiento deseado." },
          { name: "benefit", label: "Beneficio de Negocio", type: "multiline", required: true, description: "El valor tangible obtenido." }
        ]
      },
      {
        id: "acceptance-criteria",
        title: "2. Criterios de Aceptación (Gherkin)",
        description: "Escenarios reproducibles con Given/When/Then para validación manual y automatizada.",
        order: 2,
        guidanceText: "Incluye al menos un escenario de flujo exitoso (Happy Path) y uno de manejo de error.",
        fields: [
          { name: "acceptanceCriteria", label: "Criterios de Aceptación", type: "multiline", required: true, description: "Escenarios Given/When/Then verificables." }
        ]
      },
      {
        id: "technical-context",
        title: "3. Contexto Técnico y Estimación",
        description: "Dependencias de arquitectura, consideraciones de seguridad y esfuerzo relativo.",
        order: 3,
        fields: [
          { name: "storyPoints", label: "Puntos de Historia", type: "number", required: false, description: "Estimación de esfuerzo relativo en Fibonacci (1, 2, 3, 5, 8, 13)." },
          { name: "dependencies", label: "Dependencias", type: "list", required: false, description: "APIs externas, migraciones de base de datos o contratos bloqueantes." }
        ]
      }
    ],
    fields: [
      { name: "title", label: "Título de la Historia", type: "text", required: true, description: "Título conciso en formato: Como [Rol], Quiero [Acción]..." },
      { name: "role", label: "Rol / Usuario", type: "text", required: true, description: "El actor que se beneficia del valor." },
      { name: "goal", label: "Objetivo / Deseo", type: "text", required: true, description: "La funcionalidad o comportamiento deseado." },
      { name: "benefit", label: "Beneficio de Negocio", type: "multiline", required: true, description: "El valor tangible obtenido." },
      { name: "acceptanceCriteria", label: "Criterios de Aceptación", type: "multiline", required: true, description: "Escenarios Given/When/Then verificables." },
      { name: "storyPoints", label: "Puntos de Historia", type: "number", required: false, description: "Estimación de esfuerzo relativo." }
    ],
    markdownTemplate: `# [US-XXXX] <Título de la Historia>

### Descripción
- **Como:** <rol o tipo de usuario>
- **Quiero:** <funcionalidad requerida>
- **Para:** <beneficio o impacto esperado>

### Criterios de Aceptación (Gherkin)
- **Escenario 1:** Éxito del flujo principal
  - **Dado:** <contexto o precondiciones>
  - **Cuando:** <acción ejecutada por el usuario>
  - **Entonces:** <resultado esperado verificable>

- **Escenario 2:** Manejo de excepciones
  - **Dado:** <precondición anómala o error>
  - **Cuando:** <acción realizada>
  - **Entonces:** <mensaje de error y recuperación segura>

### Notas Técnicas
- Dependencias:
- Consideraciones de seguridad:`,
    exampleFilledContent: `# [US-102] Exportación de Reportes Financieros en Formato CSV

### Descripción
- **Como:** Project Manager
- **Quiero:** Exportar el reporte de avance presupuestario en formato CSV
- **Para:** Compartir los datos consolidados con el comité directivo sin acceso manual a la base de datos

### Criterios de Aceptación (Gherkin)
- **Escenario 1:** Exportación exitosa con filtro de fecha
  - **Dado:** Un proyecto con tareas y costos registrados en el mes actual
  - **Cuando:** El usuario hace click en "Descargar CSV de Métricas"
  - **Entonces:** Se descarga un archivo con cabeceras correctas codificado en UTF-8

- **Escenario 2:** Proyecto sin datos para el periodo
  - **Dado:** Un proyecto recién creado sin costos ni tareas
  - **Cuando:** El usuario solicita la descarga
  - **Entonces:** La interfaz muestra una notificación indicando que no hay registros para el periodo seleccionado`,
    suggestedFileNaming: "US-{id}-{slug}.md"
  },
  {
    id: "sprint-planning",
    name: "Sprint Planning Canvas",
    description: "Estructura para la sesión de planificación del Sprint: objetivo cohesivo, capacidad real y backlog comprometido.",
    version: "2.0.0",
    methodologies: ["SCRUM", "HYBRID"],
    category: "PLANNING",
    sections: [
      {
        id: "goal-and-window",
        title: "1. Definición del Sprint Goal y Ventana Temporal",
        description: "El objetivo rector y las fechas de inicio y culminación.",
        order: 1,
        fields: [
          { name: "sprintNumber", label: "Número de Sprint", type: "number", required: true, description: "Identificador secuencial del Sprint." },
          { name: "sprintGoal", label: "Sprint Goal", type: "text", required: true, description: "Objetivo cohesivo que aporta valor de negocio." },
          { name: "startDate", label: "Fecha de Inicio", type: "date", required: true, description: "Fecha de arranque del Sprint." },
          { name: "endDate", label: "Fecha de Fin", type: "date", required: true, description: "Fecha de culminación y demo." }
        ]
      },
      {
        id: "capacity-and-commitment",
        title: "2. Capacidad y Backlog Comprometido",
        description: "Cálculo de dedicación del equipo y asignación de historias.",
        order: 2,
        fields: [
          { name: "teamCapacity", label: "Capacidad del Equipo", type: "number", required: true, description: "Capacidad total estimada en puntos de historia." },
          { name: "committedItems", label: "Items Comprometidos", type: "list", required: true, description: "Lista de historias seleccionadas del Product Backlog." }
        ]
      }
    ],
    fields: [
      { name: "sprintNumber", label: "Número de Sprint", type: "number", required: true, description: "Identificador secuencial del Sprint." },
      { name: "sprintGoal", label: "Sprint Goal", type: "text", required: true, description: "Objetivo cohesivo que aporta valor de negocio." },
      { name: "teamCapacity", label: "Capacidad del Equipo", type: "number", required: true, description: "Capacidad total estimada en puntos de historia o personas/día." },
      { name: "committedItems", label: "Items Comprometidos", type: "list", required: true, description: "Lista de historias seleccionadas del Product Backlog." }
    ],
    markdownTemplate: `# Planificación del Sprint <N>

- **Sprint Goal:** <Objetivo conciso y verificable>
- **Duración:** <Fecha Inicio> a <Fecha Fin>
- **Capacidad Total:** <Puntos de historia disponibles>

## Historias de Usuario Comprometidas
1. [US-01] <Título> (<Puntos>)
2. [US-02] <Título> (<Puntos>)

## Supuestos y Riesgos Identificados
- Supuesto 1:
- Riesgo 1 (Mitigación):`,
    suggestedFileNaming: "sprint-{number}-planning.md"
  },
  {
    id: "bug-report",
    name: "Bug Report Template",
    description: "Plantilla para reporte detallado de defectos, pasos de reproducción y logs de soporte.",
    version: "2.0.0",
    methodologies: ["AGILE", "SCRUM", "KANBAN", "XP", "LEAN", "WATERFALL", "HYBRID"],
    category: "QUALITY",
    sections: [
      {
        id: "defect-overview",
        title: "1. Resumen y Severidad",
        description: "Información contextual básica y clasificación del impacto.",
        order: 1,
        fields: [
          { name: "summary", label: "Resumen del Fallo", type: "text", required: true, description: "Descripción breve del fallo." },
          { name: "severity", label: "Severidad", type: "select", required: true, description: "Impacto del defecto.", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          { name: "environment", label: "Entorno", type: "text", required: true, description: "staging, producción, versión de navegador, etc." }
        ]
      },
      {
        id: "reproduction-steps",
        title: "2. Reproducción y Evidencia",
        description: "Instrucciones paso a paso para duplicar el comportamiento anómalo.",
        order: 2,
        fields: [
          { name: "stepsToReproduce", label: "Pasos para Reproducir", type: "multiline", required: true, description: "Pasos numerados paso a paso." },
          { name: "expectedResult", label: "Comportamiento Esperado", type: "text", required: true, description: "Qué debió ocurrir." },
          { name: "actualResult", label: "Comportamiento Real", type: "text", required: true, description: "Qué ocurrió realmente." }
        ]
      }
    ],
    fields: [
      { name: "summary", label: "Resumen del Fallo", type: "text", required: true, description: "Descripción breve del fallo." },
      { name: "severity", label: "Severidad", type: "select", required: true, description: "Impacto del defecto.", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      { name: "environment", label: "Entorno", type: "text", required: true, description: "staging, producción, versión de navegador, etc." },
      { name: "stepsToReproduce", label: "Pasos para Reproducir", type: "multiline", required: true, description: "Pasos numerados paso a paso." },
      { name: "expectedResult", label: "Comportamiento Esperado", type: "text", required: true, description: "Qué debió ocurrir." },
      { name: "actualResult", label: "Comportamiento Real", type: "text", required: true, description: "Qué ocurrió realmente." }
    ],
    markdownTemplate: `# Bug: <Resumen conciso>

- **Entorno:** <Staging / Producción / Local>
- **Severidad:** <LOW | MEDIUM | HIGH | CRITICAL>

## Pasos para reproducir
1. Navegar a...
2. Realizar click en...
3. Enviar el formulario con...

## Comportamiento esperado
<Descripción precisa de lo que debería suceder>

## Comportamiento observado
<Descripción y captura/error recibido>

## Logs y Trazas
\`\`\`
<Insertar stack trace o payload HTTP>
\`\`\``,
    suggestedFileNaming: "BUG-{id}-{slug}.md"
  },
  {
    id: "project-charter",
    name: "Project Charter Template",
    description: "Acta de constitución del proyecto con justificación, alcance, hitos y restricciones.",
    version: "2.0.0",
    methodologies: ["WATERFALL", "HYBRID", "LEAN"],
    category: "PLANNING",
    sections: [
      {
        id: "business-case",
        title: "1. Justificación y Caso de Negocio",
        description: "Antecedentes y valor estratégico del proyecto.",
        order: 1,
        fields: [
          { name: "projectName", label: "Nombre del Proyecto", type: "text", required: true, description: "Nombre oficial del proyecto." },
          { name: "businessCase", label: "Caso de Negocio", type: "multiline", required: true, description: "Problema u oportunidad que justifica la inversión." }
        ]
      },
      {
        id: "objectives-milestones",
        title: "2. Objetivos e Hitos Principales",
        description: "Metas SMART y fechas límite de alto nivel.",
        order: 2,
        fields: [
          { name: "objectives", label: "Objetivos SMART", type: "list", required: true, description: "Objetivos específicos y medibles." },
          { name: "milestones", label: "Hitos Principales", type: "list", required: true, description: "Fechas clave del cronograma." }
        ]
      }
    ],
    fields: [
      { name: "projectName", label: "Nombre del Proyecto", type: "text", required: true, description: "Nombre oficial del proyecto." },
      { name: "businessCase", label: "Caso de Negocio", type: "multiline", required: true, description: "Problema u oportunidad que justifica la inversión." },
      { name: "objectives", label: "Objetivos SMART", type: "list", required: true, description: "Objetivos específicos y medibles." },
      { name: "milestones", label: "Hitos Principales", type: "list", required: true, description: "Fechas clave del cronograma." }
    ],
    markdownTemplate: `# Project Charter: <Nombre del Proyecto>

## 1. Justificación y Caso de Negocio
<Explicación del valor estratégico>

## 2. Objetivos Principales
- Objetivo 1:
- Objetivo 2:

## 3. Alcance y Límites
- **Dentro de alcance:**
- **Fuera de alcance:**

## 4. Hitos Críticos y Cronograma
- Hito 1: <Fecha>
- Hito 2: <Fecha>

## 5. Gobernanza y Aprobaciones
- Project Manager:
- Patrocinador / Sponsor:`,
    suggestedFileNaming: "project-charter.md"
  },
  {
    id: "architecture-decision-record",
    name: "Architecture Decision Record (ADR)",
    description: "Registro formal de decisiones arquitecturales, opciones evaluadas y consecuencias.",
    version: "2.0.0",
    methodologies: ["XP", "SCRUM", "AGILE", "HYBRID", "WATERFALL"],
    category: "ARCHITECTURE",
    sections: [
      {
        id: "decision-status",
        title: "1. Estado y Metadatos",
        description: "Título, identificador y estado de adopción de la decisión.",
        order: 1,
        fields: [
          { name: "title", label: "Título de la Decisión", type: "text", required: true, description: "Ej: ADR-001 Elección de MongoDB como motor documental" },
          { name: "status", label: "Estado", type: "select", required: true, description: "Propuesta, Aceptada, Obsoleta", options: ["PROPOSED", "ACCEPTED", "SUPERSEDED"] }
        ]
      },
      {
        id: "decision-rationale",
        title: "2. Razón, Contexto y Consecuencias",
        description: "Comparativa de opciones y compromisos asumidos.",
        order: 2,
        fields: [
          { name: "context", label: "Contexto y Requisitos", type: "multiline", required: true, description: "Motivo y contexto de la necesidad." },
          { name: "decision", label: "Decisión Tomada", type: "multiline", required: true, description: "Qué se resolvió y por qué." },
          { name: "consequences", label: "Consecuencias", type: "multiline", required: true, description: "Ventajas, riesgos y compromisos asumidos." }
        ]
      }
    ],
    fields: [
      { name: "title", label: "Título de la Decisión", type: "text", required: true, description: "Ej: ADR-001 Elección de MongoDB como motor documental" },
      { name: "status", label: "Estado", type: "select", required: true, description: "Propuesta, Aceptada, Obsoleta", options: ["PROPOSED", "ACCEPTED", "SUPERSEDED"] },
      { name: "context", label: "Contexto y Requisitos", type: "multiline", required: true, description: "Motivo y contexto de la necesidad." },
      { name: "decision", label: "Decisión Tomada", type: "multiline", required: true, description: "Qué se resolvió y por qué." },
      { name: "consequences", label: "Consecuencias", type: "multiline", required: true, description: "Ventajas, riesgos y compromisos asumidos." }
    ],
    markdownTemplate: `# ADR-<Número>: <Título corto de la decisión>

- **Estado:** <PROPOSED | ACCEPTED | SUPERSEDED>
- **Fecha:** <AAAA-MM-DD>
- **Decisores:** <Lista de involucrados>

## Contexto
<Descripción de la situación técnica o de negocio que motiva la decisión>

## Opciones Evaluadas
1. **Opción A:** Pros y contras
2. **Opción B:** Pros y contras

## Decisión
<Se opta por la opción X debido a los motivos Y>

## Consecuencias
- **Positivas:**
- **Negativas / Compromisos asumidos:**`,
    suggestedFileNaming: "ADR-{number}-{title}.md"
  }
];
