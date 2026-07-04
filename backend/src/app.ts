import { Hono } from "hono";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/errorHandler.js";
import { publicationsRouter } from "./routes/publications.js";
import { validatorsRouter } from "./routes/validators.js";
import { profileRouter } from "./routes/profile.js";
import { favoritesRouter } from "./routes/favorites.js";
import { notificationsRouter } from "./routes/notifications.js";
import { syncRouter } from "./routes/sync.js";

export const app = new Hono();

app.use(logger());
app.onError(errorHandler);

app.get("/", (c) => c.json({ status: "ok", service: "newsera-backend" }));

app.route("/api/v1/publications", publicationsRouter);
app.route("/api/v1/validators", validatorsRouter);
app.route("/api/v1/profile", profileRouter);
app.route("/api/v1/favorites", favoritesRouter);
app.route("/api/v1/notifications", notificationsRouter);
app.route("/api/v1/sync", syncRouter);
