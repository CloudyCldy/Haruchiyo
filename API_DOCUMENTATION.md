# Sanzu API Documentation

Base URL: `/api`

All endpoints except `GET /health` and methodology discovery require `Authorization: Bearer <JWT>`.

## Response format

Success responses use `{ "success": true, "data": ..., "message": "..." }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Endpoint groups


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
