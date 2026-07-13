# Informe de Diseño de los Experimentos de Validación de Usuario

**Proyecto:** NewsEra: Plataforma descentralizada para la validación y difusión de información veraz mediante tecnología blockchain.
**Autor:** Jorge Rafael de Julián Vicedo
**Tutor:** Dr. Higinio Mora Mora
**Fecha:** Julio 2026

---

## 1. Introducción y Enfoque Metodológico

La validación con usuarios en un Trabajo Fin de Grado (TFG) de Ingeniería Informática tiene como objetivo verificar que la solución técnica propuesta responde de forma efectiva a las necesidades de sus destinatarios reales. En el caso de **NewsEra**, nos encontramos ante un reto sociotécnico: el núcleo de la aplicación se rige por conceptos complejos de arquitectura Web3 (inmutabilidad criptográfica, registros distribuidos, gobernanza comunitaria por incentivos y teoría de juegos).

Para que la experimentación sea válida y no se vea frustrada por la barrera terminológica de la tecnología subyacente, el diseño de este marco experimental adopta el principio de **abstracción funcional**. Evaluamos la robustez, seguridad y aceptación de las propiedades del sistema traduciéndolas a los *beneficios perceptibles* que experimenta el usuario común, evitando palabras técnicas que puedan sesgar o confundir la muestra.

A nivel de interfaz y comunicación, se descarta el término abstracto "sistema" en favor de "**página web**" o "**aplicación**", mejorando el modelo mental de los participantes. El flujo experimental se mantiene en dos fases estrictas y desacopladas para garantizar el rigor metodológico frente al tribunal de evaluación.

---

## 2. Experimento 1: Intensidad del Problema (Validación del Dolor)

### 2.1. Hipótesis de Investigación
* **H1 (Percepción del entorno):** Los ciudadanos perciben la falta de independencia y la distorsión intencionada de la información en los canales digitales actuales como un problema estructural generalizado.
* **H2 (Vulnerabilidad ciudadana):** Los usuarios experimentan indefensión técnica al no disponer de mecanismos directos y sencillos para fiscalizar o verificar de manera independiente la manipulación oculta de los contenidos que consumen.

### 2.2. Mapeo de Abstracción en los Ítems
* **Ítems 2 y 3 (Variables de captura):** Evalúan de forma indirecta la percepción del usuario respecto a la dependencia editorial y centralización algorítmica de los intermediarios de la información.
* **Ítem 5 (Barrera de auditoría):** Mide la necesidad latente de un registro de auditoría pública. Si el usuario declara que le es "casi imposible comprobar si un texto ha sido modificado a escondidas", se valida la pertinencia del almacenamiento inmutable y descentralizado.
* **Ítems 6 y 7 (Controles cuantitativos):** Sirven como métricas de corte duro para validar la urgencia y la viabilidad comercial de construir una alternativa.

### 2.3. Criterio de Éxito de la Validación
La hipótesis del problema se considerará **completamente validada** si:
* Un **60%** o más de la muestra califica la gravedad en el ítem 6 con valores de 4 o 5 (Grave o Muy grave).
* Un **50%** o más de la muestra responde de forma negativa ("No" o "No estoy seguro/a") al ítem 7, demostrando la ausencia de herramientas competitivas transparentes en el mercado.

---

## 3. Experimento 2: Idoneidad del Producto (Validación de la Solución)

### 3.1. Hipótesis de Investigación
* **H3 (Usabilidad del Software):** La interfaz construida mitiga la complejidad interna de las operaciones criptográficas, ofreciendo una experiencia interactiva fluida y comprensible bajo una estructura web tradicional.
* **H4 (Validación de Propiedades Complejas):** El usuario valida positivamente las características críticas de gobernanza del sistema (inmutabilidad, consenso colectivo, reputación stake-based) al experimentarlas como beneficios lógicos directos.
* **H5 (Intención de adopción):** Los beneficios de control y transparencia de la plataforma compensan la fricción que introduce la firma de operaciones mediante carteras criptográficas.

### 3.2. Evaluación de Usabilidad: Escala SUS con Adaptación Léxica
El Bloque A aplica el estándar de la industria **System Usability Scale (SUS)** (Brooke, 1996). Para asegurar una lectura natural por parte del participante, se sustituye el vocablo "sistema" por "página web" o "aplicación".

El método de cálculo para obtener una puntuación final sobre 100 sigue la fórmula matemática normalizada obligatoria:

$$\text{Puntuación SUS Total} = \left( \sum_{i=\text{impares}} (R_i - 1) + \sum_{j=\text{pares}} (5 - R_j) \right) \times 2.5$$

Donde $R$ representa la puntuación directa del usuario en el ítem de la escala. El éxito se establece en una puntuación media ponderada **igual o superior a 68**.

### 3.3. Evaluación de las Propiedades Complejas (Bloque B)
Esta sección mide la idoneidad de la arquitectura de la aplicación sin nombrar las tecnologías, mapeando las variables de la siguiente forma:

* **Ítem 11 → Evalúa la Inmutabilidad y Descentralización:** Mide si el usuario valora y comprende el beneficio de que la información se aloje en un registro donde "NADIE puede borrarla o modificarla a escondidas" (propiedad on-chain del `PublicationRegistry`).
* **Ítem 12 → Evalúa el Consenso Colectivo:** Mide la aceptación del mecanismo distributivo de votación por supermayoría (`ValidationRegistry`) frente al sesgo editorial centralizado.
* **Ítem 13 → Evalúa el Sistema de Reputación P2P:** Mide la comprensión y percepción de justicia de los algoritmos de actualización e incentivos del `ReputationSystem` (Teoría de juegos/Mecanismos anti-Sybil de Adler y de Alfaro).
* **Ítem 14 → Evalúa la Fricción Criptográfica de la Interfaz:** Aisla de forma exacta el grado de resistencia que produce la interacción nativa Web3 (MetaMask/RainbowKit) en un flujo cotidiano.

### 3.4. Criterio de Éxito de la Validación
Se considerará que el prototipo soluciona el problema de forma idónea si:
* La puntuación SUS media del Bloque A es **igual o superior a 68**.
* Al menos un **60%** de los usuarios muestra intención firme de uso en el ítem 15 marcando la opción "Sí".

---

## 4. Relevancia de los Resultados para la Memoria Técnica (Discusión del TFG)

Este diseño de experimentos aporta un valor analítico fundamental para las **Conclusiones y Trabajo Futuro (Capítulo 6)** del proyecto. Si el Bloque B arroja puntuaciones elevadas de confianza en los ítems 11, 12 y 13, pero el ítem 14 puntúa alto en desacuerdo (confirmando que conectar la cartera digital es una barrera molesta), el estudiante habrá obtenido un hallazgo de ingeniería de primer nivel.

Esto permitirá justificar científicamente en la memoria que el problema de NewsEra no reside en su arquitectura lógica *on-chain*, sino en la fricción de entrada de las tecnologías blockchain actuales. A partir de este dato, se podrá plantear con solidez técnica la implementación de técnicas avanzadas de **Account Abstraction (Abstracción de Cuenta)** como evolución prioritaria del sistema, sugiriendo la incorporación de inicios de sesión sociales que creen la billetera en segundo plano, ocultando por completo la complejidad al ciudadano ordinario.

---

## Encuestas

El texto completo de las 2 encuestas vive en archivos propios de esta misma carpeta, no aquí, para no duplicar contenido:

- [`encuesta-1-problema.md`](./encuesta-1-problema.md) — Estudio sobre el Consumo de Noticias e Información Digital (antes de ver la web).
- [`encuesta-2-producto.md`](./encuesta-2-producto.md) — Cuestionario de Evaluación de la Web NewsEra (después de usar la web).

## Nota de implementación

Ambas encuestas se implementaron literalmente en la demo (`demo/`, ver `demo/README.md` §"Encuestas de validación"), con los identificadores de cada pregunta (`item1`..`item16`) alineados con la numeración de los archivos de encuesta, para poder cruzar las respuestas JSONB crudas almacenadas en Postgres con estos documentos al calcular la puntuación SUS y los criterios de éxito — el cálculo de la fórmula SUS y los porcentajes de corte no se hacen en el cliente, son parte del análisis posterior de los datos recogidos (Capítulo 6 de la memoria).

El ítem 14 de la Encuesta 2 se reformuló una vez, tras el diseño inicial, para que lo entienda quien no sabe qué es blockchain (quitando la referencia explícita a MetaMask/RainbowKit) — mismo `id`, mismo constructo (fricción de la firma/cartera digital), sin afectar a las respuestas ya guardadas con la redacción anterior salvo en el matiz textual de la pregunta.

**Importante:** en el momento de escribir esto ya existen respuestas reales guardadas en la base de datos para los ítems 1–16 de la Encuesta 2 y 1–7 de la Encuesta 1. Por eso ningún ítem existente se ha reformulado ni renumerado — solo se añaden ítems nuevos al final (Bloque C), para no invalidar las respuestas ya recogidas.

Una nueva tarjeta en la escena de portada de `/` (`demo/src/pages/Intro.tsx`), junto a la tarjeta "Sobre el proyecto", enlaza a `/encuestas/problema` con el contexto necesario para responder sin haber explorado la demo, seguida de un aviso para probar la web antes de responder a `/encuestas/producto`.
