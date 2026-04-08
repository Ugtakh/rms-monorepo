import mongoose from "mongoose";
import { env } from "../../../config/env.js";

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;

const isMongoConnected = () => mongoose.connection.readyState === 1;

export const connectMongo = async (): Promise<void> => {
  if (isMongoConnected()) {
    return;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
  }

  try {
    await mongoConnectionPromise;
  } finally {
    if (!isMongoConnected()) {
      mongoConnectionPromise = null;
    }
  }
};
