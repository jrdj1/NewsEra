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
14. Tener que confirmar cada voto o publicación con una firma digital (una especie de "llave" personal que demuestra que eres tú) me ha resultado un paso raro o molesto para el uso normal de la web.
15. ¿Utilizarías de forma habitual NewsEra para consultar actualidad verificada si la página web contara con periodistas y publicaciones diarias? (Sí / No / Tal vez)
16. En tus propias palabras, ¿qué es lo que más te aporta o convence de esta página web? ¿Cuál crees que es su mayor dificultad para el público general? (texto libre opcional)

---

**Estado:** implementada y en producción — ya hay respuestas reales guardadas. El ítem 14 se reformuló (mismo `id`, mismo constructo: fricción de la firma/cartera digital) para que lo entienda quien no sepa qué es blockchain, quitando la referencia a MetaMask/RainbowKit y explicando el concepto en una frase. El resto de ítems no se ha tocado.
