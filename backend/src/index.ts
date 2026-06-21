import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

app.get("/", (c) => c.json({ status: "ok", service: "newsera-backend" }));

// TODO Sprint 6: registrar rutas de publicaciones, validaciones y validadores
// import { publicationsRouter } from "./routes/publications.js"
// app.route("/api/v1/publications", publicationsRouter)

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`NewsEra backend listening on http://localhost:${port}`);
});
