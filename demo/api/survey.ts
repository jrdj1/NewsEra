// Función serverless de Vercel (independiente de Vite/React): persiste las
// respuestas de las 2 encuestas de validación (intensidad del problema /
// idoneidad del producto) en Postgres (Vercel Postgres, integración Neon).
// Único endpoint, esquema mínimo — no hay migraciones formales, coherente
// con el alcance de "satélite" de esta funcionalidad frente al resto del
// TFG (backend/ sí usa Prisma con migraciones versionadas).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const VALID_SURVEYS = new Set(["problema", "producto"]);

// neon() lanza de forma síncrona si no hay cadena de conexión — se
// construye dentro del handler (no a nivel de módulo) para que esa
// situación (DB aún no provisionada, variable de entorno no configurada
// en local) caiga en el catch como un 500 legible en vez de tumbar la
// función serverless entera al arrancar.
function getSql() {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada — falta provisionar Postgres en Vercel.");
  }
  return neon(connectionString);
}

async function ensureTable(sql: ReturnType<typeof getSql>) {
  await sql`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id SERIAL PRIMARY KEY,
      survey TEXT NOT NULL,
      answers JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source TEXT NOT NULL DEFAULT 'live'
    )
  `;
  // Columna añadida después de crear la tabla original — IF NOT EXISTS la hace
  // idempotente también sobre bases de datos ya existentes (ver
  // docs/encuestas/informe-diseno-experimentos.md §Nota sobre datos piloto).
  await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'live'`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as {
        survey?: string;
        answers?: Record<string, unknown>;
      };
      const { survey, answers } = body ?? {};

      if (!survey || !VALID_SURVEYS.has(survey)) {
        return res.status(400).json({ error: "Encuesta desconocida." });
      }
      if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
        return res.status(400).json({ error: "Respuestas inválidas." });
      }

      await sql`
        INSERT INTO survey_responses (survey, answers)
        VALUES (${survey}, ${JSON.stringify(answers)}::jsonb)
      `;
      return res.status(201).json({ ok: true });
    }

    if (req.method === "GET") {
      const survey = req.query.survey;
      if (typeof survey !== "string" || !VALID_SURVEYS.has(survey)) {
        return res.status(400).json({ error: "Encuesta desconocida." });
      }
      // Solo cuenta respuestas reales (source = 'live'); excluye los datos
      // piloto sintéticos usados para validar el formulario y el análisis
      // (ver docs/encuestas/informe-diseno-experimentos.md).
      const rows = await sql`
        SELECT COUNT(*)::int AS total FROM survey_responses WHERE survey = ${survey} AND source = 'live'
      `;
      return res.status(200).json({ total: rows[0]?.total ?? 0 });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (err) {
    console.error("[api/survey]", err);
    return res.status(500).json({ error: "Error interno al procesar la encuesta." });
  }
}
