import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "Nieprawidłowa nazwa" }, { status: 400 });
  }
  const file = path.join(process.cwd(), "uploads", name);
  try {
    const buf = await fs.readFile(file);
    const ext = name.split(".").pop();
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(buf, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }
}
