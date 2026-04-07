import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env.js";
import { buildOpenApiSpec } from "./openapi.js";

export const registerSwagger = (app: Express): void => {
  const serverUrl = `http://localhost:${env.API_PORT}`;
  const openApiSpec = buildOpenApiSpec(serverUrl);

  app.get("/docs/json", (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: "RMS API Docs"
    })
  );
};
