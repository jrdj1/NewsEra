# Encuesta 2 — Cuestionario de Evaluación de la Web NewsEra

*(después de usar la web — implementada en `demo/src/pages/SurveySolution.tsx`, `/encuestas/producto`)*

Responde a este cuestionario únicamente después de haber interactuado o navegado por la versión de pruebas de la página web (revisando el listado de noticias, el apartado para publicar y el sistema de votación y puntos de los revisores).

---

## Bloque A: Evaluación de la usabilidad de la página web (Escala SUS)

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

## Bloque B: Confianza en las propiedades de la aplicación

Indica tu nivel de acuerdo con las siguientes afirmaciones sobre el enfoque y las características específicas de NewsEra.

11. Me genera mucha confianza saber que, una vez que se publica una noticia en esta web, queda registrada de forma que NADIE (ni gobiernos, ni empresas, ni los propios creadores de la web) puede borrarla o modificarla a escondidas.
12. Me parece acertado que la veracidad de una noticia se decida mediante una votación transparente de revisores independientes, en lugar de dejar la decisión en manos del director de un medio o de los filtros de una red social.
13. El sistema de "puntos de reputación" (donde un revisor gana puntos si acierta con la comunidad y los pierde si se equivoca de forma continuada) me parece una forma justa y transparente de dar más peso a quienes demuestran un historial honesto.
14. El proceso de tener que conectar un monedero digital (como MetaMask/RainbowKit) y confirmar con él cada voto o publicación me resulta una barrera demasiado extraña o molesta para el uso cotidiano de la web.
15. ¿Utilizarías de forma habitual NewsEra para consultar actualidad verificada si la página web contara con periodistas y publicaciones diarias? (Sí / No / Tal vez)
16. En tus propias palabras, ¿qué es lo que más te aporta o convence de esta página web? ¿Cuál crees que es su mayor dificultad para el público general? (texto libre opcional)

---

## 🆕 Bloque C: Conocimiento sobre blockchain aplicado a NewsEra — PENDIENTE DE VALIDAR

Tres preguntas nuevas, propuestas para medir si el usuario entendió (no solo si confía en) las propiedades de blockchain concretas que sostienen la web, después de haberla probado. Mismo formato Likert 1-5 que el resto (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo), sin preguntas abiertas ni ambiguas, ids nuevos (`item17`-`item19`) que no chocan con nada ya guardado en la base de datos.

17. Después de usar la web, entiendo que la tecnología blockchain es la razón por la que nadie puede borrar ni modificar en secreto lo que ya se ha publicado.
18. Entiendo que, gracias a la blockchain, ningún gobierno ni empresa controla en solitario los datos de la plataforma: están repartidos entre muchos ordenadores distintos.
19. Entiendo que cualquier persona puede comprobar por sí misma el historial completo de votos y publicaciones, sin tener que fiarse de la palabra de nadie.

---

**Estado:** ítems 1–16 implementados y en producción — ya hay respuestas reales guardadas, no se han tocado. Bloque C (ítems 17–19) es una propuesta de redacción a la espera de aprobación antes de implementarla en `demo/src/pages/SurveySolution.tsx`.
