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
