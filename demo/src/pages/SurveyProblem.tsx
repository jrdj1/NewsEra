import { Link } from "react-router-dom";
import { SurveyForm, type SurveyQuestion } from "@/components/SurveyForm";

const QUESTIONS: SurveyQuestion[] = [
  {
    id: "frecuencia_desinformacion",
    type: "likert",
    text: "¿Con qué frecuencia te encuentras con noticias o publicaciones que sospechas que son falsas o engañosas en redes sociales?",
    lowLabel: "Nunca",
    highLabel: "Muy a menudo",
  },
  {
    id: "confianza_plataformas",
    type: "likert",
    text: "¿Cuánto confías en que las plataformas donde consumes noticias (redes sociales, buscadores, medios digitales) filtran eficazmente la desinformación?",
    lowLabel: "Nada",
    highLabel: "Totalmente",
  },
  {
    id: "preocupacion_discernir",
    type: "likert",
    text: "¿Cuánto te preocupa no poder distinguir con seguridad qué información es verdadera y cuál es falsa?",
    lowLabel: "Nada",
    highLabel: "Mucho",
  },
  {
    id: "frecuencia_compartir_falso",
    type: "likert",
    text: "¿Con qué frecuencia has compartido algo que luego resultó ser falso?",
    lowLabel: "Nunca",
    highLabel: "Muy a menudo",
  },
  {
    id: "confianza_fuente_unica",
    type: "likert",
    text: "¿Cuánto confías en que un solo medio de comunicación o una sola persona pueda determinar objetivamente si una noticia es verdadera?",
    lowLabel: "Nada",
    highLabel: "Totalmente",
  },
  {
    id: "deseo_verificacion_rapida",
    type: "likert",
    text: "¿Te gustaría tener una forma fiable de verificar rápidamente si una noticia concreta es verdadera antes de compartirla?",
    lowLabel: "Nada",
    highLabel: "Mucho",
  },
  {
    id: "anecdota",
    type: "text",
    text: "Cuéntanos, si quieres, la última vez que dudaste de si una noticia era verdadera o falsa.",
    placeholder: "Opcional...",
    optional: true,
  },
];

export default function SurveyProblem() {
  return (
    <SurveyForm
      surveyId="problema"
      title="¿Qué tan grave es el problema?"
      intro={
        <>
          Antes de hablar de NewsEra, queremos entender tu experiencia real con la desinformación.
          Son 6 preguntas rápidas (escala 1–5) más una pregunta abierta opcional — no hace falta haber
          explorado la demo para responder.
        </>
      }
      questions={QUESTIONS}
      thankYou={
        <>
          Tus respuestas ayudan a validar si el problema que NewsEra intenta resolver es real y
          relevante. Si quieres seguir ayudando, explora la demo y cuéntanos qué te parece la solución
          en la{" "}
          <Link to="/encuestas/producto" className="text-brand underline underline-offset-2">
            encuesta de idoneidad del producto
          </Link>
          .
        </>
      }
    />
  );
}
