import { Link } from "react-router-dom";
import { SurveyForm, type SurveyQuestion } from "@/components/SurveyForm";

// Contenido literal de "Encuesta 1: Estudio sobre el Consumo de Noticias e
// Información Digital" (informe de diseño de experimentos de validación de
// usuario, TFG NewsEra) — los id conservan el número de ítem del informe
// (item1..item7) para poder cruzar las respuestas JSONB con ese documento.
const QUESTIONS: SurveyQuestion[] = [
  {
    id: "bloque_a",
    type: "heading",
    text: "Bloque A: Tu experiencia con las noticias actuales",
    description:
      "Indica tu grado de acuerdo con las siguientes afirmaciones (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo).",
  },
  {
    id: "item1",
    type: "likert",
    text: "Con frecuencia encuentro en las redes sociales o en los diarios digitales noticias que me parecen dudosas, falsas o exageradas.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item2",
    type: "likert",
    text: "Confío en que los medios de comunicación tradicionales (tanto públicos como privados) ofrecen la información de forma completamente independiente, sin dejarse influir por partidos políticos o empresas que los financian.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item3",
    type: "likert",
    text: "Confío en que las grandes plataformas de internet (redes sociales, buscadores) muestran las publicaciones de manera neutral y transparente, sin ocultar o potenciar contenidos según sus propios intereses.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item4",
    type: "likert",
    text: "En alguna ocasión he compartido, interactuado o dado por buena una noticia en internet que más tarde resultó ser falsa o un bulo manipulado.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "item5",
    type: "likert",
    text: "Cuando dudo de una noticia en internet, me resulta muy difícil, pesado o casi imposible comprobar por mí mismo/a quién la escribió originalmente, si ha sido modificada a escondidas o si las fuentes que cita son reales.",
    lowLabel: "Totalmente en desacuerdo",
    highLabel: "Totalmente de acuerdo",
  },
  {
    id: "bloque_b",
    type: "heading",
    text: "Bloque B: Gravedad del problema",
  },
  {
    id: "item6",
    type: "likert",
    text: "En general, ¿qué nivel de gravedad le otorgas al problema de que la información de actualidad esté controlada por unos pocos grupos de poder o manipulada en las redes sociales?",
    lowLabel: "Nada grave",
    highLabel: "Muy grave",
  },
  {
    id: "item7",
    type: "choice",
    text: "¿Conoces o utilizas actualmente algún método o herramienta digital que te permita saber con absoluta certeza si un texto de internet ha sido modificado de forma oculta desde que se publicó?",
    options: ["Sí", "No", "No estoy seguro/a"],
  },
];

export default function SurveyProblem() {
  return (
    <SurveyForm
      surveyId="problema"
      title="Estudio sobre el Consumo de Noticias e Información Digital"
      intro={
        <>
          Muchas gracias por participar en este estudio. Las respuestas son completamente anónimas
          y se utilizarán exclusivamente con fines de investigación académica en el marco de un
          Trabajo Fin de Grado en Ingeniería Informática. Por favor, responde con total sinceridad
          en base a tu experiencia diaria en internet — no hace falta haber explorado la demo
          todavía.
        </>
      }
      questions={QUESTIONS}
      thankYou={
        <>
          Tus respuestas ayudan a validar si el problema que NewsEra intenta resolver es real y
          relevante. Si quieres seguir ayudando, prueba primero la demo (noticias, publicar,
          validar) y cuéntanos qué te parece la solución en la{" "}
          <Link to="/encuestas/producto" className="text-brand underline underline-offset-2">
            segunda encuesta
          </Link>
          .
        </>
      }
    />
  );
}
