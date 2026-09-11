import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.join(process.cwd(), ".test-env.json");
if (fs.existsSync(ENV_FILE)) {
  const env = JSON.parse(fs.readFileSync(ENV_FILE, "utf8")) as Record<string, string>;
  for (const [k, v] of Object.entries(env)) {
    if (v) process.env[k] = v;
  }
}
