import { Hono } from "hono";
import { validatorService } from "../services/validator.service.js";

export const validatorsRouter = new Hono();

validatorsRouter.get("/", async (c) => {
  const { page, limit } = c.req.query();
  const result = await validatorService.list(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  return c.json(result);
});

validatorsRouter.get("/:address", async (c) => {
  const profile = await validatorService.getByAddress(c.req.param("address"));
  return c.json(profile);
});

validatorsRouter.get("/:address/history", async (c) => {
  const { page, limit } = c.req.query();
  const history = await validatorService.getHistory(
    c.req.param("address"),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  return c.json(history);
});

validatorsRouter.get("/:address/reputation-history", async (c) => {
  const history = await validatorService.getReputationHistory(c.req.param("address"));
  return c.json(history);
});
