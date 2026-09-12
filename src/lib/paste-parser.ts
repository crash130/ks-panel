export type SpecRow = { key: string; value: string };
export type SpecSection = { title: string; rows: SpecRow[] };

const DEFAULT_SECTION = "Specyfikacja";

const KNOWN_SECTIONS = [
  "identyfikacja",
  "wydajność",
  "wydajnosc",
  "wyświetlacz",
  "wyswietlacz",
  "obudowa",
  "obudowa i łączność",
  "obudowa i lacznosc",
  "zasilanie",
  "zasilanie i oprogramowanie",
  "oprogramowanie",
  "multimedia",
  "łączność",
  "lacznosc",
  "pamięć",
  "pamiec",
  "dane techniczne",
  "specyfikacja",
  "parametry",
  "inne",
  "zawartość zestawu",
  "zawartosc zestawu",
];

function isKnownSection(line: string): boolean {
  const n = normalizeKey(line);
  return KNOWN_SECTIONS.some((s) => n === s || n.startsWith(s));
}

export function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function looksLikeKvColon(line: string): { key: string; value: string } | null {
  const idx = line.indexOf(":");
  if (idx <= 0 || idx > 80) return null;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (!key || /https?:$/.test(key.toLowerCase())) return null;
  if (!value) return null;
  return { key, value };
}

function looksLikeKvTab(line: string): { key: string; value: string } | null {
  const parts = line.split(/\t+/);
  if (parts.length < 2) return null;
  const key = parts[0].trim();
  const value = parts.slice(1).join(" ").trim();
  if (!key || !value || key.length > 80) return null;
  return { key, value };
}

function looksLikeKvDash(line: string): { key: string; value: string } | null {
  const m = line.match(/^(.{1,80}?)\s{2,}(.+)$/);
  if (!m) return null;
  const key = m[1].trim();
  const value = m[2].trim();
  if (key.length < 2 || value.length < 1) return null;
  if (key.split(" ").length > 6) return null;
  return { key, value };
}

/**
 * Parser specyfikacji ze sklepów (Media Expert, x-kom, Komputronik).
 * Obsługuje `Klucz: wartość`, TSV oraz pary w kolejnych liniach.
 */
export function parseShopSpec(raw: string): SpecSection[] {
  const text = (raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!text) return [];

  const lines = text.split("\n").map((l) => l.trim());
  const colonCount = lines.filter((l) => looksLikeKvColon(l)).length;
  const tabCount = lines.filter((l) => looksLikeKvTab(l)).length;

  if (colonCount >= 2 || (colonCount >= 1 && colonCount >= tabCount)) {
    return parseColonOrTab(lines, "colon");
  }
  if (tabCount >= 2) {
    return parseColonOrTab(lines, "tab");
  }
  return parseAlternating(lines);
}

function parseColonOrTab(
  lines: string[],
  mode: "colon" | "tab",
): SpecSection[] {
  const sections: SpecSection[] = [];
  let current: SpecSection = { title: DEFAULT_SECTION, rows: [] };

  const flush = () => {
    if (current.rows.length > 0) sections.push(current);
  };

  for (const line of lines) {
    if (!line) continue;
    const kv =
      mode === "colon"
        ? looksLikeKvColon(line) ?? looksLikeKvTab(line) ?? looksLikeKvDash(line)
        : looksLikeKvTab(line) ?? looksLikeKvColon(line) ?? looksLikeKvDash(line);

    if (kv) {
      current.rows.push(kv);
      continue;
    }

    const headerCandidate = line.replace(/:$/, "").trim();
    if (isKnownSection(headerCandidate) || (line.endsWith(":") && headerCandidate.length < 48)) {
      flush();
      current = { title: headerCandidate, rows: [] };
      continue;
    }

    if (headerCandidate.length <= 48 && current.rows.length > 0) {
      flush();
      current = { title: headerCandidate, rows: [] };
    }
  }

  flush();
  return sections.length ? sections : [];
}

function parseAlternating(lines: string[]): SpecSection[] {
  const sections: SpecSection[] = [];
  let current: SpecSection = { title: DEFAULT_SECTION, rows: [] };
  const flush = () => {
    if (current.rows.length > 0) sections.push(current);
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      i += 1;
      continue;
    }

    const colon = looksLikeKvColon(line);
    if (colon) {
      current.rows.push(colon);
      i += 1;
      continue;
    }

    const tab = looksLikeKvTab(line);
    if (tab) {
      current.rows.push(tab);
      i += 1;
      continue;
    }

    const next = lines[i + 1];
    if (isKnownSection(line) && (!next || looksLikeKvColon(next) || isKnownSection(next) || next.length < 60)) {
      flush();
      current = { title: line, rows: [] };
      i += 1;
      continue;
    }

    if (next && next.length > 0 && !isKnownSection(next)) {
      current.rows.push({ key: line, value: next });
      i += 2;
      continue;
    }

    if (isKnownSection(line) || line.length <= 40) {
      flush();
      current = { title: line, rows: [] };
    }
    i += 1;
  }

  flush();
  return sections;
}

export function flattenSpecRows(sections: SpecSection[]): SpecRow[] {
  return sections.flatMap((s) => s.rows);
}

const KEY_PARAM_ALIASES: { label: string; aliases: string[] }[] = [
  { label: "Procesor", aliases: ["procesor", "cpu", "processor"] },
  {
    label: "Pamięć RAM",
    aliases: ["pamiec ram", "pamięć ram", "ram", "pamięć", "pamiec"],
  },
  { label: "Dysk", aliases: ["dysk", "dysk ssd", "ssd", "pojemność dysku", "pojemnosc dysku"] },
  {
    label: "Ekran",
    aliases: ["ekran", "przekątna", "przekatna", "wyświetlacz", "wyswietlacz", "matryca"],
  },
  { label: "Grafika", aliases: ["grafika", "karta graficzna", "gpu", "układ graficzny", "uklad graficzny"] },
  { label: "Gwarancja", aliases: ["gwarancja", "gwarancja producenta"] },
];

export function pickKeyParams(sections: SpecSection[]): { label: string; value: string }[] {
  const rows = flattenSpecRows(sections);
  const used = new Set<number>();
  const out: { label: string; value: string }[] = [];

  for (const target of KEY_PARAM_ALIASES) {
    const idx = rows.findIndex((r, i) => {
      if (used.has(i)) return false;
      const k = normalizeKey(r.key);
      return target.aliases.some((a) => k === a || k.startsWith(a));
    });
    if (idx >= 0) {
      used.add(idx);
      out.push({ label: target.label, value: rows[idx].value });
    }
  }
  return out;
}

export function parseOptionalDescription(raw: string | undefined | null): string {
  return (raw ?? "").trim();
}
