import { Hono } from "hono";
import { AppError } from "../errors/AppError.js";
import { getLastProcessedBlock, processHistoricalEvents } from "../services/indexer.js";

export const syncRouter = new Hono();

/**
 * Re-sincronización manual del indexador (HU-7.6). Uso interno, no expuesto
 * en el cliente: requiere Authorization: Bearer <SERVICE_TOKEN>.
 */
syncRouter.post("/events", async (c) => {
  const authHeader = c.req.header("Authorization");
  const expected = `Bearer ${process.env.SERVICE_TOKEN ?? ""}`;
  if (!authHeader || authHeader !== expected) {
    throw new AppError("UNAUTHORIZED", "Token de servicio inválido");
  }

  const lastProcessed = getLastProcessedBlock();
  // +1: el último bloque persistido ya fue procesado; reanudar en el
  // siguiente evita reprocesar sus eventos y duplicar notificaciones.
  const fromBlock = lastProcessed > 0n ? lastProcessed + 1n : 0n;
  const processedUntil = await processHistoricalEvents(fromBlock);
  return c.json({ fromBlock: fromBlock.toString(), processedUntil: processedUntil.toString() });
});
