import type { Context } from "hono";
import { AppError } from "../errors/AppError.js";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err.status as any,
    );
  }
  console.error(err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } },
    500,
  );
}
