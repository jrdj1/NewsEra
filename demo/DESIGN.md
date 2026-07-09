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
- **Tarjeta de pre-visualización**: al pasar el ratón (o el foco, por
  accesibilidad) sobre el enlace de la sección, aparece una tarjeta con una
  vista previa real de esa página (screenshot o mini-render en vivo de un
  fragmento de la UI) — así quien quiera puede "leerlo" con solo pasar el
  ratón, sin necesidad de clicar a ciegas.

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
| 1 | `#problema` | El problema actual detectado: la desinformación y la captura de los verificadores tradicionales. |
| 2 | `#solucion` | La solución que propone NewsEra: verificación colectiva sobre reglas que nadie controla en solitario. |
| 3 | `#verdad` | Qué es "la verdad" aquí: no una autoridad que la dicta, sino un consenso verificable de la comunidad. |
| 4 | `#pilares` | Los pilares fundamentales de NewsEra (inmutabilidad, validación colectiva, resistencia a la captura). |
| 5 | `#innovacion` | Qué tiene NewsEra que no tengan los verificadores de siempre. |
| 6 | `#blockchain` | Qué es la blockchain, resumido, y qué aporta exactamente a resolver el problema del punto 1. |
| 7 | `#slogan` | Eslogan y llamada de atención directa a quien lee ("tú puedes..."). |
| 8 | `#memoria` | Enlace a la memoria del TFG (whitepaper) para quien quiera el detalle técnico completo. |

Cada pantalla: tipografía grande, una idea, un apoyo visual (icono, forma,
color de marca/consenso ya definidos en la identidad visual del proyecto —
ver `CLAUDE.md` §13). Nada de bloques de texto largos.

---

## 3. Notas técnicas

- **Scroll-snap**: reutilizar la clase ya usada en `ArticleFullscreenCard`
  (`h-[calc(100dvh-4rem)] snap-start` dentro de un contenedor
  `snap-y snap-mandatory overflow-y-auto`).
- **Tilt 3D**: efecto CSS puro (`transform: perspective(...) rotateX() rotateY()`
  actualizado en `onMouseMove`), sin dependencias nuevas.
- **Tarjetas de pre-visualización**: un componente compartido, visible en
  `:hover` y también en `:focus-visible` (navegación por teclado) — nunca
  solo con el ratón, por accesibilidad.
- **Sin cambios en el proyecto real**: todo esto vive únicamente en
  `demo/`, igual que el resto de shims y datos en memoria (ver
  `demo/README.md`).

## 4. Decisiones ya cerradas

- La cinemática de `/` se muestra **siempre**, con opción de saltarla en
  todo momento.
- La página de artículos se llama **"Noticias"** en toda la interfaz
  (menú, enlaces, textos) — nunca "feed" de cara al usuario.

## 5. Pendiente de definir en la implementación

- Contenido final (copy) de cada una de las 8 pantallas de `/about` y de
  las escenas de `/`.
- Qué captura/fragmento de UI usar en cada tarjeta de pre-visualización.
