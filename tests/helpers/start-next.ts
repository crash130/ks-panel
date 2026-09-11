import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { applyTestEnv, ensureTestDatabase, migrateAndSeed } from "./test-env";

async function main() {
  const port = process.argv[2] ?? "3100";
  process.env.KS_PG_PORT = process.env.KS_PG_PORT ?? "54330";
  process.env.KS_PG_DIR = process.env.KS_PG_DIR ?? ".embedded-pg-e2e";
  const url = await ensureTestDatabase();
  applyTestEnv(url);
  const envLocal = [
    `DATABASE_URL="${url}"`,
    `ENCRYPTION_KEY="${process.env.ENCRYPTION_KEY}"`,
    `SESSION_SECRET="${process.env.SESSION_SECRET}"`,
    `AUTH_SECURE_COOKIES="false"`,
    `GOOGLE_MOCK="true"`,
    `SEED_DEMO_DATA="true"`,
    `APP_URL="http://127.0.0.1:${port}"`,
  ].join("\n");
  fs.writeFileSync(path.join(process.cwd(), ".env.local"), envLocal);
  await migrateAndSeed();
  const child = spawn(
    "npx",
    ["next", "dev", "--turbopack", "-p", port, "-H", "127.0.0.1"],
    {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url, PORT: port },
    },
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
