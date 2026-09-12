import { BRAND } from "@/lib/brand";
import { formatDateShort } from "@/lib/format";

const MAX_EQUIPMENT = 42;

export function equipmentShort(job: {
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel: string;
}): string {
  const compact = [job.deviceType, job.deviceBrand, job.deviceModel]
    .filter((p) => p && String(p).trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (compact.length <= MAX_EQUIPMENT) return compact;
  return `${compact.slice(0, MAX_EQUIPMENT - 1)}…`;
}

export function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function jobStatusUrl(token: string): string {
  return `${appBaseUrl()}/status/${encodeURIComponent(token)}`;
}

/**
 * Short Polish intake confirmation. Never include PIN, password, notes, or job id.
 */
export function buildIntakeSms(opts: {
  code: string;
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel: string;
  promisedPickupAt?: Date | null;
  statusUrl?: string | null;
}): string {
  const eq = equipmentShort(opts);
  const parts = [`KS/${BRAND.domain}: przyjęto ${eq}.`, `Kod ${opts.code}.`];
  if (opts.promisedPickupAt) {
    parts.push(`Odbiór ${formatDateShort(opts.promisedPickupAt)}.`);
  }
  if (opts.statusUrl) {
    parts.push(`Status: ${opts.statusUrl}`);
  }
  parts.push(`Tel. ${BRAND.phone}`);
  return parts.join(" ");
}

/** Refuse to send if the body contains a device secret. */
export function assertSmsBodySafe(body: string, secrets: Array<string | null | undefined>): void {
  const lower = body.toLowerCase();
  if (/\b(pin|hasło|haslo|password)\s*[:=]/i.test(body)) {
    throw new Error("Szablon SMS nie może zawierać PIN/hasła.");
  }
  for (const secret of secrets) {
    const s = secret?.trim();
    if (!s || s.length < 3) continue;
    if (body.includes(s) || lower.includes(s.toLowerCase())) {
      throw new Error("Szablon SMS nie może zawierać PIN/hasła.");
    }
  }
}
