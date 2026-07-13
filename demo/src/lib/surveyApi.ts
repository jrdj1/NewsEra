// Cliente de las 2 encuestas de validación (intensidad del problema /
// idoneidad del producto). A diferencia de src/lib/api.ts (que enruta contra
// demoStore, en memoria), esto hace fetch real a /api/survey — una función
// serverless de Vercel respaldada por Postgres (ver demo/api/survey.ts).
// Solo funciona desplegado en Vercel o vía `vercel dev`; en `npm run dev`
// normal (Vite puro) no existe /api y toda llamada falla con un error de
// red legible, gestionado por quien la usa (nunca una pantalla en blanco).
export type SurveyId = "problema" | "producto";

export async function submitSurvey(survey: SurveyId, answers: Record<string, string | number>): Promise<void> {
  const res = await fetch("/api/survey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ survey, answers }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Error al enviar la encuesta (HTTP ${res.status}).`);
  }
}

export async function getSurveyTotal(survey: SurveyId): Promise<number> {
  const res = await fetch(`/api/survey?survey=${survey}`);
  if (!res.ok) throw new Error(`Error al consultar la encuesta (HTTP ${res.status}).`);
  const body = (await res.json()) as { total: number };
  return body.total;
}

// Bloqueo de reenvío por sesión de navegador: sessionStorage (no
// localStorage) a propósito — se olvida al cerrar la pestaña, coherente con
// "no puedas volver a contestar en esa misma sesión" y no con un bloqueo
// permanente por dispositivo.
function answeredKey(survey: SurveyId): string {
  return `newsera-demo-survey-answered-${survey}`;
}

export function hasAnsweredSurvey(survey: SurveyId): boolean {
  try {
    return sessionStorage.getItem(answeredKey(survey)) === "1";
  } catch {
    return false;
  }
}

export function markSurveyAnswered(survey: SurveyId): void {
  try {
    sessionStorage.setItem(answeredKey(survey), "1");
  } catch {
    // sessionStorage no disponible (modo privado estricto) — no bloquea el envío en sí.
  }
}
