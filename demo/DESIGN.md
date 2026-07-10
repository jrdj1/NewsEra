# Diseño narrativo y visual de la demo

Este documento recoge el enfoque de diseño para dos piezas de la demo
(`demo/`, ver `README.md`): la **cinemática de apertura** en `/` y la
**página `/about`** rediseñada como una secuencia de pantallas de impacto.
No aplica al proyecto real (`frontend/`) — es exclusivo de la demo pública
sin backend ni blockchain reales.

## Filosofía

La demo no debe leerse como una aplicación con un manual de instrucciones:
debe **vivirse** como la cinemática de apertura de un videojuego. Antes de
soltar al jugador en la partida (la partida real (la página de Noticias)), el juego le
enseña el mundo, el objetivo y los controles con imágenes y muy pocas
palabras — nunca con un párrafo de reglas. Aplicado a NewsEra: antes de que
la persona visitante empiece a votar y publicar, vive una breve secuencia
visual que le planta la idea del proyecto y le enseña, pantalla a pantalla,
qué hace cada sección de la app — con la opción, en todo momento, de
asomarse más hondo (la página `/about`) sin verse obligada a hacerlo.

Regla de oro para todo el contenido de ambas piezas: **poco texto, mucho
impacto**. Si una frase no se entiende en dos segundos, se recorta o se
convierte en imagen/icono.

---

## 1. `/` — la cinemática de apertura

Nueva página de inicio de la demo, a pantalla completa con scroll-snap
vertical (mismo patrón ya usado en la página de artículos,
`ArticleFullscreenCard`). La página que hoy vive en `/` y muestra los
artículos (internamente `Feed.tsx`, sin cambio de nombre en el código) se
traslada a `/noticias`, con la etiqueta **"Noticias"** en el menú — nombre
en español claro para cualquier persona, evitando el término técnico
"feed". La cinemática se muestra **siempre** que se entra en `/` (no solo
la primera vez), con un botón de **"Saltar intro"** visible desde el
principio para quien quiera ir directo a las noticias.

### Escena 0 — Portada

Una tarjeta con efecto de inclinación 3D (`perspective` + `rotateX/rotateY`
en CSS, siguiendo el cursor — sin librerías de render 3D, mantiene la demo
ligera) que actúa como cartel de presentación del proyecto. Es, a la vez,
un enlace directo a `/about#problema` para quien quiera leer la versión
larga desde el primer segundo.

Contenido: el nombre del proyecto, una frase-gancho de una línea, y la
tarjeta-cartel. Nada más.

### Escenas 1..N — El mapa del tesoro

Una escena por cada destino principal del menú (Noticias, Usuarios,
Publicar, Validar, Perfil). Cada escena es una "sala" de la cinemática que
enseña esa pieza del juego. Estructura común a las cinco:

- **Título** de la sección (p. ej. "Validar").
- **Descripción de una frase**: qué se hace ahí y para qué sirve, en
  lenguaje llano (nada de "quórum" ni "consenso" — eso ya vive en `/about`).
- **Enlace a la porción concreta de `/about`** que profundiza en esa
  función (anclas por pantalla, ver §2), para quien quiera el porqué
  completo sin salir del hilo.
- **Icono, número de paso y explicación en dos niveles**: una frase corta
  (qué se hace) más un párrafo breve (por qué importa / cómo afecta a la
  reputación), no un titular seco.
- **Tarjeta de pre-visualización con datos reales**, siempre visible junto
  al texto (no oculta tras el ratón — ver "Vista previa", en Notas
  técnicas): así cualquier persona ve de un vistazo qué hay hoy mismo en
  esa pantalla, también desde el móvil.

### Escena final — Empezar

Llamada a la acción para entrar de verdad: botón que lleva a `/noticias`
(la página real de artículos, ahora con todo el contexto ya asimilado).

### Saltar intro

Botón/enlace persistente (p. ej. esquina superior) visible desde la
Escena 0, en todas las escenas, que lleva directo a `/noticias` — la
cinemática se ve siempre al entrar en `/`, pero nunca es obligatoria.

---

## 2. `/about` — 8 pantallas, una idea por pantalla

Mismo patrón de scroll-snap a pantalla completa. Sustituye a la página
`/about` actual (basada en párrafos). Cada pantalla es una unidad
autocontenida, ancorable (`#id`) para que la cinemática de `/` pueda
enlazar directamente a la pantalla relevante.

| # | Ancla | Contenido |
|---|-------|-----------|
| 1 | `#problema` | Los 2 problemas actuales detectados: la transmisión de información falsa y el control/industria de la información. |
| 2 | `#solucion` | La solución que propone NewsEra: verificación colectiva sobre reglas que nadie controla en solitario. |
| 3 | `#verdad` | Qué es "la verdad" aquí: no una autoridad que la dicta, sino un consenso verificable de la comunidad. |
| 4 | `#pilares` | Los pilares fundamentales de NewsEra (inmutabilidad, validación colectiva, resistencia a la captura). |
| 5 | `#innovacion` | Qué tiene NewsEra que no tengan los verificadores de siempre. |
| 6 | `#blockchain` | Qué es la blockchain, resumido, y qué aporta exactamente a resolver el problema del punto 1. |
| 7 | `#slogan` | Eslogan y llamada de atención directa a quien lee ("tú puedes..."). |
| 8 | `#memoria` | Enlace a la memoria del TFG (whitepaper) para quien quiera el detalle técnico completo. |

Cada pantalla: tipografía grande, un fondo "aurora boreal" compartido (ver
"Fondo aurora", más abajo) y una explicación con más recorrido que un mero
titular — `/about` es precisamente el sitio para extenderse un poco más
que en la cinemática de `/`, que sí se mantiene ultra-breve. La única
excepción es la pantalla 7 (`#slogan`): color de marca sólido, como
respiro visual antes del cierre.

**Contenido con datos, no con acusaciones.** La pantalla 1 (`#problema`)
no apela a un "ellos" difuso — expone dos problemas concretos, cada uno
con una fuente verificable:
1. **La transmisión de información falsa**: estudio de Vosoughi, Roy y
   Aral publicado en *Science* (2018), que midió la difusión de noticias
   verdaderas y falsas en Twitter (~126.000 historias, ~3M de personas,
   4.5M de veces compartidas) — lo falso se comparte un 70% más y llega a
   1.500 personas 6 veces más rápido que lo cierto.
2. **El control y la industria de la información**: en EE. UU. (2026),
   más de la mitad del tráfico a las grandes webs de noticias se
   concentra en sitios controlados por solo siete familias o grupos
   empresariales; en Reino Unido, tres empresas controlan el 90% de los
   periódicos nacionales.

Mismo criterio para cualquier cifra futura en el resto de pantallas: solo
datos verificables, nunca una afirmación vaga.

### Fondo aurora

Ni fotografías ni emojis genéricos: un fondo animado en tonos azules/
violetas/cian — "aurora boreal" — compartido entre `/` y `/about` (clase
`.aurora-bg` en `index.css`, una capa `position: fixed` con varios
degradados radiales desenfocados que se desplazan muy despacio). Una única
capa continua detrás de todo el scroll, no una imagen distinta por
pantalla — refuerza la sensación de estar en un mismo espacio mientras se
avanza. `prefers-reduced-motion` desactiva la animación.

`.aurora-bg` necesita `isolation: isolate` además de `position: relative`:
sin ello, el degradado (`::before` con `z-index: -1`) no queda contenido en
el contexto de apilamiento propio de `.aurora-bg`, sino en el más cercano
por encima (normalmente `<body>`), y termina pintándose detrás de fondos
sólidos ajenos — invisible en la práctica pese a calcularse bien.

---

## 3. Notas técnicas

- **Scroll-snap**: reutilizar la clase ya usada en `ArticleFullscreenCard`
  (`h-[calc(100dvh-4rem)] snap-start` dentro de un contenedor
  `snap-y snap-mandatory overflow-y-auto`). Navegación por puntos
  compartida entre `/` y `/about` vía `components/SlideDotNav.tsx`.
- **Tilt 3D**: efecto CSS puro (`transform: perspective(...) rotateX() rotateY()`
  actualizado en `onMouseMove`, componente `TiltCard` en `pages/Intro.tsx`),
  sin dependencias nuevas.
- **Vista previa**: `components/MiniPreview.tsx` — una maqueta en miniatura
  con **datos reales del store de la demo** (`demo/src/demo/store.ts`):
  títulos y etiquetas de artículos reales, usuarios reales con su avatar y
  reputación, el hash `keccak256` real de un artículo, votos y quórum
  reales. No un `<iframe>` de la demo entera (se probó primero y el
  resultado se veía roto al escalar la SPA completa dentro de sí misma) ni
  una maqueta abstracta de barras y círculos (no comunicaba qué hay
  realmente en cada pantalla). Se muestra **siempre visible**, no solo al
  pasar el ratón — en móvil, que es la mayoría de las visitas, no hay
  hover.
- **Sin cambios en el proyecto real**: todo esto vive únicamente en
  `demo/`, igual que el resto de shims y datos en memoria (ver
  `demo/README.md`).

## 4. Decisiones ya cerradas

- La cinemática de `/` se muestra **siempre**, con opción de saltarla en
  todo momento (enlace fijo "Saltar intro" visible desde la Escena 0).
- La página de artículos se llama **"Noticias"** en toda la interfaz
  (menú, enlaces, textos) y vive en `/noticias` — nunca "feed" de cara al
  usuario, y `/` deja de ser esa página (ahora es la cinemática).
- El tono debe apoyarse en **datos verificables**, no en un lenguaje que
  suene a teoría de la conspiración — ver "Contenido con datos" en §2. El
  problema se expone como **2 problemas concretos**: la transmisión de
  información falsa, y el control/industria de la información.
- Los visuales de `/about` y de `/` son un **fondo "aurora boreal"**
  animado (tonos azules), no fotografías ni emojis — ver "Fondo aurora"
  en §2. Se probaron fotografías vintage primero; se descartaron a favor
  de un fondo de color por preferencia explícita.
- `/about` puede (y debe) extenderse más que la cinemática de `/` en sus
  explicaciones — es la pieza pensada para profundizar, no para
  enganchar en dos segundos.
- Cada escena del "mapa del tesoro" (`/`) enlaza a su ancla correspondiente
  en `/about`: Noticias→`#solucion`, Usuarios→`#pilares`,
  Publicar→`#blockchain`, Validar→`#verdad`, Perfil→`#innovacion`.

## 5. Pendiente de definir en la implementación

Todo lo anterior está implementado — sin pendientes abiertos por ahora.
