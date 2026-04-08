import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { apiRouter } from "./routes/index.js";
import { registerSwagger } from "./docs/swagger.js";
import { bootstrapApp } from "./bootstrap.js";
import { HealthController } from "./modules/health/controllers/health.controller.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true
    })
  );
  app.use(morgan("combined"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  registerSwagger(app);

  app.get("/", HealthController.status);
  app.get("/health", HealthController.status);

  app.use(async (_req, _res, next) => {
    try {
      await bootstrapApp();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;
