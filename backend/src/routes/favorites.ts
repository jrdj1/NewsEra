import { Hono } from "hono";
import { favoriteService } from "../services/favorite.service.js";
import type { FavoriteBody } from "../types/api.js";

export const favoritesRouter = new Hono();

favoritesRouter.post("/:hash", async (c) => {
  const { userAddress } = await c.req.json<FavoriteBody>();
  const favorite = await favoriteService.add(c.req.param("hash"), userAddress);
  return c.json(favorite, 201);
});

favoritesRouter.delete("/:hash", async (c) => {
  const { userAddress } = await c.req.json<FavoriteBody>();
  await favoriteService.remove(c.req.param("hash"), userAddress);
  return c.body(null, 204);
});
