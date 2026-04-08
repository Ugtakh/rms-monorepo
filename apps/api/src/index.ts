// import "./config/env.js";
// import http from "http";
// import { createApp } from "./app.js";
// import { env } from "./config/env.js";
// import { connectMongo } from "./infrastructure/database/mongo/mongoose.js";
// import { connectRedis, redis } from "./infrastructure/database/redis/redis.js";
// import { initializeSocket } from "./infrastructure/realtime/socket.js";

// const bootstrap = async (): Promise<void> => {
//   await Promise.all([connectMongo(), connectRedis()]);

//   const app = createApp();
//   const server = http.createServer(app);

//   initializeSocket(server);

//   server.listen(env.API_PORT, () => {
//     console.log(`API listening on ${env.API_PORT}`);
//   });

//   const shutdown = async () => {
//     await Promise.allSettled([redis.quit()]);
//     server.close(() => process.exit(0));
//   };

//   process.on("SIGINT", shutdown);
//   process.on("SIGTERM", shutdown);
// };

// void bootstrap();

import { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app.js";
import { connectMongo } from "../src/infrastructure/database/mongo/mongoose.js";
import { connectRedis, redis } from "../src/infrastructure/database/redis/redis.js";
// import { initializeSocket } from "../src/infrastructure/realtime/socket.js";

const app = createApp();

// Vercel function-д зориулсан bootstrap
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Serverless-д cold start connection reuse
    await connectMongo();
    await connectRedis();

    // Socket server хийгдэхгүй, serverless-д ашиглагдахгүй
    // initializeSocket(...) ашиглах боломжгүй

    app(req as any, res as any);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};