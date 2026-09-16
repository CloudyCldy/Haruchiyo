# Sanzu API Documentation

Base URL: `/api`

All endpoints except `GET /health` and methodology discovery require `Authorization: Bearer <JWT>`.

## Response format

Success responses use `{ "success": true, "data": ..., "message": "..." }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Endpoint groups

### Sprint 2: daily work management

All endpoints below require JWT authentication and project ownership or membership. They use the standard success/error envelopes described above.

- `GET /api/projects/:projectId/tasks`: list project tasks.
- `POST /api/projects/:projectId/tasks`: create a task (`title` required; optional `status`, `priority`, `storyPoints`, `sprintId`).
- `GET|PUT|DELETE /api/tasks/:id`: read, update, or delete a task. A supplied `sprintId` must belong to the task project.
- `GET /api/projects/:projectId/backlog`: list backlog items.
- `POST /api/projects/:projectId/backlog`: create a backlog item (`type` required: `USER_STORY`, `BUG`, `TASK`, `FEATURE`, or `IMPROVEMENT`).
- `GET|PUT|DELETE /api/backlog/:id`: manage a backlog item. Status transitions are `BACKLOGGED -> READY -> IN_PROGRESS -> DONE`; `sprintId` may be `null`.
- `GET /api/projects/:projectId/sprints`: list project sprints.
- `POST /api/projects/:projectId/sprints`: create a sprint with `startDate` before `endDate`.
- `GET|PUT|DELETE /api/sprints/:id`: manage a sprint. `GET` includes related `tasks` and `backlogItems`; status transitions are `PLANNED -> ACTIVE -> COMPLETED` or `CANCELLED`.


Use ISO dates for date fields. Create and update payloads are validated with Zod. Project-related requests require ownership or membership.

## Integración de partners (API key)

Las rutas de partner usan una API key compartida por Haitani, no JWT ni usuarios por organización o proyecto. En cada request se debe enviar:

`X-Api-Key: <SANZU_API_KEY>`

Endpoints disponibles:

- `POST /api/partner/projects`: crea o actualiza idempotentemente un proyecto por `externalRef`.
- `GET /api/partner/projects/:externalRef`: obtiene el proyecto y su metodología.
- `GET /api/partner/projects/:externalRef/metrics`
- `GET /api/partner/projects/:externalRef/health`
- `GET /api/partner/projects/:externalRef/compliance`
- `GET /api/partner/projects/:externalRef/analysis`
- `GET /api/partner/projects/:externalRef/recommendations`
- `POST /api/partner/chatbot/message`: consulta el chatbot con el contexto del proyecto.

Ejemplo de alta o actualización:

```json
{
	"externalRef": "haitani-proj-123",
	"name": "Haitani Delivery Platform",
	"methodologyId": "SCRUM",
	"requirements": {
		"business": ["Release MVP in Q4"],
		"technical": ["Use the existing payment provider"]
	}
}
```

La clave se genera manualmente con `npm run create-partner-key` y se muestra una sola vez en consola. No existe un endpoint público para generarla.

## Knowledge Base API (Documentación viva y metodologías)

Endpoints públicos y reutilizables para alimentar clientes, portales o integraciones con el catálogo estandarizado de gobernanza:

### 1. Documentación general
- `GET /api/documentation`: lista directrices y estándares organizacionales (`?category=STANDARDS`).
- `GET /api/documentation/:id`: contenido completo del documento o sección enfocada (`?section=methodology-alignment`).

### 2. Metodologías
- `GET /api/methodologies`: lista todas las metodologías registradas (Scrum, Kanban, XP, Lean, Waterfall, Agile, Hybrid) con roles, eventos, principios, plantillas, procesos y checklists asociados.
- `GET /api/methodologies/:id`: detalle completo de una estrategia metodológica.

### 3. Plantillas (Templates)
- `GET /api/templates`: catálogo de plantillas (`?methodology=SCRUM`, `?category=EXECUTION`).
- `GET /api/templates/:id`: estructura completa o sección puntual de la plantilla (`?section=acceptance-criteria`) con campos, tipos y validaciones.

### 4. Procesos (Processes)
- `GET /api/processes`: lista de procesos estándar (`?methodology=SCRUM`).
- `GET /api/processes/:id`: proceso completo o fase enfocada (`?phase=1` o `?phase=refinamiento`) con responsables (RACI), entradas, salidas y criterios de salida.

### 5. Checklists de Calidad y Cumplimiento
- `GET /api/checklists`: listas de comprobación (`?methodology=SCRUM`, `?stage=DONE`).
- `GET /api/checklists/:id`: detalle completo o sección específica (`?section=code-quality-and-tests`) con items clasificados por criticidad.
- `POST /api/checklists/:id/evaluate`: evalúa el cumplimiento enviando `{ "itemStatuses": { "<item_id>": true/false } }`. Retorna porcentaje general de cumplimiento, estado de aprobación (`isPassed`), desglose por sección (`sectionBreakdown`) y recomendaciones automáticas de mitigación.


