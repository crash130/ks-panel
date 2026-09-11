import fs from "node:fs";
import path from "node:path";
import { applyTestEnv, ensureTestDatabase, migrateAndSeed, stopTestDatabase } from "./helpers/test-env";

const ENV_FILE = path.join(process.cwd(), ".test-env.json");

export async function setup() {
  process.env.KS_PG_PORT = process.env.KS_PG_PORT ?? "54329";
  process.env.KS_PG_DIR = process.env.KS_PG_DIR ?? ".embedded-pg-vitest";
  const url = await ensureTestDatabase();
  applyTestEnv(url);
  await migrateAndSeed();
  fs.writeFileSync(
    ENV_FILE,
    JSON.stringify({
      DATABASE_URL: url,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_SECURE_COOKIES: "false",
      GOOGLE_MOCK: "true",
      SEED_DEMO_DATA: "true",
    }),
  );
  return async () => {
    await stopTestDatabase();
  };
}
