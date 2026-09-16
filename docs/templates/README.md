# Catálogo de Plantillas (Templates)

Plantillas estándar disponibles para la gestión de proyectos en Sanzu y accesibles mediante el endpoint `/api/templates`.

---

## 1. User Story Template (`user-story`)
- **Metodologías:** AGILE, SCRUM, KANBAN, XP, LEAN, HYBRID
- **Categoría:** EXECUTION
- **Uso:** Especificar historias de usuario con criterios de aceptación en sintaxis Gherkin (Given/When/Then).

```markdown
# [US-XXXX] <Título de la Historia>

### Descripción
- **Como:** <rol o tipo de usuario>
- **Quiero:** <funcionalidad requerida>
- **Para:** <beneficio o impacto esperado>

### Criterios de Aceptación (Gherkin)
- **Escenario 1:** Flujo principal
  - **Dado:** <contexto o precondiciones>
  - **Cuando:** <acción ejecutada por el usuario>
  - **Entonces:** <resultado esperado verificable>
```

---

## 2. Sprint Planning Canvas (`sprint-planning`)
- **Metodologías:** SCRUM, HYBRID
- **Categoría:** PLANNING
- **Uso:** Consignar el Sprint Goal, la capacidad del equipo y los ítems del Product Backlog comprometidos.

---

## 3. Bug Report Template (`bug-report`)
- **Metodologías:** Todas
- **Categoría:** QUALITY
- **Uso:** Notificación de anomalías o fallos con pasos detallados de reproducción y trazas técnicas.

---

## 4. Project Charter Template (`project-charter`)
- **Metodologías:** WATERFALL, HYBRID, LEAN
- **Categoría:** PLANNING
- **Uso:** Acta de constitución del proyecto, justificación de negocio, hitos y gobernanza.

---

## 5. Architecture Decision Record (`architecture-decision-record`)
- **Metodologías:** XP, SCRUM, AGILE, HYBRID, WATERFALL
- **Categoría:** ARCHITECTURE
- **Uso:** Registro de decisiones de arquitectura con contexto, opciones evaluadas y consecuencias asumidas.
