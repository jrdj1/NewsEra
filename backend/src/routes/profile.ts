import { Hono } from "hono";
import { profileService } from "../services/profile.service.js";
import type { UpdateProfileBody } from "../types/api.js";

export const profileRouter = new Hono();

profileRouter.get("/:address", async (c) => {
  const profile = await profileService.getPublic(c.req.param("address"));
  return c.json(profile);
});

profileRouter.put("/:address", async (c) => {
  const body = await c.req.json<UpdateProfileBody>();
  const profile = await profileService.update(c.req.param("address"), body);
  return c.json(profile);
});

profileRouter.get("/:address/favorites", async (c) => {
  const { page, limit } = c.req.query();
  const result = await profileService.getFavorites(
    c.req.param("address"),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  return c.json(result);
});

profileRouter.get("/:address/notifications", async (c) => {
  const { page, limit } = c.req.query();
  const result = await profileService.getNotifications(
    c.req.param("address"),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  return c.json(result);
});

profileRouter.get("/:address/reopen-requests", async (c) => {
  const result = await profileService.getReopenRequests(c.req.param("address"));
  return c.json(result);
});
