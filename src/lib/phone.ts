/** Digits only, for comparison / storage display. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normalize a Polish number to MSISDN digits with country code, no plus.
 * `505 825 047` → `48505825047`
 */
export function normalizePlMsisdn(phone: string): string | null {
  let d = digitsOnly(phone);
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("48") && d.length >= 11 && d.length <= 12) return d;
  if (d.length === 9) return `48${d}`;
  if (d.length === 10 && d.startsWith("0")) return `48${d.slice(1)}`;
  return null;
}

/** E.164 with plus, for Twilio. */
export function toE164(phone: string): string | null {
  const n = normalizePlMsisdn(phone);
  return n ? `+${n}` : null;
}

export function isValidPlPhone(phone: string): boolean {
  return Boolean(normalizePlMsisdn(phone));
}
