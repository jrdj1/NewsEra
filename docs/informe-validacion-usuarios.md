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

## Anexo A — Encuesta 1: Estudio sobre el Consumo de Noticias e Información Digital (antes de ver la web)

Implementada en `demo/src/pages/SurveyProblem.tsx` (`/encuestas/problema`).

Muchas gracias por participar en este estudio. Las respuestas son completamente anónimas y se utilizarán exclusivamente con fines de investigación académica en el marco de un Trabajo Fin de Grado en Ingeniería Informática. Por favor, responde con total sinceridad en base a tu experiencia diaria en internet.

### Bloque A: Tu experiencia con las noticias actuales

Indica tu grado de acuerdo con las siguientes afirmaciones (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo).

1. Con frecuencia encuentro en las redes sociales o en los diarios digitales noticias que me parecen dudosas, falsas o exageradas.
2. Confío en que los medios de comunicación tradicionales (tanto públicos como privados) ofrecen la información de forma completamente independiente, sin dejarse influir por partidos políticos o empresas que los financian.
3. Confío en que las grandes plataformas de internet (redes sociales, buscadores) muestran las publicaciones de manera neutral y transparente, sin ocultar o potenciar contenidos según sus propios intereses.
4. En alguna ocasión he compartido, interactuado o dado por buena una noticia en internet que más tarde resultó ser falsa o un bulo manipulado.
5. Cuando dudo de una noticia en internet, me resulta muy difícil, pesado o casi imposible comprobar por mí mismo/a quién la escribió originalmente, si ha sido modificada a escondidas o si las fuentes que cita son reales.

### Bloque B: Gravedad del problema

6. En general, ¿qué nivel de gravedad le otorgas al problema de que la información de actualidad esté controlada por unos pocos grupos de poder o manipulada en las redes sociales? (1 = Nada grave, 5 = Muy grave)
7. ¿Conoces o utilizas actualmente algún método o herramienta digital que te permita saber con absoluta certeza si un texto de internet ha sido modificado de forma oculta desde que se publicó? (Sí / No / No estoy seguro/a)

---

## Anexo B — Encuesta 2: Evaluación de la Plataforma NewsEra (después de usar la web)

Implementada en `demo/src/pages/SurveySolution.tsx` (`/encuestas/producto`).

Responde a este cuestionario únicamente después de haber interactuado o navegado por la versión de pruebas de la página web (revisando el listado de noticias, el apartado para publicar y el sistema de votación y puntos de los revisores).

### Bloque A: Evaluación de la usabilidad de la página web (Escala SUS)

Indica tu grado de acuerdo con las siguientes afirmaciones generales sobre el funcionamiento y diseño de la página web (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo).

1. Creo que me gustaría utilizar esta página web con frecuencia para informarme.
2. He encontrado que la página web es innecesariamente compleja.
3. Me ha parecido que la página web es fácil de usar.
4. Creo que necesitaría la ayuda de una persona experta para poder manejarme en esta página web.
5. Me ha parecido que las distintas funciones de la aplicación (leer, publicar, votar) están muy bien integradas entre sí.
6. He percibido demasiadas contradicciones o cosas incoherentes al navegar por la página web.
7. Imagino que la mayoría de la gente aprendería a utilizar esta página web de forma muy rápida.
8. Navegar y realizar acciones en esta página web me ha resultado incómodo o pesado.
9. Me he sentido muy seguro/a y con el control de la situación al confirmar acciones dentro de la página web.
10. He necesitado aprender o entender demasiadas cosas antes de poder empezar a usar esta página web de forma cómoda.

### Bloque B: Confianza en las propiedades de la aplicación

Indica tu nivel de acuerdo con las siguientes afirmaciones sobre el enfoque y las características específicas de NewsEra.

11. Me genera mucha confianza saber que, una vez que se publica una noticia en esta web, queda registrada de forma que NADIE (ni gobiernos, ni empresas, ni los propios creadores de la web) puede borrarla o modificarla a escondidas.
12. Me parece acertado que la veracidad de una noticia se decida mediante una votación transparente de revisores independientes, en lugar de dejar la decisión en manos del director de un medio o de los filtros de una red social.
13. El sistema de "puntos de reputación" (donde un revisor gana puntos si acierta con la comunidad y los pierde si se equivoca de forma continuada) me parece una forma justa y transparente de dar más peso a quienes demuestran un historial honesto.
14. El proceso de tener que conectar un monedero digital (como MetaMask/RainbowKit) y confirmar con él cada voto o publicación me resulta una barrera demasiado extraña o molesta para el uso cotidiano de la web.
15. ¿Utilizarías de forma habitual NewsEra para consultar actualidad verificada si la página web contara con periodistas y publicaciones diarias? (Sí / No / Tal vez)
16. En tus propias palabras, ¿qué es lo que más te aporta o convence de esta página web? ¿Cuál crees que es su mayor dificultad para el público general? (texto libre opcional)

---

## Nota de implementación

Ambas encuestas se implementaron literalmente en la demo (`demo/`, ver `demo/README.md` §"Encuestas de validación"), con los identificadores de cada pregunta (`item1`..`item16`) alineados con la numeración de este informe, para poder cruzar las respuestas JSONB crudas almacenadas en Postgres con este documento al calcular la puntuación SUS y los criterios de éxito — el cálculo de la fórmula SUS y los porcentajes de corte no se hacen en el cliente, son parte del análisis posterior de los datos recogidos (Capítulo 6 de la memoria).

Una nueva tarjeta en la escena de portada de `/` (`demo/src/pages/Intro.tsx`), junto a la tarjeta "Sobre el proyecto", enlaza a `/encuestas/problema` con el contexto necesario para responder sin haber explorado la demo, seguida de un aviso para probar la web antes de responder a `/encuestas/producto`.
