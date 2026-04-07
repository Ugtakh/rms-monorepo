import mongoose from "mongoose";
import { env } from "../../../config/env.js";

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true
  });
};
