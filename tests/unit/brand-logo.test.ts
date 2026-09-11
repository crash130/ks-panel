import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("brand PNG lockup", () => {
  it("Logo.tsx uses the real lockup PNG and has no SVG wordmark paths", () => {
    const src = readFileSync("src/components/Logo.tsx", "utf8");
    expect(src).toContain("/brand/logo-mono-a.png");
    expect(src).toContain("/brand/logo-mono-b.png");
    expect(src).not.toMatch(/<svg/);
    expect(src).not.toMatch(/d="M2 2h11v36/);
  });

  it("HTML export embeds the PNG lockup, not the fake IXS SVG", () => {
    const src = readFileSync("src/lib/html-export.ts", "utf8");
    expect(src).toContain('brandPngDataUri("logo-mono-a.png")');
    expect(src).not.toMatch(/viewBox="0 0 72 40"/);
    expect(src).not.toMatch(/M2 2h11v36H2z/);
  });
});
