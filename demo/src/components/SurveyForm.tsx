import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { LikertQuestion } from "@/components/LikertQuestion";
import { Spinner } from "@/components/ui/states";
import { submitSurvey, getSurveyTotal, type SurveyId } from "@/lib/surveyApi";

export type SurveyQuestion =
  | { id: string; type: "likert"; text: string; lowLabel: string; highLabel: string }
  | { id: string; type: "text"; text: string; placeholder?: string; optional?: boolean };

export function SurveyForm({
  surveyId,
  title,
  intro,
  questions,
  thankYou,
}: {
  surveyId: SurveyId;
  title: string;
  intro: ReactNode;
  questions: SurveyQuestion[];
  thankYou: ReactNode;
}) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    getSurveyTotal(surveyId)
      .then(setTotal)
      .catch(() => setTotal(null));
  }, [surveyId]);

  const requiredQuestions = questions.filter((q) => !(q.type === "text" && q.optional));
  const isComplete = requiredQuestions.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitSurvey(surveyId, answers);
      setSubmitted(true);
      setTotal((t) => (t === null ? null : t + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la encuesta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <p className="mb-2 text-3xl">🙏</p>
        <h1 className="mb-2 text-xl font-bold">¡Gracias por responder!</h1>
        <div className="text-sm text-zinc-500">{thankYou}</div>
        {total !== null && (
          <p className="mt-4 text-xs text-zinc-400">Eres la respuesta número {total} en esta encuesta.</p>
        )}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
      <div className="mb-8 text-sm text-zinc-500">{intro}</div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q) => (
          <Card key={q.id} className="p-5">
            {q.type === "likert" ? (
              <LikertQuestion
                id={q.id}
                text={q.text}
                lowLabel={q.lowLabel}
                highLabel={q.highLabel}
                value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : undefined}
                onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
              />
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {q.text}
                  {q.optional && <span className="ml-1.5 font-normal text-zinc-400">(opcional)</span>}
                </label>
                <Textarea
                  rows={3}
                  placeholder={q.placeholder}
                  value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              </div>
            )}
          </Card>
        ))}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}{" "}
            <button type="button" onClick={() => setError(null)} className="underline underline-offset-2">
              Cerrar
            </button>
          </p>
        )}

        <Button type="submit" disabled={!isComplete || submitting} className="w-full">
          {submitting ? (
            <>
              <Spinner className="h-4 w-4 text-current" /> Enviando...
            </>
          ) : (
            "Enviar respuestas"
          )}
        </Button>
        {!isComplete && (
          <p className="text-center text-xs text-zinc-400">Responde a todas las preguntas obligatorias para enviar.</p>
        )}
      </form>
    </div>
  );
}
