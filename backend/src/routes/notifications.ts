import { Hono } from "hono";
import { notificationService } from "../services/notification.service.js";

export const notificationsRouter = new Hono();

notificationsRouter.patch("/:id/read", async (c) => {
  const notification = await notificationService.markRead(Number(c.req.param("id")));
  return c.json(notification);
});
