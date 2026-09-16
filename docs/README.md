# Sanzu Project Management Knowledge Base

Estructura centralizada de conocimiento que alimenta de manera dinámica a la API de Sanzu (`/api`), al motor de análisis de metodologías y al asistente conversacional de gestión de proyectos.

## Contenido de la Base de Conocimiento

### 1. [Methodologies](methodologies/)
Documentación exhaustiva de las metodologías soportadas en el motor:
- [Agile](methodologies/agile.md)
- [Scrum](methodologies/scrum.md)
- [Kanban](methodologies/kanban.md)
- [Extreme Programming (XP)](methodologies/xp.md)
- [Lean](methodologies/lean.md)
- [Waterfall](methodologies/waterfall.md)
- [Hybrid](methodologies/hybrid.md)

### 2. [Templates](templates/)
Plantillas estructuradas con campos validados y formato Markdown listo para producción:
- [User Story](templates/user-story.md)
- [Sprint Planning Canvas](templates/sprint-planning.md)
- [Bug Report](templates/bug-report.md)
- [Project Charter](templates/project-charter.md)
- [Architecture Decision Record (ADR)](templates/architecture-decision-record.md)

### 3. [Processes](processes/)
Flujos operativos estándar con roles, entradas, salidas y criterios de salida:
- [Sprint Lifecycle](processes/sprint-lifecycle.md)
- [Risk Management](processes/risk-management.md)
- [Release Management](processes/release-management.md)

### 4. [Checklists](checklists/)
Listas de comprobación con criticidad y evaluación automática vía endpoint `/api/checklists/:id/evaluate`:
- [Definition of Ready (DoR)](checklists/definition-of-ready.md)
- [Definition of Done (DoD)](checklists/definition-of-done.md)
- [Sprint Review Checklist](checklists/sprint-review-checklist.md)
- [Release Readiness Checklist](checklists/release-readiness-checklist.md)
- [Security & Privacy Compliance Checklist](checklists/security-compliance-checklist.md)

## Integración con la API

Todos estos artefactos están disponibles a través de la API REST de Sanzu:
- `GET /api/documentation`: Lista de directrices y estándares.
- `GET /api/methodologies`: Estrategias metodológicas registradas.
- `GET /api/templates`: Catálogo de plantillas con filtro por metodología y categoría.
- `GET /api/processes`: Flujos y procesos operativos estándar.
- `GET /api/checklists`: Listas de control y comprobación.
- `POST /api/checklists/:id/evaluate`: Evaluación de cumplimiento y cálculo de score.
