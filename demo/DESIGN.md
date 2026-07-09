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

Cada pantalla: tipografía grande, una idea, y una fotografía real a pantalla
completa como fondo (ver "Fotografías", más abajo) — nada de bloques de
texto largos ni de emojis genéricos. La única excepción deliberada es la
pantalla 7 (`#slogan`): color de marca sólido, sin foto, como respiro
visual antes del cierre.

**Contenido con datos, no con acusaciones.** La pantalla 1 (`#problema`) no
apela a un "ellos" difuso — cita una fuente concreta y verificable: el
estudio de Vosoughi, Roy y Aral publicado en *Science* (2018), que midió la
difusión de noticias verdaderas y falsas en Twitter (~126.000 historias,
~3M de personas, 4.5M de veces compartidas) y encontró que lo falso se
comparte un 70% más y llega a 1.500 personas 6 veces más rápido que lo
cierto. Mismo criterio para cualquier cifra futura en el resto de
pantallas: solo datos verificables, nunca una afirmación vaga.

### Fotografías

Fotografías reales, no ilustraciones ni emojis, todas con el mismo
tratamiento visual — blanco y negro con un punto de tono sucio/sepia —
aplicado por CSS de forma uniforme (`grayscale sepia contrast brightness`
compartido, ver `about-images.ts` / `SlideShell`), nunca editando los
archivos originales. Todas proceden de Wikimedia Commons, de dominio
público o licencia libre, con la URL directa y la licencia verificadas
antes de usarlas — con crédito visible en la pantalla 8 para las que la
licencia (CC BY / CC BY-SA) lo exige.

| Pantalla | Fotografía |
|----------|------------|
| `#problema` | Sala de rotativas de un periódico, h. 1960 |
| `#solucion` | Una multitud de personas |
| `#verdad` | *The Jury* (1861), un jurado deliberando |
| `#pilares` | Columnas del templo de Luxor, en pie desde hace milenios |
| `#innovacion` | Una bombilla incandescente encendida |
| `#blockchain` | Libro de cuentas bancario del s. XIX (1831-1870) |
| `#slogan` | (sin foto — color de marca sólido) |
| `#memoria` | Estanterías de una biblioteca |

---

## 3. Notas técnicas

- **Scroll-snap**: reutilizar la clase ya usada en `ArticleFullscreenCard`
  (`h-[calc(100dvh-4rem)] snap-start` dentro de un contenedor
  `snap-y snap-mandatory overflow-y-auto`). Navegación por puntos
  compartida entre `/` y `/about` vía `components/SlideDotNav.tsx`.
- **Tilt 3D**: efecto CSS puro (`transform: perspective(...) rotateX() rotateY()`
  actualizado en `onMouseMove`, componente `TiltCard` en `pages/Intro.tsx`),
  sin dependencias nuevas.
- **Tarjetas de pre-visualización**: `components/LivePreviewCard.tsx` — un
  `<iframe>` de la propia demo escalado con CSS (`scale-[.25]` sobre un
  contenedor `overflow-hidden`), no una captura estática: siempre refleja
  el estado real de la demo, incluida la persistencia en `localStorage`.
  Visible en `:hover` y también en `:focus`/`:blur` (navegación por
  teclado) — nunca solo con el ratón, por accesibilidad.
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
  suene a teoría de la conspiración — ver "Contenido con datos" en §2.
- Los visuales de `/about` y de la Escena 0 de `/` son **fotografías
  reales** (Wikimedia Commons, licencia libre/dominio público), no emojis
  ni ilustraciones — con un tratamiento vintage uniforme (blanco y negro +
  sepia leve) vía CSS.
- Cada escena del "mapa del tesoro" (`/`) enlaza a su ancla correspondiente
  en `/about`: Noticias→`#solucion`, Usuarios→`#pilares`,
  Publicar→`#blockchain`, Validar→`#verdad`, Perfil→`#innovacion`.

## 5. Pendiente de definir en la implementación

Todo lo anterior está implementado — sin pendientes abiertos por ahora.
