import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../../../config/env.js";

const adapter = new PrismaPg({
  connectionString: env.POSTGRES_URL
});

export const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"]
});
