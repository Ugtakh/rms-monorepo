import { connectMongo } from "./infrastructure/database/mongo/mongoose.js";

let bootstrapPromise: Promise<void> | null = null;

export const bootstrapApp = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = connectMongo();
  }

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
};
