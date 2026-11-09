# Integración continua de Sanzu (DO-01)

El flujo está en `.github/workflows/ci.yml` y corre en GitHub Actions.

## Qué hace

| Cuándo | Trabajo | Qué pasa |
|---|---|---|
| Push a `main`, `dev`, `develop` o `QA`, y cualquier pull request | **Pruebas** | Instala con `npm ci`, genera el cliente de Prisma, revisa los tipos con `npm run typecheck` y corre `npm test`. Si algo falla, el trabajo queda en rojo. |

Sanzu todavía no se despliega, así que no tiene trabajo de despliegue. Las pruebas no usan base de datos real, así que no hace falta configurar secretos.

## Configuración (una sola vez, la hace quien administra el repositorio)

- **GitHub → Settings → Branches → Add branch ruleset** para `main` y la rama de trabajo.
- Activar **Require status checks to pass** y elegir el check **Pruebas**, para que un pull request con pruebas fallidas no se pueda fusionar.

## Cómo comprobarlo

1. Abrir un pull request: en la pestaña **Checks** aparece **CI Sanzu / Pruebas** y debe quedar en verde.
2. Una rama con una prueba rota a propósito debe quedar en rojo.