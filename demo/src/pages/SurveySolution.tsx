import { Link } from "react-router-dom";
import { SurveyForm, type SurveyQuestion } from "@/components/SurveyForm";

// Contenido literal de "Cuestionario de Evaluación de la Web NewsEra"
// (informe de diseño de experimentos de validación de usuario, TFG NewsEra)
// — Bloque A es la escala SUS (Brooke, 1996) con "sistema" sustituido por
// "página web" (adaptación léxica documentada en el informe). Los id
// conservan el número de ítem del informe (item1..item16) para poder
// cruzar las respuestas JSONB con ese documento y aplicar la fórmula SUS
// (impares: R-1, pares: 5-R, suma x 2.5) en el análisis posterior — no se
// calcula en el cliente, solo se capturan las puntuaciones brutas.
const QUESTIONS: SurveyQuestion[] = [
  {
    id: "bloque_a",
    type: "heading",
    text: "Bloque A: Evaluación de la usabilidad de la página web (Escala SUS)",
    description:
      "Indica tu grado de acuerdo con las siguientes afirmaciones generales sobre el funcionamiento y diseño de la página web (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo).",
  },
  {
    id: "item1",
    type: "likert",
    text: "Creo que me gustaría utilizar esta página web con frecuencia para informarme.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item2",
    type: "likert",
    text: "He encontrado que la página web es innecesariamente compleja.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item3",
    type: "likert",
    text: "Me ha parecido que la página web es fácil de usar.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item4",
    type: "likert",
    text: "Creo que necesitaría la ayuda de una persona experta para poder manejarme en esta página web.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item5",
    type: "likert",
    text: "Me ha parecido que las distintas funciones de la aplicación (leer, publicar, votar) están muy bien integradas entre sí.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item6",
    type: "likert",
    text: "He percibido demasiadas contradicciones o cosas incoherentes al navegar por la página web.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item7",
    type: "likert",
    text: "Imagino que la mayoría de la gente aprendería a utilizar esta página web de forma muy rápida.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item8",
    type: "likert",
    text: "Navegar y realizar acciones en esta página web me ha resultado incómodo o pesado.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item9",
    type: "likert",
    text: "Me he sentido muy seguro/a y con el control de la situación al confirmar acciones dentro de la página web.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item10",
    type: "likert",
    text: "He necesitado aprender o entender demasiadas cosas antes de poder empezar a usar esta página web de forma cómoda.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "bloque_b",
    type: "heading",
    text: "Bloque B: Confianza en las propiedades de la aplicación",
    description: "Indica tu nivel de acuerdo con las siguientes afirmaciones sobre el enfoque y las características específicas de NewsEra.",
  },
  {
    id: "item11",
    type: "likert",
    text: 'Me genera mucha confianza saber que, una vez que se publica una noticia en esta web, queda registrada de forma que NADIE (ni gobiernos, ni empresas, ni los propios creadores de la web) puede borrarla o modificarla a escondidas.',
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item12",
    type: "likert",
    text: "Me parece acertado que la veracidad de una noticia se decida mediante una votación transparente de revisores independientes, en lugar de dejar la decisión en manos del director de un medio o de los filtros de una red social.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item13",
    type: "likert",
    text: 'El sistema de "puntos de reputación" (donde un revisor gana puntos si acierta con la comunidad y los pierde si se equivoca de forma continuada) me parece una forma justa y transparente de dar más peso a quienes demuestran un historial honesto.',
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item14",
    type: "likert",
    text: "El proceso de tener que conectar un monedero digital (como MetaMask/RainbowKit) y confirmar con él cada voto o publicación me resulta una barrera demasiado extraña o molesta para el uso cotidiano de la web.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item15",
    type: "choice",
    text: "¿Utilizarías de forma habitual NewsEra para consultar actualidad verificada si la página web contara con periodistas y publicaciones diarias?",
    options: ["Sí", "No", "Tal vez"],
  },
  {
    id: "item16",
    type: "text",
    text: "En tus propias palabras, ¿qué es lo que más te aporta o convence de esta página web? ¿Cuál crees que es su mayor dificultad para el público general?",
    placeholder: "Opcional...",
    optional: true,
  },
];

export default function SurveySolution() {
  return (
    <SurveyForm
      surveyId="producto"
      title="Cuestionario de Evaluación de la Web NewsEra"
      intro={
        <>
          Responde a este cuestionario únicamente después de haber interactuado o navegado por la
          demo (el listado de noticias, el apartado para publicar y el sistema de votación y
          puntos de los revisores). Si todavía no la has probado,{" "}
          <Link to="/noticias" className="text-brand underline underline-offset-2">
            entra a las noticias
          </Link>{" "}
          primero.
        </>
      }
      questions={QUESTIONS}
      thankYou={<>Tu opinión ayuda a validar si el diseño concreto de NewsEra resuelve el problema de forma convincente.</>}
    />
  );
}
