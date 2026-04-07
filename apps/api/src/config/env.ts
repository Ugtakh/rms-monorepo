import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off", ""].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),

  POSTGRES_URL: z.string().min(1),
  MONGO_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  EBARIMT_POSAPI_DEFAULT_URL: z.string().default("http://localhost:7080"),
  EBARIMT_DEFAULT_MERCHANT_TIN: z.string().default(""),
  EBARIMT_STAGING_API_URL: z.string().default("https://st-api.ebarimt.mn"),
  EBARIMT_PRODUCTION_API_URL: z.string().default("https://api.ebarimt.mn"),
  EBARIMT_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  EBARIMT_STRICT_MODE: booleanFromEnv.default(false),
  EBARIMT_AUTO_SEND_DATA: booleanFromEnv.default(false)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
