import type { Express, Request, Response } from "express";
import { buildOpenApiSpec } from "./openapi.js";

const getServerUrl = (req: Request) => {
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto ?? req.protocol;
  const host = req.get("host");

  return host ? `${protocol}://${host}` : `${req.protocol}://localhost`;
};

const renderSwaggerHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RMS API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow-y: scroll;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "/docs/json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

export const registerSwagger = (app: Express): void => {
  app.get("/docs/json", (req: Request, res: Response) => {
    res.json(buildOpenApiSpec(getServerUrl(req)));
  });

  app.get("/docs", (_req: Request, res: Response) => {
    res.type("html").send(renderSwaggerHtml());
  });

  app.get("/docs/", (_req: Request, res: Response) => {
    res.type("html").send(renderSwaggerHtml());
  });
};
