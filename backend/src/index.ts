import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { startIndexer } from "./services/indexer.js";

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`NewsEra backend listening on http://localhost:${port}`);
});

if (process.env.PUBLICATION_REGISTRY_ADDRESS) {
  startIndexer().catch((err) => console.error("[indexer] fallo al arrancar:", err));
} else {
  console.warn("[indexer] direcciones de contratos no configuradas — indexador deshabilitado");
}
