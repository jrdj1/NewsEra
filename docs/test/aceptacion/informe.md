# Fase 4 — Pruebas de Aceptación (RNF y Estrés)

## Objetivo

Verificar requisitos no funcionales concretos del ERS (`docs/ERS.md`) con evidencia reproducible, y ejecutar una prueba de estrés/carga básica con umbrales explícitos.

## Alcance concreto

### Requisitos no funcionales seleccionados (de `docs/ERS.md`)
No se verifican los 27 RNF (fuera de alcance razonable para este ciclo); se seleccionan los verificables con una prueba automatizada o un procedimiento reproducible documentado:

- **RNF 3/4** (ningún componente almacena claves privadas / backend no firma transacciones) — auditoría de código: grep de patrones de firma de clave privada en `backend/src` y `frontend/src`, debe devolver 0 coincidencias fuera de las carteras del usuario.
- **RNF 5** (Slither sin High/Critical) — ya cubierto por CI (`slither.yml`); esta fase solo confirma que el último informe (`docs/reports/slither-report.md`) sigue sin findings High/Critical.
- **RNF 6** (control de acceso siempre vía `AccessControl`) — verificado indirectamente por los tests de blockchain ya existentes (Fase 1); esta fase añade un test explícito: una dirección sin `VALIDATOR_ROLE` no puede llamar a `increaseReputation`/`decreaseReputation`.
- **RNF 8** (inmutabilidad, sin funciones de borrado/edición) — auditoría de las interfaces de los 3 contratos: confirmar que no existe ninguna función `delete*`/`update*`/`edit*` sobre datos ya registrados.
- **RNF 14 / RI 5** (estados de carga y error explícitos, nunca pantalla en blanco) — checklist manual (no automatizable sin Playwright) sobre las rutas principales del frontend, documentado con capturas o descripción del estado observado.
- **RI 7** (errores de revert traducidos a lenguaje natural) — test unitario ya cubierto en Fase 1 (`lib/errors.test.ts`); esta fase confirma que la lista de mensajes traducidos (`REVERT_MESSAGES`) cubre todos los errores personalizados realmente declarados en los contratos (`error X()` en el `.sol`), sin huecos.

### Prueba de estrés (nueva, con `autocannon`)
Contra el backend real (`make postgres && make backend` o `npm run dev`), con datos sembrados (`make fresh-start`):
- `GET /api/v1/publications` (paginado, el endpoint de lectura más usado) bajo carga concurrente moderada (p. ej. 50 conexiones, 10s).
- Umbral explícito a definir y documentar con el resultado real (p. ej. p95 < 500ms, 0 errores 5xx) — no basta con "se ejecutó", hay que registrar los números reales obtenidos.

## Criterios de éxito

- [ ] Cada RNF seleccionado tiene una verificación con evidencia (comando ejecutado + salida, no solo "se revisó visualmente").
- [ ] La prueba de estrés se ejecuta contra el backend real, con umbrales definidos *antes* de correrla (no ajustados a posteriori para que "pase").
- [ ] Resultado de la prueba de estrés documentado con números reales (p95, throughput, tasa de error), no solo "ok"/"fallo".
- [ ] Si algún RNF no se puede verificar de forma automatizada, se documenta el procedimiento manual seguido en su lugar — no se omite en silencio.
