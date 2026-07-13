import { SurveyForm, type SurveyQuestion } from "@/components/SurveyForm";

const QUESTIONS: SurveyQuestion[] = [
  {
    id: "claridad",
    type: "likert",
    text: "Después de explorar la demo, ¿qué tan claro te ha quedado cómo funciona NewsEra?",
    lowLabel: "Nada claro",
    highLabel: "Totalmente claro",
  },
  {
    id: "utilidad_consenso",
    type: "likert",
    text: "¿Qué tan útil te parece que la veracidad de una noticia se determine por consenso de una comunidad de validadores, en vez de por una redacción o un algoritmo?",
    lowLabel: "Nada útil",
    highLabel: "Muy útil",
  },
  {
    id: "confianza_veredicto",
    type: "likert",
    text: "¿Cuánto confiarías en una etiqueta de 'Verdadero' que muestra un artículo si sabes que se alcanzó por votación abierta con reputación en juego?",
    lowLabel: "Nada",
    highLabel: "Totalmente",
  },
  {
    id: "probabilidad_uso_lector",
    type: "likert",
    text: "¿Qué probabilidad hay de que usaras NewsEra para leer o verificar noticias si estuviera disponible hoy?",
    lowLabel: "Ninguna",
    highLabel: "Muy alta",
  },
  {
    id: "probabilidad_uso_validador",
    type: "likert",
    text: "¿Qué probabilidad hay de que participaras como validador (votando sobre la veracidad de artículos) si tuvieras la oportunidad?",
    lowLabel: "Ninguna",
    highLabel: "Muy alta",
  },
  {
    id: "importancia_blockchain",
    type: "likert",
    text: "¿Qué tan importante te parece que las reglas de verificación estén en una blockchain pública, y no bajo el control de una empresa o gobierno concreto?",
    lowLabel: "Nada importante",
    highLabel: "Muy importante",
  },
  {
    id: "feedback_abierto",
    type: "text",
    text: "¿Qué es lo que más te ha convencido de la demo, o qué le falta para que confiaras en usarla de verdad?",
    placeholder: "Opcional...",
    optional: true,
  },
];

export default function SurveySolution() {
  return (
    <SurveyForm
      surveyId="producto"
      title="¿Es NewsEra la solución adecuada?"
      intro={
        <>
          Estas preguntas tienen más sentido después de haber explorado la demo (el feed de noticias,
          un artículo con votación, o la página "Sobre Nosotros"). 6 preguntas rápidas (escala 1–5) más
          una pregunta abierta opcional.
        </>
      }
      questions={QUESTIONS}
      thankYou={<>Tu opinión ayuda a validar si el diseño concreto de NewsEra resuelve el problema de forma convincente.</>}
    />
  );
}
