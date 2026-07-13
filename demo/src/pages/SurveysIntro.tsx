import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasAnsweredSurvey } from "@/lib/surveyApi";

function SurveyLinkOrDone({ to, label }: { to: string; label: string }) {
  const survey = to.split("/").pop() as "problema" | "producto";
  if (hasAnsweredSurvey(survey)) {
    return <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✅ Ya has respondido — gracias.</p>;
  }
  return (
    <Link to={to}>
      <Button className="w-full sm:w-auto">{label}</Button>
    </Link>
  );
}

export default function SurveysIntro() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Ayúdanos a validar NewsEra</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Este estudio forma parte de un Trabajo Fin de Grado en Ingeniería Informática y consta de
        dos encuestas cortas, completamente anónimas. Solo se admite una respuesta por persona y
        por sesión en cada una.
      </p>

      <Card className="mb-6 p-6">
        <h2 className="mb-2 text-lg font-bold">1. Tu experiencia con las noticias</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Antes de hablar de NewsEra, queremos entender tu experiencia real con la desinformación
          en internet. No hace falta haber explorado la demo todavía — responde según tu día a día.
          Si quieres más contexto sobre el problema que intenta resolver el proyecto, puedes leer{" "}
          <Link to="/about#problema" className="text-brand underline underline-offset-2">
            Sobre el proyecto
          </Link>{" "}
          primero.
        </p>
        <SurveyLinkOrDone to="/encuestas/problema" label="Responder a la encuesta 1 →" />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-lg font-bold">2. Tu opinión sobre NewsEra</h2>
        <p className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ Responde a esta segunda encuesta únicamente después de haber probado la web (el
          listado de noticias, el apartado para publicar y el sistema de votación y puntos de los
          revisores).
        </p>
        <SurveyLinkOrDone to="/encuestas/producto" label="Responder a la encuesta 2 →" />
      </Card>
    </div>
  );
}
