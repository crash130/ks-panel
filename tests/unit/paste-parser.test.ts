import { parseShopSpec, pickKeyParams, flattenSpecRows } from "../../src/lib/paste-parser";
import { describe, expect, it } from "vitest";

const ME = `Identyfikacja
Producent: Dell
Model: XPS 13 9340
SKU / kod: DELL-XPS9340-U7
EAN: 5397184960123 (demo)
Stan: Nowy — zaplombowany

Wydajność
Procesor: Intel Core Ultra 7 155H
Pamięć RAM: 16 GB LPDDR5x
Dysk: 1 TB SSD NVMe PCIe 4.0
Grafika: Intel Arc Graphics`;

const XKOM = `Procesor\tIntel Core Ultra 7 155H
Pamięć RAM\t16 GB LPDDR5x
Dysk SSD\t1000 GB M.2 PCIe NVMe
Gwarancja\t24 miesiące`;

describe("parseShopSpec", () => {
  it("parses Media Expert style Klucz: wartość and section headers", () => {
    const sections = parseShopSpec(ME);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    const rows = flattenSpecRows(sections);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    expect(map["Producent"]).toBe("Dell");
    expect(map["Model"]).toBe("XPS 13 9340");
    expect(map["Procesor"]).toContain("Ultra 7");
    expect(map["Pamięć RAM"]).toContain("16 GB");
    expect(sections.some((s) => /identyfikacja/i.test(s.title))).toBe(true);
  });

  it("parses x-kom tab-separated key/value", () => {
    const rows = flattenSpecRows(parseShopSpec(XKOM));
    expect(rows.find((r) => r.key === "Procesor")?.value).toContain("Ultra 7");
    expect(rows.find((r) => /RAM/i.test(r.key))?.value).toContain("16 GB");
  });

  it("parses alternating key/value lines", () => {
    const raw = `Producent
Dell
Model
XPS 13 9340
Procesor
Intel Core i7`;
    const rows = flattenSpecRows(parseShopSpec(raw));
    expect(rows.find((r) => r.key === "Producent")?.value).toBe("Dell");
    expect(rows.find((r) => r.key === "Model")?.value).toBe("XPS 13 9340");
  });

  it("returns empty for blank input", () => {
    expect(parseShopSpec("")).toEqual([]);
    expect(parseShopSpec("   \n  ")).toEqual([]);
  });

  it("picks key params for product card", () => {
    const keys = pickKeyParams(parseShopSpec(ME));
    expect(keys.find((k) => k.label === "Procesor")?.value).toContain("Ultra 7");
    expect(keys.find((k) => k.label === "Pamięć RAM")?.value).toContain("16 GB");
    expect(keys.find((k) => k.label === "Dysk")?.value).toContain("1 TB");
  });
});
