# Informe de Diseño de la Fase de Pruebas — NewsEra

**Proyecto:** NewsEra: Plataforma descentralizada para la validación y difusión de información veraz.
**Fecha:** Julio 2026

---

## 1. Objetivo y alcance

Este documento define la estrategia de pruebas del proyecto en 4 fases secuenciales, cada una con su propia carpeta de documentación (`docs/test/<fase>/`) e implementación de tests en el código correspondiente:

| Fase | Carpeta | Qué valida |
|------|---------|-----------|
| 1 | `unitarias/` | Unidades de código aisladas (funciones, servicios, componentes) sin dependencias externas reales |
| 2 | `integracion/` | Interacción real entre 2+ componentes del sistema (servicio+BD, contrato+indexador, hook+API) |
| 3 | `sistema/` | Flujos completos de extremo a extremo a través de las 3 capas (blockchain + backend + frontend) |
| 4 | `aceptacion/` | Requisitos no funcionales (RNF del ERS) y pruebas de estrés/carga |

Las fases son **secuenciales y acumulativas**: no se pasa a la fase N+1 hasta que la fase N cumple sus criterios de éxito. Cada fase produce un informe de resultados al cerrarse; al completar las 4, se redacta un informe final consolidado.

## 2. Estado de partida (auditoría previa al diseño)

Antes de diseñar qué falta, esto es lo que ya existe, verificado en el código (no es una suposición):

- **blockchain/**: ~90 tests (Hardhat + Chai) en 4 archivos (`PublicationRegistry.ts`, `ReputationSystem.ts`, `ValidationRegistry.ts`, `test/e2e/NewsEra.e2e.ts`). Cobertura reportada en Sprint 6: 96.97% líneas / 88.46% ramas (cifra autoinformada en `CLAUDE.md`, sin artefacto de cobertura versionado en el repo). Ya incluye un E2E propio (multi-ronda, Sybil, whitewashing) — pero solo a nivel de contratos, sin backend ni frontend real.
- **backend/**: 1 archivo, `test/integration.test.ts` (~19 tests, Vitest), contra PostgreSQL real (sin mocks) — son pruebas de integración de facto, no unitarias. Sin tests de servicios/repositorios aislados.
- **frontend/**: Vitest configurado en `package.json` pero **0 archivos de test existentes**. Cobertura real: 0%.
- **CI**: solo `slither.yml` (análisis estático de contratos) corre automáticamente. Ningún workflow ejecuta tests de backend o frontend en push/PR.
- **`docs/metricas.json`**: campo `cobertura` en `null`, desactualizado desde Sprint 5.
- No existen pruebas de aceptación mapeadas a los 42 casos de uso de `docs/casos-de-uso.md`, ni pruebas de RNF, ni pruebas de estrés/carga en ninguna capa.

Esta auditoría es la que justifica el reparto de esfuerzo entre fases (§4).

## 3. Herramientas por capa

| Capa | Unitarias | Integración | Sistema | Aceptación/Estrés |
|------|-----------|-------------|---------|--------------------|
| blockchain | Hardhat + Chai | Hardhat + Chai (multi-contrato) | Hardhat + Chai (ya cubierto por `e2e/`) | `hardhat-gas-reporter` (umbrales de gas) |
| backend | Vitest + mocks manuales de repositorios | Vitest + PostgreSQL real (`make postgres`) | Vitest/script Node contra backend+chain reales | `autocannon` (carga HTTP ligera) |
| frontend | Vitest + Testing Library (nuevo) | Vitest + mock de `fetch`/API | Fuera de alcance de navegador real (ver §5, nota) | Checklist manual de RNF de UX (RNF14, RI5, RI6, RI7 del ERS) |

No se introduce un framework de automatización de navegador (Playwright/Cypress) en este ciclo — ver justificación en §5, Fase 3.

## 4. Criterios de éxito por fase (resumen — detalle en cada `docs/test/<fase>/informe.md`)

- **Fase 1 (unitarias)**: 100% de los tests nuevos y existentes en verde; cero dependencia de Docker/Postgres/nodo Hardhat en los tests unitarios nuevos; `npx tsc --noEmit` limpio en backend y frontend.
- **Fase 2 (integración)**: 100% en verde con `make postgres` levantado; cobertura de al menos los endpoints/eventos críticos no cubiertos hoy.
- **Fase 3 (sistema)**: al menos 1 escenario completo publicar→indexar→validar→consenso→reputación verificado de extremo a extremo contra backend y blockchain reales (Hardhat local), en verde.
- **Fase 4 (aceptación)**: RNF seleccionados del ERS verificados con evidencia (no solo revisión visual), y una prueba de estrés básica con umbrales explícitos (p. ej. p95 de latencia de `GET /api/v1/publications` bajo N peticiones concurrentes) documentada con resultado real.

## 5. Decisiones de diseño y su porqué

- **No se añade Playwright/Cypress en esta ronda.** Introducir automatización de navegador es un cambio de infraestructura mayor (nuevo runner, browsers headless, tiempos de CI mucho más largos) para un prototipo de TFG. La Fase 3 (sistema) se implementa como pruebas de extremo a extremo a nivel de API/proceso (backend real + Hardhat real), no de UI real — queda documentado como trabajo futuro si se necesita cobertura de UI real.
- **Los tests unitarios de backend usan mocks manuales**, no una librería de mocking adicional (evita añadir dependencia nueva; Vitest ya trae `vi.fn()`/`vi.mock()` de serie).
- **La prueba de estrés usa `autocannon`** (dependencia ligera, sin servicios externos) en vez de k6/Locust, coherente con la filosofía KISS de `CLAUDE.md` §14.
- **Los tests de blockchain no se reescriben**: la Fase 1 solo audita huecos puntuales (casos límite no cubiertos) sobre la suite ya madura, para no arriesgar una suite con 96%+ de cobertura ya verificada en sprints anteriores.

## 6. Mecanismo de ejecución (fase por fase)

Cada fase se ejecuta mediante un agente dedicado que:
1. Lee el informe de diseño específico de su fase (`docs/test/<fase>/informe.md`).
2. Diseña e implementa los tests que faltan.
3. Ejecuta la suite y compara contra los criterios de éxito de esa fase.
4. Si falla, corrige y repite el ciclo diseño→implementación→verificación hasta cumplir los criterios (o hasta identificar un bloqueo real, que se documenta explícitamente en vez de forzar un falso verde).
5. Al cerrar la fase, redacta `docs/test/<fase>/informe-resultados.md` con el resultado real obtenido (tests añadidos, comando ejecutado, salida resumida, cobertura si aplica).

Al completar las 4 fases, se redacta `docs/test/informe-final.md` consolidando los 4 informes de resultados.
