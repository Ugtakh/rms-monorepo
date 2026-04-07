import "./config/env.js";
import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./infrastructure/database/mongo/mongoose.js";
import { prisma } from "./infrastructure/database/postgres/prisma.js";
import { connectRedis, redis } from "./infrastructure/database/redis/redis.js";
import { initializeSocket } from "./infrastructure/realtime/socket.js";

const bootstrap = async (): Promise<void> => {
  await Promise.all([connectMongo(), connectRedis(), prisma.$connect()]);

  const app = createApp();
  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(env.API_PORT, () => {
    console.log(`API listening on ${env.API_PORT}`);
  });

  const shutdown = async () => {
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

void bootstrap();
