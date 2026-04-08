import { connectMongo } from "./infrastructure/database/mongo/mongoose.js";
import { connectRedis } from "./infrastructure/database/redis/redis.js";

let bootstrapPromise: Promise<void> | null = null;

export const bootstrapApp = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.all([connectMongo(), connectRedis()]).then(() => undefined);
  }

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
};
