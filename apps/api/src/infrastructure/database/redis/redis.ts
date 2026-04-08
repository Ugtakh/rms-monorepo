import { Redis } from "ioredis";
import { env } from "../../../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false
});

let redisConnectionPromise: Promise<void> | null = null;

const isRedisReady = () => redis.status === "ready";

export const connectRedis = async (): Promise<void> => {
  if (isRedisReady()) {
    return;
  }

  if (!redisConnectionPromise) {
    redisConnectionPromise = redis.connect().then(() => undefined);
  }

  try {
    await redisConnectionPromise;
  } finally {
    if (!isRedisReady()) {
      redisConnectionPromise = null;
    }
  }
};
