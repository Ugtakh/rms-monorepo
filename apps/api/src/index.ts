import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { bootstrapApp } from "./bootstrap.js";
import { initializeSocket } from "./infrastructure/realtime/socket.js";

const bootstrap = async (): Promise<void> => {
  await bootstrapApp();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(env.API_PORT, () => {
    console.log(`API listening on ${env.API_PORT}`);
  });

  const shutdown = async () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

void bootstrap();
