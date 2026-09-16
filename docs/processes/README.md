# Procesos Operativos Estándar (Processes)

Flujos de trabajo definidos para los proyectos gestionados en Sanzu, disponibles para consulta mediante el endpoint `/api/processes`.

---

## 1. Sprint Lifecycle (`sprint-lifecycle`)
- **Responsable Principal:** Scrum Master
- **Metodologías:** SCRUM, HYBRID
- **Fases del Proceso:**
  1. **Refinamiento de Backlog:** Análisis y estimación de historias asegurando el Definition of Ready.
  2. **Sprint Planning:** Definición del Sprint Goal y selección de tareas.
  3. **Ejecución Diaria e Inspección:** Daily Scrum de 15 min, resolución rápida de impedimentos.
  4. **Sprint Review y Retrospectiva:** Demostración a interesados y plan de mejora continua.

---

## 2. Continuous Risk Management (`risk-management`)
- **Responsable Principal:** Project Manager
- **Metodologías:** Todas
- **Fases del Proceso:**
  1. **Identificación de Riesgos:** Registro de amenazas de cronograma, costo o técnicas.
  2. **Evaluación de Exposición:** Cálculo de probabilidad e impacto para obtener severidad (1-12).
  3. **Planificación de Mitigación:** Asignación de mitigación obligatoria para severidad >= 8.

---

## 3. Production Release Management (`release-management`)
- **Responsable Principal:** Project Manager / Tech Lead
- **Metodologías:** AGILE, SCRUM, KANBAN, XP, WATERFALL, HYBRID
- **Fases del Proceso:**
  1. **Verificación en Staging (Staging Freeze):** Validación de suite E2E y migraciones.
  2. **Aprobación y Despliegue:** Ejecución del pipeline con comprobación de rollback.
  3. **Monitoreo y Cierre:** Supervisión de métricas de telemetría y notificación de release.
