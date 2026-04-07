import { Redis } from "ioredis";
import { env } from "../../../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false
});

export const connectRedis = async (): Promise<void> => {
  if (redis.status === "ready") {
    return;
  }

  await redis.connect();
};
