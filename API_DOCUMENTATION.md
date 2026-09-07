# Sanzu API Documentation

Base URL: `/api`

All endpoints except `GET /health` and methodology discovery require `Authorization: Bearer <JWT>`.

## Response format

Success responses use `{ "success": true, "data": ..., "message": "..." }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Endpoint groups

- Auth: `POST /auth/register`, `POST /auth/login`
- User: `GET|PUT /users/me`
- Methodologies: `GET /methodologies`, `GET /methodologies/:id`, `GET /methodologies/:id/rules`, `GET /methodologies/:id/metrics`
- Projects: `GET|POST /projects`, `GET|PUT|DELETE /projects/:id`
- Tasks: `GET|POST /projects/:projectId/tasks`, `GET|PUT|DELETE /tasks/:id`
- Project collections: `GET|POST /projects/:projectId/{team|backlog|sprints|milestones|risks|issues}`
- Collection items: `GET|PUT|DELETE /{backlog|sprints|milestones|risks|issues|team}/:id`
- Intelligence: `GET /projects/:projectId/{metrics|health|compliance|analysis}`, `GET|POST /projects/:projectId/recommendations`
- Chat: `POST /chatbot/message`, `GET /chatbot/conversations`, `GET|DELETE /chatbot/conversations/:id`

Use ISO dates for date fields. Create and update payloads are validated with Zod. Project-related requests require ownership or membership.
