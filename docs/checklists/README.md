# Listas de Comprobación y Verificación (Checklists)

Listas de verificación auditables para el control de calidad en Sanzu, consultables en `/api/checklists` y evaluables en tiempo real mediante `POST /api/checklists/:id/evaluate`.

---

## 1. Definition of Ready (`definition-of-ready`)
- **Etapa:** READY (Antes de comprometer trabajo en un ciclo)
- **Ítems Obligatorios:**
  - Título y descripción con valor de negocio claro.
  - Criterios de aceptación en formato Gherkin.
  - Dependencias identificadas y resueltas.
  - Estimación acordada por el equipo.
  - Alcance realizable dentro de una única iteración.

---

## 2. Definition of Done (`definition-of-done`)
- **Etapa:** DONE (Antes de dar por finalizado un trabajo o incremento)
- **Ítems Obligatorios:**
  - Cumplimiento total de criterios de aceptación.
  - Code Review aprobado por al menos un revisor par.
  - Pruebas unitarias e integración en verde.
  - Verificación de tipos TypeScript (`npm run typecheck`) sin fallos.
  - Documentación de API o notas técnicas actualizadas.

---

## 3. Sprint Review Checklist (`sprint-review-checklist`)
- **Etapa:** REVIEW
- **Comprobación:** Demostración con incremento funcional en ambiente integrado, tablero al día y métricas de velocidad.

---

## 4. Production Release Readiness Checklist (`release-readiness-checklist`)
- **Etapa:** RELEASE
- **Comprobación:** Pruebas de migración de base de datos validadas, secretos de producción configurados, respaldo ejecutado y plan de rollback validado.

---

## 5. Security & Privacy Compliance Checklist (`security-compliance-checklist`)
- **Etapa:** SECURITY
- **Comprobación:** Ausencia de secretos en repositorio git, validación con Zod en todas las rutas, hash de contraseñas seguro con bcrypt y validación estricta de autorización JWT.
