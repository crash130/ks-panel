import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

export const TEST_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
export const TEST_SESSION_SECRET = "test-session-secret-please-use-32ch";

export function applyTestEnv(databaseUrl: string) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  process.env.SESSION_SECRET = TEST_SESSION_SECRET;
  process.env.AUTH_SECURE_COOKIES = "false";
  process.env.GOOGLE_MOCK = "true";
  process.env.SEED_DEMO_DATA = "true";
  process.env.APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3100";
}

export function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env, cwd: path.resolve(__dirname, "../..") });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

export async function migrateAndSeed() {
  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npx", ["tsx", "prisma/seed.ts"]);
}

let stopPg: (() => Promise<void>) | null = null;

export async function ensureTestDatabase(): Promise<string> {
  if (process.env.KS_USE_EXISTING_DB === "true" && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const port = Number(process.env.KS_PG_PORT ?? 54329);
  const user = "ks";
  const password = "ks";
  const database = "ks_panel";
  const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

  try {
    const EmbeddedPostgres = (await import("embedded-postgres")).default;
    const pg = new EmbeddedPostgres({
      databaseDir: path.join(process.cwd(), process.env.KS_PG_DIR ?? ".embedded-pg"),
      user,
      password,
      port,
      persistent: false,
    });
    await pg.initialise();
    await pg.start();
    try {
      await pg.createDatabase(database);
    } catch {
      /* exists */
    }
    stopPg = async () => {
      await pg.stop();
    };
    return url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (existsSync("/usr/lib/postgresql")) {
      throw new Error(`Nie udało się uruchomić embedded-postgres: ${msg}`);
    }
    throw new Error(
      `Brak bazy testowej. Ustaw DATABASE_URL albo zainstaluj zależności (embedded-postgres). ${msg}`,
    );
  }
}

export async function stopTestDatabase() {
  if (stopPg) await stopPg();
}

export function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function rand() {
  return randomBytes(8).toString("hex");
}
