# Informe Final de la Fase de Pruebas — NewsEra

**Fecha:** Julio 2026
**Rama:** `develop`
**Documentos de referencia:** `docs/test/informe-diseno.md` y los 4 informes de diseño/resultados por fase (`docs/test/<fase>/informe.md` e `informe-resultados.md`).

---

## 1. Resumen ejecutivo

Se ejecutaron las 4 fases de pruebas planificadas, cada una diseñada e implementada por un agente dedicado, verificada de forma independiente (no solo aceptando el autoinforme del agente — se re-ejecutaron los comandos reales y se contrastaron los números) antes de dar paso a la siguiente fase. Las 4 fases cumplieron sus criterios de éxito. No hubo ninguna fase que requiriera más de una iteración de corrección para llegar a verde.

Durante el proceso se encontraron y corrigieron **5 hallazgos reales** (no cosméticos) — los 2 últimos se dejaron documentados sin corregir al cierre de la Fase 4 por no ser bloqueantes, y se corrigieron a continuación a petición explícita tras revisar el informe final:
1. Una condición de carrera entre el indexador en vivo del contenedor Docker y los tests de integración (Fase 2).
2. Un error off-by-one en el cálculo de `fromBlock` que reprocesaba eventos ya gestionados (Fase 2).
3. Dos errores de revert de Solidity alcanzables desde la UI (`PredictionTargetNotDefinitive`, `AlreadyPredicted`) sin traducción a lenguaje natural — el usuario habría visto un mensaje genérico en vez de una explicación útil (Fase 4, RI 7).
4. La lista de errores de revert conocidos en `docs/ERS.md` (RI 7) estaba desactualizada desde Sprint 6 — no incluía los 3 errores de predicciones (`NotEligibleForPrediction`, `PredictionTargetNotDefinitive`, `AlreadyPredicted`) ni los de publicaciones.
5. `Profile.tsx` no exponía `isLoading`/`isError` por sección, a diferencia de `Feed.tsx`/`Article.tsx`.

## 2. Resultado por fase

| Fase | Tests nuevos | Resultado | Commit |
|---|---|---|---|
| 1 — Unitarias | backend +44, frontend +20, blockchain +3 | **44/44, 20/20, 93/93** — verificado independientemente | `19673ca` |
| 2 — Integración | backend +8, frontend +5 | **71/71 backend, 25/25 frontend** — verificado independientemente | `b0c7f4f` |
| 3 — Sistema (E2E) | 2 escenarios (principal + reapertura) | **2/2**, transacciones reales — verificado independientemente | `e03dff8` |
| 4 — Aceptación (RNF + estrés) | blockchain +4, RNF/RI auditados | **97/97 blockchain**, estrés dentro de umbral — verificado independientemente | `edbe24a` |

**Total de tests automatizados tras las 4 fases:**
- blockchain: 97 (90 preexistentes + 3 de Fase 1 + 4 de Fase 4)
- backend: 71 (integración, incluye lo añadido en Fases 1–2) + 2 (sistema, Fase 3) = 73
- frontend: 25

**Progresión de cobertura respecto al punto de partida** (ver auditoría en `docs/test/informe-diseno.md` §2):
- backend pasó de tener solo pruebas de integración a tener también una capa de tests unitarios aislados (servicios mockeados, sin BD).
- frontend pasó de **0 tests** a 25, cubriendo lógica pura, un hook con dependencias mockeadas, e integración hook↔API con MSW.
- blockchain se mantuvo en su suite madura, ampliada con 7 casos límite genuinos (no artificiales) encontrados por auditoría dirigida, no por relleno.
- Se añadió por primera vez una suite de sistema (E2E real, 3 capas) y una prueba de estrés con umbrales predefinidos — ninguna de las dos existía antes de este ciclo.

## 3. Hallazgos relevantes (más allá de "todo en verde")

### 3.1 Condición de carrera indexador↔tests (Fase 2)
El contenedor `newsera-backend` corre su propio indexador en vivo contra el mismo nodo Hardhat/Postgres que usan los tests de integración. Al truncar la BD entre tests mientras ese indexador seguía escuchando eventos, se producían violaciones de clave foránea intermitentes. Solución aplicada: los tests de integración/sistema que necesitan una BD limpia paran el contenedor antes de correr y lo reinician después (patrón documentado y repetido consistentemente en Fases 2–4). Esto es una limitación operativa real del entorno de desarrollo actual (no del diseño de producción), documentada para quien ejecute estos tests en el futuro.

### 3.2 Off-by-one en `fromBlock` (Fase 2)
Dos tests nuevos reprocesaban un bloque ya gestionado por el test anterior contra una BD recién truncada, por un límite inclusivo mal calculado. Corregido con `+1n` y captura de `fromBlock` en el punto correcto: sin este ajuste, un evento `ReputationUpdated` de registro inicial se clasificaba incorrectamente como recompensa por voto.

### 3.3 Errores de revert sin traducir (Fase 4, RI 7)
`PredictionTargetNotDefinitive` y `AlreadyPredicted` —ambos alcanzables desde `/validate` en modo predicción— no tenían entrada en `REVERT_MESSAGES` (`frontend/src/lib/errors.ts`). Un usuario real que los disparase habría visto el mensaje de fallback genérico ("Ha ocurrido un error inesperado...") en vez de una explicación de la causa real. Corregido sin tocar el test de Fase 1, que sigue en verde.

**Actualización:** la lista de RI 7 en `docs/ERS.md` se corrigió tras el cierre de la Fase 4, añadiendo `PublicationAlreadyExists`, `PublicationNotFound`, `NotEligibleForPrediction`, `PredictionTargetNotDefinitive` y `AlreadyPredicted`, con referencia cruzada al informe de resultados de Fase 4.

### 3.4 Inconsistencia de patrón en `Profile.tsx` (Fase 4, RNF 14/RI 5 — corregido)
A diferencia de `Feed.tsx`/`Article.tsx`, los hooks de datos remotos en `Profile.tsx` (y el componente `RetroactiveClaims`) no exponían `isLoading`/`isError` individualmente por sección. No llegaba a incumplir RNF 14 en sentido estricto (nunca hubo pantalla en blanco, siempre había `EmptyState`), pero era menos explícito que el resto de páginas auditadas. **Corregido tras el cierre de la Fase 4:** cada pestaña ahora renderiza `LoadingState`/`ErrorState` (con reintento) antes de caer al `EmptyState` o al listado, igual que el resto de páginas. Verificado: `tsc -b` limpio, 25/25 tests de frontend en verde, build de producción correcto.

## 4. Qué queda explícitamente fuera de alcance (decisiones de diseño, no huecos accidentales)

- **UI en navegador real (Playwright/Cypress):** decisión explícita desde `docs/test/informe-diseno.md` §5. Las pruebas de "sistema" verifican el flujo completo a nivel de API/proceso (backend + blockchain reales), no interacción real de navegador. Si el proyecto necesita cobertura de regresión visual/UI real en el futuro, es la extensión natural pendiente.
- **Cobertura exhaustiva de los 27 RNF del ERS:** la Fase 4 seleccionó un subconjunto verificable (RNF 3/4/5/6/8/14, RI 5/7) en vez de los 27, documentado explícitamente como selección deliberada, no como omisión silenciosa.
- **`docs/metricas.json`:** sigue con el campo `cobertura` desactualizado (Sprint 5) — no se ha regenerado como parte de este ciclo de pruebas; sería un buen siguiente paso (`node scripts/generar-metricas.js`) para que los números de esta fase queden también reflejados ahí.

## 5. Estado de la infraestructura al cierre

El stack Docker (`newsera-backend`, `newsera-frontend`, `newsera-db`, `newsera-hardhat`) quedó exactamente como al inicio del ciclo: los 4 contenedores arriba y healthy, confirmado tras cada fase (paradas puntuales de `newsera-backend` para evitar la condición de carrera de §3.1, siempre reiniciado y verificado `healthy` antes de continuar).

## 6. Trazabilidad

Todo el trabajo de las 4 fases está commiteado en la rama `develop`, sin push a origin (pendiente de decisión del autor sobre cuándo integrarlo a `main`/producción):

```
edbe24a test(aceptacion): RNF de seguridad/inmutabilidad y estrés de backend (Fase 4)
e03dff8 test(sistema): anade pruebas de sistema E2E contra backend e indexador reales en vivo
b0c7f4f test(integracion): amplia pruebas de integracion backend↔BD, indexador↔chain y hooks↔API
19673ca test(unitarias): implementa Fase 1 del plan de testing (unitarias)
338edab docs: informe de diseno de la fase de pruebas (unitarias/integracion/sistema/aceptacion)
```

Cada commit es revertible/auditable de forma independiente; los informes de resultados de cada fase (`docs/test/<fase>/informe-resultados.md`) documentan el comando exacto ejecutado y la salida real obtenida, no un resumen aproximado.
