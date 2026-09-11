import { normalizePlMsisdn, toE164 } from "@/lib/phone";

export type SmsSendResult = {
  ok: boolean;
  provider: string;
  providerId?: string;
  error?: string;
};

export type SmsProvider = {
  name: string;
  send(toMsisdn: string, body: string): Promise<SmsSendResult>;
};

function trimEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

function resolvedProviderName(): string {
  if (trimEnv("SMS_MOCK") === "true" || trimEnv("SMS_MOCK_FAIL") === "true") return "mock";
  const raw = trimEnv("SMS_PROVIDER").toLowerCase();
  if (raw === "smsapi" || raw === "twilio" || raw === "mock" || raw === "none") return raw;
  if (!raw) return "none";
  return raw;
}

const mockProvider: SmsProvider = {
  name: "mock",
  async send() {
    if (trimEnv("SMS_MOCK_FAIL") === "true") {
      return { ok: false, provider: "mock", error: "SMS_MOCK_FAIL — zasymulowana awaria bramki" };
    }
    return { ok: true, provider: "mock", providerId: `mock-${Date.now()}` };
  },
};

const noneProvider: SmsProvider = {
  name: "none",
  async send() {
    return {
      ok: false,
      provider: "none",
      error: "SMS nie skonfigurowane (SMS_PROVIDER=none). Wydrukuj protokół albo wyślij e-mail.",
    };
  },
};

const smsapiProvider: SmsProvider = {
  name: "smsapi",
  async send(toMsisdn, body) {
    const token = trimEnv("SMS_API_TOKEN");
    if (!token) {
      return { ok: false, provider: "smsapi", error: "Brak SMS_API_TOKEN (token OAuth SMSAPI.pl)." };
    }
    const endpoint = trimEnv("SMSAPI_URL") || "https://api.smsapi.pl/sms.do";
    const from = trimEnv("SMS_SENDER");
    const params = new URLSearchParams();
    params.set("to", toMsisdn);
    params.set("message", body);
    params.set("format", "json");
    params.set("encoding", "utf-8");
    if (from) params.set("from", from);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: number;
        message?: string;
        list?: { id?: string }[];
      };
      if (!res.ok || data.error) {
        return {
          ok: false,
          provider: "smsapi",
          error: data.message || `SMSAPI HTTP ${res.status}`,
        };
      }
      const id = data.list?.[0]?.id;
      return { ok: true, provider: "smsapi", providerId: id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Błąd sieci SMSAPI";
      return { ok: false, provider: "smsapi", error: msg };
    }
  },
};

const twilioProvider: SmsProvider = {
  name: "twilio",
  async send(toMsisdn, body) {
    const sid = trimEnv("TWILIO_ACCOUNT_SID");
    const auth = trimEnv("TWILIO_AUTH_TOKEN");
    const from = trimEnv("TWILIO_FROM") || trimEnv("SMS_SENDER");
    if (!sid || !auth) {
      return { ok: false, provider: "twilio", error: "Brak TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN." };
    }
    if (!from) {
      return { ok: false, provider: "twilio", error: "Brak TWILIO_FROM (numer nadawcy E.164)." };
    }
    const to = toE164(toMsisdn) ?? `+${toMsisdn}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
    const params = new URLSearchParams();
    params.set("To", to);
    params.set("From", from);
    params.set("Body", body);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => ({}))) as {
        sid?: string;
        message?: string;
        error_message?: string;
      };
      if (!res.ok) {
        return {
          ok: false,
          provider: "twilio",
          error: data.error_message || data.message || `Twilio HTTP ${res.status}`,
        };
      }
      return { ok: true, provider: "twilio", providerId: data.sid };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Błąd sieci Twilio";
      return { ok: false, provider: "twilio", error: msg };
    }
  },
};

export function getSmsProvider(): SmsProvider {
  const name = resolvedProviderName();
  if (name === "mock") return mockProvider;
  if (name === "smsapi") return smsapiProvider;
  if (name === "twilio") return twilioProvider;
  if (name === "none") return noneProvider;
  return {
    name,
    async send() {
      return {
        ok: false,
        provider: name,
        error: `Nieznany SMS_PROVIDER=${name}. Użyj: smsapi | twilio | mock | none.`,
      };
    },
  };
}

export function providerLabel(): string {
  return getSmsProvider().name;
}

export { normalizePlMsisdn };
