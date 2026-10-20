# Contrato oficial Haitani ↔ Sanzu — API v1

**Versión del contrato:** 1.1 · **Fecha:** 2026-10-07

## 1. Roles de cada sistema

| Sistema | Rol | Fuente de verdad de |
|---|---|---|
| **Haitani** (Express + PostgreSQL) | Workspace y ejecución del proyecto | Organizaciones, usuarios, proyectos, tareas, equipo, archivos |
| **Sanzu** (Next.js + MongoDB) | Inteligencia: análisis, health, riesgos, recomendaciones, metodologías, documentación | Catálogo de metodologías, Knowledge Base, historial del chatbot, recomendaciones guardadas |

Flujo: `Haitani → POST /api/v1/projects/:externalRef/context → Sanzu (metodología + knowledge base + motor determinístico) → respuesta → Haitani muestra Sanzu Intelligence`.

## 2. Versionado

- Ruta oficial: **`/api/v1/...`**. Toda integración nueva debe usarla.
- `/api/...` (sin versión) sigue funcionando como **alias legado** con respuestas idénticas. Se retirará en la v2.
- Todas las respuestas incluyen el header `X-API-Version: v1`.
- Cambios compatibles (campos nuevos en respuestas, parámetros opcionales) se publican en v1. Cambios incompatibles (renombrar/eliminar campos, cambiar tipos) requieren `/api/v2`.

## 3. Autenticación

| Quién llama | Header | Uso |
|---|---|---|
| Servidor de Haitani | `X-Api-Key: <clave>` | Rutas `/partner/*` y `/projects/:externalRef/context`. La clave se genera con `npm run create-partner-key` y se guarda hasheada (SHA-256). En Haitani va en `SANZU_API_KEY`. |
| Usuario de Sanzu | `Authorization: Bearer <JWT>` | Resto de rutas. JWT HS256, expira en 7 días. Se obtiene con `POST /api/v1/auth/login`. |

Reglas: la API key **nunca** se expone al navegador; Haitani la usa solo desde su backend.

## 4. Formato de respuesta

Éxito:
```json
{ "success": true, "data": { }, "message": "Operation completed successfully" }
```
Error:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "tasks.0.status: unsupported value \"volando\"" } }
```

## 5. Códigos de error (SB-01-ST081)

Definidos en `src/lib/errors.ts` (`ERROR_CODES`). Los clientes deben decidir por `error.code`, no por el texto.

| HTTP | `code` | Cuándo ocurre | Qué debe hacer Haitani |
|---|---|---|---|
| 400 | `BAD_REQUEST` | El cuerpo no es JSON válido | Corregir la petición |
| 401 | `UNAUTHORIZED` | Falta o es inválido el JWT / `X-Api-Key` | Revisar `SANZU_API_KEY`; no reintentar |
| 401 | `INVALID_CREDENTIALS` | Login con correo/contraseña incorrectos | Mostrar error al usuario |
| 403 | `FORBIDDEN` | Autenticado pero sin acceso al proyecto, o no es manager | No reintentar |
| 404 | `NOT_FOUND` | El recurso no existe | Sincronizar el proyecto (`POST /partner/projects`) y reintentar |
| 409 | `CONFLICT` | Duplicado (p. ej. correo) o transición de estado no permitida | Recargar estado y reintentar |
| 422 | `VALIDATION_ERROR` | Los datos no cumplen el esquema; el mensaje indica el campo | Corregir el payload |
| 500 | `INTERNAL_ERROR` | Error inesperado | Reintentar con backoff; usar modo local |
| 502 | `AI_SERVICE_ERROR` | Falló un proveedor de IA externo | Usar respuesta determinística / modo local |

## 6. Endpoints que usa Haitani

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/partner/projects` | API key | Crea/actualiza proyecto por `externalRef` (`haitani-proj-<id>`) |
| GET | `/api/v1/partner/projects/:externalRef` | API key | Proyecto completo |
| GET | `/api/v1/partner/projects/:externalRef/{metrics\|health\|compliance\|analysis\|recommendations}` | API key | Inteligencia sobre datos guardados en Sanzu |
| **POST** | **`/api/v1/projects/:externalRef/context`** | API key | **Análisis del contexto real que envía Haitani (recomendado)** |
| POST | `/api/v1/partner/chatbot/message` | API key | Chatbot: `{ externalRef, message, conversationId?, requirements? }` |
| GET | `/api/v1/partner/projects/:externalRef/backlog` | API key | Backlog del proyecto (`?type ?status ?priority ?sprintId=<id>\|none`), ordenado por prioridad |
| POST | `/api/v1/partner/projects/:externalRef/backlog` | API key | Agrega un ítem: `{ title, type, priority?, storyPoints?, description?, acceptanceCriteria?, sprintId? }` |
| PUT | `/api/v1/partner/projects/:externalRef/backlog/:itemId` | API key | Edita un ítem o cambia su estado (avanza o regresa un paso; un salto da `409`) |
| DELETE | `/api/v1/partner/projects/:externalRef/backlog/:itemId` | API key | Elimina un ítem (`404` si es de otro proyecto) |
| GET | `/api/v1/partner/projects/:externalRef/sprints` | API key | Sprints del proyecto, para asignarles ítems |
| PUT | `/api/v1/partner/projects/:externalRef/sprints` | API key | Haitani manda **todos** sus sprints: `{ sprints: [{ externalRef: "haitani-sprint-<id>", name, goal?, startDate, endDate, status? }] }`. Sanzu crea, actualiza y borra su copia para que quede igual (los ítems de un sprint borrado quedan sin sprint). Estados: `planificado→PLANNED`, `activo→ACTIVE`, `cerrado→COMPLETED` |
| GET | `/api/v1/partner/projects/:externalRef/documents/recommended` | API key | ST055: documentos recomendados (`?phase=INICIO\|EJECUCION\|CIERRE`, `?q`, `?limit`); sin `phase` se deduce del estado y las fechas |
| GET | `/api/v1/documentation/search` | Pública | ST054: búsqueda en el corpus y guías (`?q` obligatorio, `?methodology`, `?category`, `?limit`) |

Rutas de usuario de Sanzu (JWT) relevantes para inteligencia:
`GET /projects/:id/health`, `/metrics`, `/risks` (`?status=`, `?summary=true`), `/recommendations` (`?live=true`), `POST /projects/:id/recommendations`, `GET /projects/:id/analysis`, `/compliance`, `GET /projects/:id/backlog` (`?type&status&priority&sprintId=<id>|none`).

## 7. `POST /api/v1/projects/:id/context` (INT-01)

- Con `X-Api-Key`: `:id` = `externalRef` de Haitani (o id de Sanzu).
- Con JWT: `:id` = id de Sanzu y el usuario debe ser miembro.
- **No guarda nada** (stateless). Si el proyecto aún no se sincronizó, igual responde y marca `synced: false`.
- Acepta los valores nativos de Haitani: estados `pendiente | en_proceso | en_revision | bloqueada | completada`, prioridades `baja | media | alta | critica`, ids numéricos. También acepta los valores de Sanzu (`TODO`, `HIGH`, …).

### Request

```json
{
  "project": { "name": "Haitani + Sanzu", "methodology": "SCRUM", "phase": "EXECUTION",
               "startDate": "2026-09-13", "endDate": "2026-10-24", "weeklyCapacityHours": 40 },
  "tasks": [ { "id": 12, "title": "Crear API v1", "status": "en_proceso", "priority": "alta",
               "assignedTo": 7, "estimatedHours": 12, "storyPoints": 5, "dueDate": "2026-09-19" } ],
  "team": [ { "userId": 7, "name": "Alberto", "role": "DEVELOPER" } ],
  "risks": [ { "title": "Sanzu no disponible", "probability": "media", "impact": "alta", "status": "open", "mitigation": null } ],
  "sprint": { "name": "Sprint 2", "goal": "Kanban", "startDate": "2026-09-28", "endDate": "2026-10-09", "status": "active" },
  "milestones": [ { "name": "Release v1.0", "dueDate": "2026-10-24", "status": "pending" } ],
  "issues": [ { "title": "Login lento", "priority": "alta", "status": "open" } ],
  "documentation": [ { "id": 3, "title": "User Story Template", "type": "template" } ]
}
```

Solo `project.name` es obligatorio. Límites: 5000 tareas, 1000 riesgos, 500 miembros.
Fases válidas: `INITIATION | PLANNING | EXECUTION | RELEASE | CLOSING` (también `inicio`, `planificación`, `ejecución`, `lanzamiento`, `cierre`). Si no se envía, se infiere de `status` o se usan todos los documentos de la metodología.

### Response `200`

```json
{
  "success": true,
  "data": {
    "projectId": "665f…", "externalRef": "haitani-proj-12", "sanzuProjectId": "665f…", "synced": true,
    "analyzedAt": "2026-10-07T16:00:00.000Z", "methodology": "SCRUM",
    "health": { "score": 63, "status": "WARNING",
                "factors": { "schedule": 40, "delivery": 75, "risks": 92, "issues": 90, "teamWorkload": 100, "methodologyCompliance": 100, "progress": 25 },
                "weights": { "schedule": 0.25, "delivery": 0.2, "risks": 0.15, "issues": 0.1, "teamWorkload": 0.1, "methodologyCompliance": 0.2 } },
    "summary": { "progress": 25, "totalTasks": 4, "completedTasks": 1, "blockedTasks": 1, "overdueTasks": 2,
                 "schedule": { "status": "AT_RISK", "plannedProgress": 75, "actualProgress": 25, "predictedCompletionDate": "…", "predictedDelayDays": 50 },
                 "delays": { "overdueRatio": 50, "trend": "WORSENING", "delayedMilestones": [] },
                 "workload": { "members": [ { "userId": "7", "name": "Alberto", "hours": 24, "capacityPercentage": 60, "status": "OK" } ], "concentration": { "percentage": 67, "isConcentrated": true } },
                 "velocity": { "average": 0, "trend": "STABLE" } },
    "blockedTasks": [ { "id": "13", "title": "Contrato", "assignedTo": "7" } ],
    "risks": { "items": [ { "title": "Sanzu no disponible", "severity": 6, "level": "HIGH", "status": "OPEN" } ], "summary": { "active": 1, "byLevel": { "HIGH": 1 } } },
    "problems": [ { "code": "SCHEDULE_AT_RISK", "type": "SCHEDULE", "severity": "HIGH", "description": "…" } ],
    "compliance": { "methodology": "SCRUM", "score": 100, "status": "EXCELLENT", "problems": [], "warnings": [] },
    "recommendations": [ { "type": "SCHEDULE", "priority": "HIGH", "title": "Recover schedule slippage", "description": "…", "reason": "…", "suggestedAction": "…" } ],
    "requiredDocuments": { "methodology": "SCRUM", "phase": "EXECUTION", "coverage": 25,
                           "required": [ { "id": "user-story", "title": "User Story", "kind": "TEMPLATE", "provided": true, "link": "/api/v1/templates/user-story" } ],
                           "missing": [ { "id": "definition-of-done", "kind": "CHECKLIST", "link": "/api/v1/checklists/definition-of-done" } ] }
  },
  "message": "Project context analyzed"
}
```

### Cálculos (determinísticos, sin IA)

- **Severidad de riesgo** = impacto (1–4) × probabilidad (1–3) → 1–12. Nivel: ≥9 CRITICAL, ≥6 HIGH, ≥3 MEDIUM.
- **Capacidad** = horas estimadas de tareas abiertas ÷ `weeklyCapacityHours` (40 h por defecto). >100 % = OVERLOADED.
- **Concentración**: una persona con ≥50 % de las tareas abiertas (equipo >1).
- **Predicción**: ritmo = tareas completadas ÷ días transcurridos; fecha estimada = hoy + pendientes ÷ ritmo.
- **Health** = ponderado de schedule 25 %, delivery 20 %, riesgos 15 %, incidencias 10 %, carga 10 %, compliance 20 %. ≥85 EXCELLENT, ≥70 GOOD, ≥45 WARNING, resto CRITICAL.

## 8. Comportamiento ante fallos (Haitani)

1. Timeout recomendado: 8 s. Reintentar 1 vez solo en `500`/`502`/error de red.
2. `404` en rutas `/partner/*` → ejecutar `syncProject` y reintentar una vez.
3. Si Sanzu no responde → **modo local** con los datos de Haitani (tareas vencidas y avance), como pide HB-16.
4. Nunca reenviar `401`/`403`/`422` sin corregir la causa.

## 9. Hallazgos de la auditoría SB-01-ST010 (corregidos)

| # | Hallazgo | Impacto | Corrección |
|---|---|---|---|
| 1 | Petición sin token devolvía **500** en vez de 401 (el error no tenía nombre `AuthenticationError`) | Incumplía criterio de SB-01 | `getAuthUser` lanza `AuthenticationError` → 401 |
| 2 | `/auth/register` aceptaba `role: "ADMIN"` | Escalamiento de privilegios | Se ignora `role` en el registro |
| 3 | Cualquier miembro podía **editar o eliminar** el proyecto | Seguridad SB-02 | `PUT/DELETE /projects/:id` solo manager o miembro `PROJECT_MANAGER` |
| 4 | `GET /projects/:id/recommendations` devolvía un objeto vacío (se hacía spread de un `Response`) | Endpoint roto | Reescrito; añade `?live=true` |
| 5 | `POST /recommendations` duplicaba recomendaciones en cada llamada | Datos basura | Deduplicación por título (7 días) |
| 6 | Al editar probabilidad/impacto de un riesgo no se recalculaba la severidad | Datos inconsistentes | Recalculo en `updateResource` |
| 7 | Rutas partner/chatbot validaban el cuerpo **antes** de autenticar | Filtraba detalles a anónimos | Se autentica primero |
| 8 | `methodologyId` inexistente se guardaba sin validar | Proyectos huérfanos | Validación contra el catálogo → 422 |
| 9 | Errores de Zod/Prisma/JSON terminaban en 500 | Errores confusos | Mapeo a 422 / 404 / 409 / 400 |
| 10 | `JWT_SECRET` caía a un valor por defecto también en producción | Tokens falsificables | En producción es obligatorio |
| 11 | Haitani llamaba a `/api/chatbot/message` (requiere JWT) con API key | El asistente fallaba siempre con 401 | Haitani usa `/api/v1/partner/chatbot/message` |
| 12 | Métricas contaban riesgos/incidencias **cerrados** y tareas canceladas | Health incorrecto | Solo se cuentan activos |