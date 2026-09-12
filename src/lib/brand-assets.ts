import fs from "node:fs";
import path from "node:path";

export function brandPngPath(file: "logo-mono-a.png" | "logo-mono-b.png" | "favicon.png"): string {
  return path.join(process.cwd(), "public", "brand", file);
}

export function brandPngDataUri(file: "logo-mono-a.png" | "logo-mono-b.png" | "favicon.png"): string {
  const buf = fs.readFileSync(brandPngPath(file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}
