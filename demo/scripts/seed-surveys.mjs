// Inserta 20 respuestas SINTÉTICAS (redactadas a mano, no de personas reales)
// en cada una de las 2 encuestas de validación (survey_responses en
// Postgres/Neon), marcadas con source='seed_pilot'. Su único propósito es
// servir de dato piloto para comprobar que el formulario y el pipeline de
// análisis (fórmula SUS, cálculo de porcentajes) funcionan correctamente
// antes de recoger respuestas reales — NUNCA deben contarse como parte de
// la muestra real ni citarse como resultados de investigación en la
// memoria. Ver docs/encuestas/informe-diseno-experimentos.md
// §"Nota sobre datos piloto sintéticos" para el porqué y las salvaguardas
// (columna `source`, filtrado explícito en cualquier análisis).
//
// Cada "persona" está redactada a mano con un perfil distinto (edad,
// ocupación, alfabetización digital, postura ante la desinformación) para
// que las respuestas no sean uniformes ni todas positivas — incluye gente
// crítica, escéptica del proyecto o que no lo entiende bien, no solo
// entusiastas.
//
// Uso: node --env-file=.env.local scripts/seed-surveys.mjs
// (ejecutar desde demo/, con DATABASE_URL apuntando a la base de datos real;
// solo para un entorno de desarrollo/pruebas nuevo — no volver a ejecutar
// contra la base de datos de producción ya en uso para la recogida real)
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Falta DATABASE_URL en el entorno (usa --env-file=.env.local).");
  process.exit(1);
}
const sql = neon(connectionString);

// ── Encuesta 1: "problema" ────────────────────────────────────────────
// item1..item5: Likert 1-5 (Totalmente en desacuerdo -> Totalmente de acuerdo)
// item6: Likert 1-5 (Nada grave -> Muy grave)
// item7: "Sí" | "No" | "No estoy seguro/a"
const PROBLEMA = [
  // 1. Ana, 22, estudiante de Bellas Artes, muy activa en redes, poco técnica
  { item1: 5, item2: 2, item3: 2, item4: 4, item5: 5, item6: 5, item7: "No" },
  // 2. Roberto, 58, camionero jubilado, ve mucho la tele, confía en medios tradicionales
  { item1: 3, item2: 4, item3: 2, item4: 2, item5: 4, item6: 3, item7: "No" },
  // 3. Marta, 34, periodista freelance, muy crítica con el control mediático
  { item1: 5, item2: 1, item3: 1, item4: 3, item5: 4, item6: 5, item7: "No estoy seguro/a" },
  // 4. Iker, 19, estudiante de informática, tech-savvy
  { item1: 4, item2: 3, item3: 2, item4: 2, item5: 3, item6: 4, item7: "Sí" },
  // 5. Pilar, 45, profesora de instituto
  { item1: 4, item2: 3, item3: 2, item4: 3, item5: 5, item6: 5, item7: "No" },
  // 6. Diego, 29, desarrollador backend, muy técnico
  { item1: 4, item2: 2, item3: 2, item4: 2, item5: 3, item6: 4, item7: "Sí" },
  // 7. Carmen, 67, jubilada, baja alfabetización digital, desconfiada de lo nuevo
  { item1: 2, item2: 4, item3: 3, item4: 1, item5: 5, item6: 3, item7: "No estoy seguro/a" },
  // 8. Javier, 41, autónomo, preocupado por su madre mayor y las redes
  { item1: 4, item2: 3, item3: 2, item4: 3, item5: 4, item6: 4, item7: "No" },
  // 9. Laura, 26, community manager, conoce los algoritmos por dentro
  { item1: 5, item2: 2, item3: 1, item4: 4, item5: 4, item6: 5, item7: "No" },
  // 10. Antonio, 52, funcionario, moderado, cauto
  { item1: 3, item2: 3, item3: 3, item4: 2, item5: 3, item6: 3, item7: "No" },
  // 11. Noa, 24, activista medioambiental, desconfía de grandes plataformas
  { item1: 5, item2: 1, item3: 1, item4: 3, item5: 4, item6: 5, item7: "No" },
  // 12. Fran, 37, ingeniero industrial, pragmático y frío
  { item1: 3, item2: 3, item3: 3, item4: 1, item5: 3, item6: 3, item7: "No estoy seguro/a" },
  // 13. Elena, 31, madre de dos niños pequeños, poco tiempo para informarse
  { item1: 4, item2: 3, item3: 2, item4: 3, item5: 5, item6: 4, item7: "No" },
  // 14. Bruno, 44, camarero, escaso conocimiento técnico
  { item1: 3, item2: 3, item3: 3, item4: 2, item5: 5, item6: 3, item7: "No" },
  // 15. Sara, 27, doctoranda en ciencias políticas, estudia la desinformación
  { item1: 5, item2: 2, item3: 1, item4: 2, item5: 3, item6: 5, item7: "No estoy seguro/a" },
  // 16. Óscar, 63, exprofesor universitario jubilado, tech-literate para su edad
  { item1: 4, item2: 2, item3: 2, item4: 1, item5: 4, item6: 4, item7: "No" },
  // 17. Yasmin, 20, estudiante de comunicación audiovisual, muy activa en TikTok
  { item1: 5, item2: 3, item3: 2, item4: 5, item5: 4, item6: 4, item7: "No" },
  // 18. Miguel, 39, guardia civil, cauteloso con la identidad online
  { item1: 3, item2: 3, item3: 2, item4: 1, item5: 4, item6: 4, item7: "No estoy seguro/a" },
  // 19. Alba, 33, diseñadora UX
  { item1: 4, item2: 2, item3: 2, item4: 2, item5: 3, item6: 4, item7: "No" },
  // 20. Rubén, 48, taxista, escéptico por naturaleza con "inventos de internet"
  { item1: 4, item2: 3, item3: 2, item4: 2, item5: 5, item6: 4, item7: "No" },
];

// ── Encuesta 2: "producto" ────────────────────────────────────────────
// item1..item10: escala SUS 1-5 (impares = afirmación positiva, pares = negativa)
// item11..item14: Likert 1-5 (item14 es fricción: más alto = más molesto)
// item15: "Sí" | "No" | "Tal vez"
// item16: texto libre (opcional — cadena vacía si no responde)
const PRODUCTO = [
  // 1. Ana — le convence la idea pero la cartera la desconcierta
  {
    item1: 4, item2: 3, item3: 3, item4: 3, item5: 4, item6: 2, item7: 3, item8: 3, item9: 3, item10: 4,
    item11: 5, item12: 4, item13: 4, item14: 4, item15: "Tal vez",
    item16: "Me gusta la idea de que nadie pueda borrar nada, pero lo de la cartera digital al principio no entendía muy bien qué tenía que hacer.",
  },
  // 2. Roberto — encuentra la web complicada, poco entusiasta
  {
    item1: 2, item2: 4, item3: 2, item4: 4, item5: 3, item6: 3, item7: 2, item8: 4, item9: 2, item10: 4,
    item11: 4, item12: 3, item13: 3, item14: 5, item15: "No",
    item16: "Para gente como yo, que no hemos crecido con esto, es bastante lioso. Lo del monedero ese no lo entendí bien.",
  },
  // 3. Marta — muy informada, entusiasta de la descentralización, comentario largo y crítico
  {
    item1: 4, item2: 2, item3: 4, item4: 2, item5: 4, item6: 2, item7: 4, item8: 2, item9: 4, item10: 2,
    item11: 5, item12: 5, item13: 4, item14: 3, item15: "Sí",
    item16: "Como periodista, me parece un enfoque honesto de verdad al problema, no un parche más. Lo que más me convence es que las reglas de consenso son las mismas para todos, incluido quien lo creó. Lo que más dudo es si habrá suficientes personas dispuestas a validar con constancia para que funcione a diario.",
  },
  // 4. Iker — tech-savvy, todo le parece fácil, crítico sobre coordinación de votos
  {
    item1: 4, item2: 2, item3: 5, item4: 1, item5: 4, item6: 1, item7: 5, item8: 1, item9: 4, item10: 1,
    item11: 5, item12: 4, item13: 4, item14: 1, item15: "Sí",
    item16: "Muy intuitivo para mí. Mi duda es qué pasa si un grupo grande se pone de acuerdo para votar todos lo mismo aunque sea falso — imagino que la reputación lo compensa a largo plazo pero no me quedó del todo claro.",
  },
  // 5. Pilar — profesora, valora el proyecto pero preocupada por manipulación de reputación
  {
    item1: 3, item2: 3, item3: 3, item4: 3, item5: 4, item6: 2, item7: 3, item8: 3, item9: 3, item10: 3,
    item11: 5, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "Me preocupa un poco que un grupo organizado pueda subir su reputación votando siempre en bloque. Aun así, la idea de fondo me parece mucho mejor que dejarlo en manos de un algoritmo de una empresa.",
  },
  // 6. Diego — desarrollador, sin problemas de uso, crítico sobre coste/escalabilidad
  {
    item1: 3, item2: 2, item3: 5, item4: 1, item5: 4, item6: 1, item7: 5, item8: 1, item9: 4, item10: 1,
    item11: 5, item12: 5, item13: 4, item14: 2, item15: "Sí",
    item16: "Desde el punto de vista técnico está bien planteado. Mi única pega es el coste de cada transacción si esto llegase a tener mucho tráfico real — eso no lo he visto resuelto en la demo.",
  },
  // 7. Carmen — jubilada, todo le resulta confuso, escéptica del proyecto entero
  {
    item1: 1, item2: 5, item3: 1, item4: 5, item5: 2, item6: 4, item7: 1, item8: 5, item9: 2, item10: 5,
    item11: 3, item12: 2, item13: 2, item14: 5, item15: "No",
    item16: "No lo he entendido muy bien, la verdad. Yo para las noticias prefiero seguir viendo el telediario de toda la vida.",
  },
  // 8. Javier — autónomo, positivo pero cauto con la curva de aprendizaje para gente mayor
  {
    item1: 3, item2: 3, item3: 3, item4: 3, item5: 3, item6: 2, item7: 3, item8: 3, item9: 3, item10: 4,
    item11: 4, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "A mí me convence, pero pienso en mi madre y sé que a ella esto de la cartera digital le iba a costar mucho. Habría que simplificarlo si se quiere llegar a todo el mundo.",
  },
  // 9. Laura — community manager, muy crítica con algoritmos, duda de escalabilidad de contenido
  {
    item1: 4, item2: 2, item3: 3, item4: 2, item5: 4, item6: 2, item7: 3, item8: 2, item9: 4, item10: 3,
    item11: 5, item12: 5, item13: 4, item14: 3, item15: "Sí",
    item16: "Después de años viendo cómo se manipulan los algoritmos de las redes, esto me parece un soplo de aire fresco. Lo único que dudo es si habrá suficiente contenido publicado a diario como para competir con la inmediatez de las redes sociales.",
  },
  // 10. Antonio — funcionario moderado, pregunta explícitamente por manipulación coordinada
  {
    item1: 3, item2: 3, item3: 3, item4: 2, item5: 3, item6: 2, item7: 3, item8: 3, item9: 3, item10: 3,
    item11: 4, item12: 4, item13: 3, item14: 3, item15: "Tal vez",
    item16: "¿Cómo se evita que un grupo se ponga de acuerdo para votar mal a propósito y hundir a alguien? Esa es mi mayor duda, el resto me parece razonable.",
  },
  // 11. Noa — activista, apoya fuerte la descentralización, crítica con la barrera cripto
  {
    item1: 4, item2: 3, item3: 3, item4: 2, item5: 4, item6: 2, item7: 4, item8: 3, item9: 3, item10: 3,
    item11: 5, item12: 5, item13: 4, item14: 4, item15: "Sí",
    item16: "Apoyo totalmente la idea de quitarle el poder a las grandes plataformas. Mi crítica es que exigir una cartera cripto deja fuera a mucha gente que no tiene ni el dinero ni el conocimiento para usarla — eso hay que resolverlo si se quiere que sea de verdad para todos.",
  },
  // 12. Fran — ingeniero, pragmático, neutro-crítico sobre adopción masiva
  {
    item1: 2, item2: 2, item3: 4, item4: 2, item5: 3, item6: 2, item7: 3, item8: 2, item9: 3, item10: 2,
    item11: 4, item12: 4, item13: 3, item14: 3, item15: "Tal vez",
    item16: "Conceptualmente sólido, pero no sé si el usuario medio va a tener paciencia para todo el proceso de publicar o votar. La adopción masiva a corto plazo la veo difícil.",
  },
  // 13. Elena — madre ocupada, poco tiempo/paciencia para carteras
  {
    item1: 3, item2: 4, item3: 2, item4: 4, item5: 3, item6: 3, item7: 3, item8: 4, item9: 2, item10: 4,
    item11: 4, item12: 4, item13: 3, item14: 5, item15: "Tal vez",
    item16: "La idea del consenso me gusta, pero con dos niños pequeños no tengo tiempo para andar entendiendo carteras digitales. Necesitaría que fuese más simple todavía.",
  },
  // 14. Bruno — camarero, comentario coloquial y directo
  {
    item1: 3, item2: 3, item3: 3, item4: 3, item5: 3, item6: 3, item7: 3, item8: 3, item9: 2, item10: 4,
    item11: 5, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "Que nadie pueda borrar lo que se publica mola bastante, la verdad. Lo de la cartera me costó un poco pillarlo pero al final tiré para adelante.",
  },
  // 15. Sara — doctoranda, analítica, cuestiona el elitismo de quién tiene tiempo para validar
  {
    item1: 4, item2: 2, item3: 3, item4: 2, item5: 4, item6: 2, item7: 3, item8: 2, item9: 4, item10: 2,
    item11: 5, item12: 4, item13: 3, item14: 3, item15: "Sí",
    item16: "Me interesa mucho el mecanismo, pero académicamente me pregunto si no acaba favoreciendo a quien tiene más tiempo libre para validar constantemente, más que a quien tiene más criterio.",
  },
  // 16. Óscar — exprofesor jubilado, valora la inmutabilidad, teme censura indirecta
  {
    item1: 3, item2: 2, item3: 3, item4: 2, item5: 4, item6: 2, item7: 3, item8: 2, item9: 4, item10: 3,
    item11: 5, item12: 4, item13: 3, item14: 3, item15: "Tal vez",
    item16: "Que no se pueda borrar nada me parece una garantía muy valiosa. Mi única duda es si una mayoría organizada podría, en la práctica, silenciar una opinión minoritaria pero cierta.",
  },
  // 17. Yasmin — estudiante audiovisual, echa en falta contenido multimedia
  {
    item1: 4, item2: 3, item3: 3, item4: 3, item5: 3, item6: 3, item7: 3, item8: 3, item9: 3, item10: 3,
    item11: 4, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "Me parece una idea genial pero muy centrada en texto. Yo consumo noticias sobre todo en vídeo corto, y aquí se echa en falta ese formato.",
  },
  // 18. Miguel — guardia civil, cauteloso con identidad/verificación real
  {
    item1: 3, item2: 3, item3: 3, item4: 2, item5: 3, item6: 2, item7: 3, item8: 3, item9: 3, item10: 3,
    item11: 4, item12: 3, item13: 3, item14: 3, item15: "Tal vez",
    item16: "Me queda la duda de cómo se sabe quién hay detrás de cada validador. Si es totalmente anónimo, ¿cómo se evita que la misma persona controle varias cuentas?",
  },
  // 19. Alba — diseñadora UX, buena letra sobre usabilidad, crítica puntual de fricción
  {
    item1: 4, item2: 2, item3: 4, item4: 2, item5: 4, item6: 2, item7: 4, item8: 2, item9: 3, item10: 2,
    item11: 4, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "El diseño en general es limpio y se entiende bien. El único punto de fricción real que veo es el paso de conectar la cartera — ahí se puede perder a bastante gente que no está familiarizada.",
  },
  // 20. Rubén — taxista escéptico, sorprendido tras probarla
  {
    item1: 4, item2: 3, item3: 3, item4: 3, item5: 3, item6: 2, item7: 3, item8: 3, item9: 3, item10: 3,
    item11: 4, item12: 4, item13: 3, item14: 4, item15: "Tal vez",
    item16: "La verdad es que entré pensando que era otro invento más de internet, pero después de trastear un rato me ha convencido más de lo que esperaba.",
  },
];

if (PROBLEMA.length !== 20 || PRODUCTO.length !== 20) {
  throw new Error("Se esperaban 20 personas por encuesta.");
}

await sql`
  CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    survey TEXT NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT NOT NULL DEFAULT 'live'
  )
`;
await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'live'`;

// created_at usa el momento real de inserción (now() por defecto) y
// source='seed_pilot' explícito: no hay ningún motivo para disfrazar estas
// filas de respuestas orgánicas — están marcadas y documentadas como lo que
// son, y se excluyen del análisis real mediante ese mismo campo.
let inserted = 0;
for (const answers of PROBLEMA) {
  await sql`INSERT INTO survey_responses (survey, answers, source) VALUES ('problema', ${JSON.stringify(answers)}::jsonb, 'seed_pilot')`;
  inserted++;
}
for (const answers of PRODUCTO) {
  await sql`INSERT INTO survey_responses (survey, answers, source) VALUES ('producto', ${JSON.stringify(answers)}::jsonb, 'seed_pilot')`;
  inserted++;
}

console.log(`Insertadas ${inserted} respuestas piloto sintéticas (20 "problema" + 20 "producto"), marcadas source='seed_pilot'.`);
