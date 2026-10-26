# Sanzu API Documentation: Seguridad Empresarial y Autorización Granular

Base URL: `/api`

Todos los endpoints privados exigen autenticación y autorización explícitas mediante JWT (`Authorization: Bearer TU_ACCESS_TOKEN`) o claves de integración seguras (`X-Api-Key: TU_API_KEY`). El único endpoint público sin autenticación es `GET /api/health`.

---

## 1. Esquema General de Respuesta y Errores HTTP

Las respuestas exitosas siguen la estructura:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada exitosamente"
}
```

Códigos de error normalizados:
- **401 Unauthorized**: Credenciales ausentes, inválidas, expiradas o revocadas (`UNAUTHORIZED`).
- **403 Forbidden**: Identidad autenticada sin permisos o scopes suficientes (`FORBIDDEN`).
- **404 Not Found**: Recurso inexistente o perteneciente a otra organización (mitigación de IDOR/BOLA).
- **422 Unprocessable Entity**: Validación de entrada fallida conforme al esquema Zod (`VALIDATION_ERROR`).
- **429 Too Many Requests**: Límite de peticiones por ventana excedido (`TOO_MANY_REQUESTS`). Incluye encabezado `Retry-After`.

---

## 2. Autenticación y Gestión de Credenciales

### POST `/api/auth/login`
- **Autenticación**: Pública.
- **Entrada**: `{ "email": "usuario@empresa.com", "password": "TU_PASSWORD" }`
- **Salida esperada (200)**: `{ "user": { "id": "...", "name": "...", "email": "...", "role": "..." }, "token": "TU_ACCESS_TOKEN" }`
- **Errores**: `401` ante credenciales inválidas.

### GET `/api/users/me/credentials`
- **Autenticación**: `Authorization: Bearer TU_ACCESS_TOKEN`.
- **Salida esperada (200)**: Información del usuario, endpoints disponibles y placeholders para desarrollo seguro.

### POST `/api/integrations/api-keys`
- **Autenticación**: `Authorization: Bearer TU_ACCESS_TOKEN`.
- **Scopes/Permisos**: Exclusivo para administradores de empresa / plataforma.
- **Entrada**:
  ```json
  {
    "name": "Integración Haitani Producción",
    "organizationId": "org-haitani-1",
    "scopes": ["projects:read", "projects:create", "projects:update", "analysis:run", "chat:use"],
    "expiresInDays": 90
  }
  ```
- **Salida esperada (201)**: Retorna la clave completa criptográficamente segura (`apiKey: "sz_live_..."`) **únicamente una vez**. La base de datos almacena exclusivamente su hash SHA-256.

### GET `/api/integrations/api-keys`
- **Autenticación**: `Authorization: Bearer TU_ACCESS_TOKEN`.
- **Salida esperada (200)**: Lista de claves con su prefijo enmascarado (`keyPrefix: "sz_live_a1b2..."`), scopes, estado y fechas de uso/expiración.

### DELETE `/api/integrations/api-keys/:id`
- **Autenticación**: `Authorization: Bearer TU_ACCESS_TOKEN`.
- **Salida esperada (200)**: Revocación inmediata de la clave (`active: false`, `revokedAt`).

---

## 3. Integración de Partners Servidor a Servidor (Haitani ↔ Sanzu)

Las peticiones de backend utilizan claves independientes por organización con aislamiento multi-inquilino.

Encabezado obligatorio:
`X-Api-Key: TU_API_KEY`

### POST `/api/partner/projects`
- **Autenticación**: `X-Api-Key: TU_API_KEY` (Scope requerido: `projects:create`).
- **Aislamiento**: Asocia el proyecto al `organizationId` vinculado a la clave.
- **Entrada**:
  ```json
  {
    "externalRef": "haitani-proj-101",
    "name": "Plataforma Sakura Coffee",
    "methodologyId": "SCRUM",
    "requirements": {
      "business": ["Despliegue MVP en Q4"],
      "technical": ["Pasarela de pagos y OAuth"]
    }
  }
  ```
- **Salida (201)**: Proyecto creado o sincronizado idempotentemente.

### GET `/api/partner/projects/:externalRef`
- **Autenticación**: `X-Api-Key: TU_API_KEY` (Scope requerido: `projects:read`).
- **Aislamiento**: Si el proyecto pertenece a otra organización, responde **404 Not Found** (previniendo filtración cruzada de datos).

### GET `/api/partner/projects/:externalRef/:metric`
- **Autenticación**: `X-Api-Key: TU_API_KEY` (Scope requerido: `analysis:run`).
- **Métricas soportadas**: `metrics`, `health`, `compliance`, `analysis`, `recommendations`.
- **Salida (200)**: Análisis táctico y métricas operativas del proyecto.

### POST `/api/partner/chatbot/message`
- **Autenticación**: `X-Api-Key: TU_API_KEY` (Scope requerido: `chat:use`).
- **Limitación de velocidad**: 60 req/min por cliente.
- **Entrada**:
  ```json
  {
    "externalRef": "haitani-proj-101",
    "message": "¿Cuáles tareas se encuentran vencidas en el sprint actual?",
    "context": {
      "projectId": 101,
      "project": { "name": "Sakura Coffee", "methodology": "SCRUM" }
    }
  }
  ```
- **Salida (200)**: Respuesta generada con citas bibliográficas, sugerencias y metadatos de intención.

---

## 4. API de Proyectos y Gestión de Trabajo

Requiere `Authorization: Bearer TU_ACCESS_TOKEN` o `X-Api-Key: TU_API_KEY` según el endpoint.

- `GET /api/projects`: Listado de proyectos accesibles por el usuario.
- `POST /api/projects`: Creación de nuevo proyecto.
- `GET /api/projects/:id/tasks`: Listado de tareas del proyecto.
- `POST /api/projects/:id/tasks`: Alta de tarea asociada al proyecto.
- `GET|PUT|DELETE /api/tasks/:id`: Gestión granular de tareas individuales.
- `GET /api/projects/:id/backlog`: Backlog del proyecto.
- `POST /api/projects/:id/backlog`: Alta de ítem en el backlog.
- `GET|PUT|DELETE /api/backlog/:id`: Modificación y transiciones de estado del backlog (`BACKLOGGED -> READY -> IN_PROGRESS -> DONE`).
- `GET /api/projects/:id/sprints`: Sprints planificados y activos.
- `POST /api/projects/:id/sprints`: Creación de sprint con rango de fechas validado.
- `GET|PUT|DELETE /api/sprints/:id`: Gestión del sprint y cierre de ciclo.
- `POST /api/projects/:id/context`: Evaluación contextual de proyecto (soporta Token o X-Api-Key).

---

## 5. Knowledge Base & Metodologías

- `GET /api/methodologies`: Catálogo de metodologías (Scrum, Kanban, XP, Lean, Waterfall, Agile, Hybrid).
- `GET /api/methodologies/:id`: Detalle y prácticas de la metodología solicitada.
- `GET /api/documentation`: Estándares de ingeniería y directrices organizacionales.
- `GET /api/documentation/search`: Búsqueda ponderada de lineamientos por relevancia y metodología.
- `GET /api/templates`: Plantillas formales de artefactos de software.
- `GET /api/templates/:id`: Estructura y campos de la plantilla.
- `GET /api/processes`: Flujos de procesos estandarizados.
- `GET /api/processes/:id`: Desglose de fases y matrices RACI.
- `GET /api/checklists`: Listas de comprobación de calidad.
- `POST /api/checklists/:id/evaluate`: Evaluación automatizada de criterios de aceptación y Definition of Done.
- `GET /api/dictionary`: Catálogo terminológico para ingenieros y directores.
