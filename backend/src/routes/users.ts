import { Hono } from "hono";
import { userService } from "../services/user.service.js";

export const usersRouter = new Hono();

usersRouter.get("/", async (c) => {
  const { page, limit, sort, search } = c.req.query();
  const result = await userService.list(
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    sort === "articles" ? "articles" : "reputation",
    search,
  );
  return c.json(result);
});

usersRouter.get("/:address", async (c) => {
  const profile = await userService.getByAddress(c.req.param("address"));
  return c.json(profile);
});
