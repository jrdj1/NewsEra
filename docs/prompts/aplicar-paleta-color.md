# Aplicar la paleta de color de la identidad visual al frontend

Prompt para llevar la paleta ya documentada (memoria `desarrollo.tex` §4.6.1,
Tabla 4.5; resumen en `CLAUDE.md` §13) a la interfaz real. No es una
funcionalidad nueva — es un ajuste visual sobre páginas ya existentes.

---

```
Aplica la paleta de color de la identidad visual de NewsEra al frontend.
Ahora mismo toda la interfaz es monocroma (blanco/negro/zinc); hay que
introducir el azul de marca para navegación/acción y colores funcionales
para los estados de consenso, sin perder el minimalismo general.

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\frontend\`. Tailwind CSS v4 (configuración
CSS-first vía `@theme` en `src/index.css`, sin `tailwind.config.js`). El
logo ya existe en `frontend/public/logo.jpg` y ya se usa en `Header.tsx`.

## Paleta a introducir

| Uso | Valor |
|-----|-------|
| Azul de marca (navegación activa, enlaces, botones primarios) | `#2563EB` |
| Estado de consenso TRUE | `#059669` (verde esmeralda) |
| Estado de consenso FALSE | `#DC2626` (rojo) |
| Estado de consenso UNVERIFIABLE / PENDING | `#D97706` (ámbar) |

**Regla de aplicación (no negociable):** el azul de marca y los colores de
estado NUNCA aparecen en la misma superficie. El azul es solo para
navegación/acción del propio usuario; los colores de estado son solo para
mostrar el veredicto de un artículo. No recolorees fondos de tarjetas,
bordes genéricos ni texto secundario — eso se queda en la escala de zinc
que ya existe. El objetivo es introducir color con intención, no decorar.

---

## Tarea 1 — Definir los tokens de color en Tailwind

En `src/index.css`, añadir un bloque `@theme` (sintaxis de Tailwind v4) con
los nuevos colores, sin tocar lo que ya existe:

```css
@import "tailwindcss";

@theme {
  --color-brand: #2563eb;
  --color-brand-dark: #1d4ed8;
  --color-consensus-true: #059669;
  --color-consensus-false: #dc2626;
  --color-consensus-unverifiable: #d97706;
}
```

Esto habilita utilidades `bg-brand`, `text-brand`, `border-brand`,
`bg-consensus-true`, `text-consensus-false`, etc. directamente en las
clases de Tailwind, sin configuración adicional.

Commit: `feat(frontend): tokens de color de marca y de estado de consenso en Tailwind`

---

## Tarea 2 — Azul de marca en navegación y acción

En `components/layout/Header.tsx`:
- El enlace de navegación activo (actualmente `bg-zinc-100 text-zinc-900`
  quema el estado activo con fondo neutro) → cambiar el indicador de activo
  a `text-brand` o un subrayado/fondo sutil en `brand` en vez de zinc.
- El enlace destacado "Empieza a ganar reputación" (actualmente
  `bg-zinc-900 text-white`) → `bg-brand text-white`.
- Pasar `accentColor: "#2563EB"` al `ConnectButton` de RainbowKit (revisar
  si el tema de RainbowKit se configura en `main.tsx`/`App.tsx` vía
  `RainbowKitProvider theme={...}` — usar `lightTheme({ accentColor: ... })`
  / `darkTheme({ accentColor: ... })` de `@rainbow-me/rainbowkit`).

En el resto de páginas, revisar y actualizar a `text-brand` /
`hover:text-brand` los enlaces de acción principal (no todos los enlaces
del sitio, solo los que representan la acción principal de cada vista):
- Botón de confirmar/publicar en `Publish.tsx`
- Botones de voto/predicción en `Validate.tsx` y `Article.tsx` (solo el
  estado *hover* o *focus*, no el fondo del botón completo si eso rompe el
  contraste con los colores de estado de consenso — usar criterio, mantener
  legible)
- Enlaces "underline" que ya existen (p. ej. nombre de artículo en
  `ArticleFullscreenCard.tsx`) → considerar `decoration-brand` o
  `hover:text-brand` en vez de solo `underline`

No cambies el color de fondo general de botones secundarios/neutros — solo
los que representan la acción primaria de la pantalla.

Commit: `feat(frontend): aplica el azul de marca a navegación activa y acciones primarias`

---

## Tarea 3 — Colores de estado de consenso

Ahora mismo ningún componente distingue visualmente TRUE/FALSE/UNVERIFIABLE
por color (todo es zinc neutro). Crear un componente reutilizable:

`frontend/src/components/ui/ConsensusBadge.tsx`:
```tsx
const STYLES: Record<string, string> = {
  TRUE: "bg-consensus-true/10 text-consensus-true",
  FALSE: "bg-consensus-false/10 text-consensus-false",
  UNVERIFIABLE: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
  PENDING: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
  DISPUTED: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
};

export function ConsensusBadge({ state, result }: { state: string; result?: string }) {
  const key = state === "DEFINITIVE" && result ? result : state;
  const label = { TRUE: "Verdadero", FALSE: "Falso", UNVERIFIABLE: "No verificable", PENDING: "Pendiente", DISPUTED: "En disputa" }[key] ?? key;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[key] ?? "bg-zinc-100 text-zinc-500"}`}>
      {label}
    </span>
  );
}
```

Usar `ConsensusBadge` (en vez del `<span>` neutro actual con
`bg-zinc-100 text-zinc-500`) en:
- `ArticleFullscreenCard.tsx` — badge de resultado sobre cada tarjeta del feed
- `Article.tsx` — estado del artículo en la vista de detalle
- `Feed.tsx` — opcionalmente, tintar el filtro activo (el botón "Falso" en
  rojo cuando está seleccionado, "Verdadero" en verde, etc.) en vez del
  fondo negro genérico actual — usar buen criterio de contraste

Commit: `feat(frontend): componente ConsensusBadge con color por estado de consenso`

---

## Tarea 4 — Favicon y color de tema del navegador

En `index.html`:
- Cambiar `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` para
  usar el logo real: `<link rel="icon" type="image/jpeg" href="/logo.jpg" />`
  (o generar un `.ico`/`.png` cuadrado a partir de `logo.jpg` con una
  herramienta externa de favicon si el resultado con el `.jpg` directo se
  ve mal recortado en la pestaña del navegador — decisión visual, usa tu
  criterio)
- Añadir `<meta name="theme-color" content="#2563EB" />` para que el
  navegador móvil tiña la barra de estado/dirección con el azul de marca

Commit: `feat(frontend): favicon y theme-color con la identidad de marca`

---

## Criterio de éxito

- `npm run build` sin errores
- Las utilidades `bg-brand`, `text-brand`, `bg-consensus-*` funcionan en
  cualquier componente sin configuración adicional
- Navegación activa, CTA principal y `ConnectButton` usan el azul de marca
- El feed y el detalle de artículo muestran el estado de consenso con color
  (`ConsensusBadge`), no solo texto neutro
- Ningún fondo de tarjeta, borde genérico ni texto secundario cambió de color
- Favicon de la pestaña del navegador muestra el logo de NewsEra
```
