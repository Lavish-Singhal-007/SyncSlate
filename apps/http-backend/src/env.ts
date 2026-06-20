import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "../../packages/db/.env"),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path, quiet: true });
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env or packages/db/.env before starting http-backend.",
  );
}

export const HTTP_PORT = Number(process.env.HTTP_PORT || 3001);
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
