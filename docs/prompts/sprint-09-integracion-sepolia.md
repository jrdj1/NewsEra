# Sprint 9 — Integración, Sepolia y métricas

Prompt generado a partir del ERS completo de la memoria del TFG
(`D:\TFG-NewsEra\TFG-TFM_EPS`), listo para pegar en el proyecto Claude
dedicado a este repositorio.

Requiere Sprints 0–8 completos.

---

```
Implementa el Sprint 9 de NewsEra: despliegue en Sepolia, verificación E2E
completa del sistema integrado (incluyendo la recompensa por publicación y
las predicciones del Sprint 6, y las funcionalidades de perfil enriquecido,
favoritos, seguimiento y notificaciones de los Sprints 7-8), y generación de
métricas reales para la memoria del TFG.

## Contexto del proyecto

Sprints 0-8 completos: contratos (incluyendo la ampliación de reputación por
publicación y predicciones del Sprint 6), backend y frontend funcionales
contra Hardhat Network local, incluyendo perfil enriquecido con verificación
`personal_sign`, favoritos, seguimiento de artículos y panel de
notificaciones en `Header.tsx`. Este sprint despliega en testnet pública y
prepara los datos que la memoria (`D:\TFG-NewsEra\TFG-TFM_EPS`) necesita
para completar las secciones marcadas como pendientes (macros de gas vacías,
direcciones Sepolia, LOC de backend/frontend).

---

## Tarea 1 — HU-9.1: Despliegue en Sepolia

- `npx hardhat ignition deploy ignition/modules/NewsEra.ts --network sepolia`
  (requiere `SEPOLIA_RPC_URL` y `PRIVATE_KEY` en `.env`)
- Guardar en `blockchain/deployments/sepolia.json`:
  `{ "PublicationRegistry", "ValidationRegistry", "ReputationSystem", "deployBlock", "network": "sepolia" }`
- Verificar los tres contratos en Etherscan Sepolia:
  `npx hardhat verify --network sepolia <address> <constructor-args>`
  (recordar que `ValidationRegistry` ahora recibe también la dirección de
  `PublicationRegistry` en su constructor, desde el Sprint 6)
- Actualizar `frontend/src/lib/wagmi.ts` para incluir la cadena Sepolia y las
  direcciones de contrato desde variables de entorno
  (`VITE_PUBLICATION_REGISTRY_ADDRESS`, etc.)
- Actualizar `backend/.env` con las direcciones de Sepolia y `DEPLOY_BLOCK`

Commit: `feat(deploy): despliegue y verificación en Sepolia`

---

## Tarea 2 — HU-9.2: Verificación E2E manual sobre Sepolia

Ejecutar manualmente el flujo completo contra Sepolia real (con ETH de
testnet, usando al menos tres cuentas distintas), cubriendo el ciclo
central, la reputación por publicación/predicciones del Sprint 6, y las
funcionalidades de perfil de los Sprints 7-8:

**Ciclo central:**
1. Conectar cartera (cuenta A) → publicar artículo: borrador → vista previa →
   hash mostrado → IPFS → `registerPublication` → visible en el feed
2. Conectar cartera (cuenta B) → votar el artículo → comprobar progreso de
   quórum y lista de votantes actualizados
3. Alcanzar consenso (quórum + supermayoría) con resultado `TRUE` →
   comprobar actualización de reputación de la cuenta B (votante) **y** de
   la cuenta A (autor, `+8` por recompensa de publicación)

**Reputación por publicación y predicciones (Sprint 6):**
4. Publicar un segundo artículo (cuenta A) y llevarlo a consenso `FALSE` →
   comprobar que la cuenta A pierde `−15` de reputación
5. Con una cuenta nueva (cuenta D, reputación 0, no puede votar de verdad):
   usar el modo predicción sobre un artículo `PENDING` → llevarlo a
   `DEFINITIVE` con otras cuentas → comprobar que la predicción se resuelve
   automáticamente (sin que la cuenta D tenga que hacer nada más) y que su
   reputación sube o baja en ±1 según acertara

**Perfil y funcionalidades del Sprint 7/8:**
6. Desde el perfil de la cuenta B: comprobar reputación propia, su evolución
   y el historial de validaciones clasificado correctamente
7. Editar perfil enriquecido (`displayName`/`avatarUrl`/`email`) → confirmar
   que pide firma `personal_sign` y que rechaza la actualización si se
   manipula la dirección en la petición
8. Marcar el artículo como favorito (cuenta A) → comprobar que aparece en la
   pestaña "Favoritos" del perfil
9. Seguir el artículo (cuenta A, sin haber votado) → provocar un cambio de
   estado (p. ej. una reapertura con cuenta C) → comprobar que aparece la
   notificación en el icono de `Header.tsx` con el badge de no leídas
   correcto, y que "Marcar como leída" actualiza el contador
10. Solicitar reapertura (cuenta C) → alcanzar el umbral → nueva ronda →
    votar de forma contraria al resultado original → reclamar reputación
    retroactiva (cuenta B) → comprobar el `netDelta` aplicado

Documentar el resultado (capturas o notas) en `docs/verificacion-sepolia.md`.

Commit: `docs: verificación E2E manual sobre Sepolia`

---

## Tarea 3 — HU-9.3 y HU-9.4: Métricas reales

- Configurar `hardhat-gas-reporter` en `blockchain/hardhat.config.ts`
- `REPORT_GAS=true npx hardhat test` — capturar el coste de
  `registerPublication`, `submitValidation`, `requestReopen`,
  `claimRetroactiveReputation`, `submitPrediction`, `increaseReputation`,
  `decreaseReputation`
- `npx hardhat coverage` — capturar cobertura real
- Crear `scripts/generar-metricas.js` (raíz del repo) que:
  - Lee `blockchain/deployments/sepolia.json` para direcciones y `deployBlock`
  - Lee el reporte de gas y cobertura generados arriba
  - Cuenta tests pasados/totales (`blockchain`, `backend`, `frontend`)
  - Cuenta LOC de `blockchain/contracts`, `backend/src`, `frontend/src`
    (excluyendo `node_modules`, tests y archivos generados) — incluye
    automáticamente los ficheros nuevos de Sprint 6/7/8 (ampliación de
    ValidationRegistry, repositorios de perfil/favoritos/notificaciones,
    hooks, `NotificationPanel.tsx`, etc.)
  - Escribe `docs/metricas.json` siguiendo el schema de CLAUDE.md §8

Verificar: `node scripts/generar-metricas.js` genera `docs/metricas.json`
con todos los campos rellenos (ningún `null`).

Commit: `feat(metricas): script generar-metricas.js con datos reales de Sepolia`

---

## Tarea 4 — HU-9.5: README y variables de entorno

- `README.md`: instrucciones de arranque local (Hardhat Network + backend +
  frontend) y de despliegue/conexión a Sepolia
- `.env.example` completo en cada carpeta (`blockchain`, `backend`,
  `frontend`) con todas las variables usadas hasta ahora, incluyendo las
  añadidas en Sprint 7 (URLs de backend, Pinata) y Sprint 9 (Sepolia)

Commit: `docs: README operativo y .env.example completos`

---

## Criterio de éxito

- 3 contratos desplegados y verificados en Etherscan Sepolia
- `blockchain/deployments/sepolia.json` con direcciones y `deployBlock` reales
- Flujo E2E completo sin errores sobre Sepolia, documentado — incluyendo
  recompensa por publicación, predicciones, perfil enriquecido, favoritos,
  seguimiento y notificaciones
- `docs/metricas.json` relleno con valores reales (sin `null`)
- `README.md` operativo; `.env.example` completo en las tres carpetas

## Nota para la memoria del TFG

Una vez completado, avisa para actualizar en `D:\TFG-NewsEra\TFG-TFM_EPS`:
las macros de gas vacías en `contenido/datos/metricas-implementacion.tex`,
las direcciones Sepolia en la tabla de resultados, y el LOC de
backend/frontend — actualmente todo marcado como pendiente en el capítulo de
Resultados.
```
