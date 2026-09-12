import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { BRAND } from "@/lib/brand";

export type CalendarResult =
  | { ok: true; googleEventId: string; status: "SYNCED" }
  | { ok: false; status: "LOCAL_ONLY" | "DISCONNECTED" | "ERROR"; message: string };

type TokenSet = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
};

const mockStore: { events: Record<string, { id: string; summary: string; start: string }> } = {
  events: {},
};

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGoogleMock(): boolean {
  return process.env.GOOGLE_MOCK === "true";
}

function redirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.APP_URL ?? "http://localhost:3000"}/api/calendar/callback`
  );
}

function oauthClient() {
  if (!isGoogleConfigured()) {
    throw new Error("Brak GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

export function getConnectUrl(): string | null {
  if (!isGoogleConfigured()) return null;
  const client = oauthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"],
  });
}

export async function getConnectionStatus() {
  const row = await prisma.calendarConnection.findUnique({ where: { id: "default" } });
  const configured = isGoogleConfigured();
  if (!configured) {
    return {
      configured: false,
      connected: false,
      email: null as string | null,
      status: "DISCONNECTED" as const,
      message:
        "Google Calendar nie jest skonfigurowany. Ustaw GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET — terminy zapisują się lokalnie.",
      lastSyncAt: row?.lastSyncAt ?? null,
    };
  }
  const connected = Boolean(row?.encryptedTokens) && row?.status !== "DISCONNECTED";
  return {
    configured: true,
    connected,
    email: row?.connectedEmail ?? null,
    status: row?.status ?? "DISCONNECTED",
    message: connected
      ? `Połączono${row?.connectedEmail ? ` jako ${row.connectedEmail}` : ""}.`
      : "Google Calendar skonfigurowany, ale niepołączony. Terminy zapisują się lokalnie do czasu autoryzacji.",
    lastSyncAt: row?.lastSyncAt ?? null,
    errorMessage: row?.errorMessage ?? null,
  };
}

export async function handleOAuthCallback(code: string) {
  if (isGoogleMock()) {
    await prisma.calendarConnection.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        encryptedTokens: encryptSecret(JSON.stringify({ access_token: "mock", refresh_token: "mock" })),
        connectedEmail: "mock@google.test",
        status: "SYNCED",
      },
      update: {
        encryptedTokens: encryptSecret(JSON.stringify({ access_token: "mock", refresh_token: "mock" })),
        connectedEmail: "mock@google.test",
        status: "SYNCED",
        errorMessage: null,
      },
    });
    return;
  }
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  let email: string | null = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();
    email = me.data.email ?? null;
  } catch {
    email = null;
  }
  await prisma.calendarConnection.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      encryptedTokens: encryptSecret(JSON.stringify(tokens)),
      connectedEmail: email,
      status: "SYNCED",
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    },
    update: {
      encryptedTokens: encryptSecret(JSON.stringify(tokens)),
      connectedEmail: email,
      status: "SYNCED",
      errorMessage: null,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    },
  });
}

export async function disconnectGoogle() {
  await prisma.calendarConnection.upsert({
    where: { id: "default" },
    create: { id: "default", status: "DISCONNECTED" },
    update: {
      encryptedTokens: null,
      connectedEmail: null,
      status: "DISCONNECTED",
      errorMessage: null,
    },
  });
}

async function getAuthedCalendar(): Promise<calendar_v3.Calendar | null> {
  if (isGoogleMock()) return null;
  if (!isGoogleConfigured()) return null;
  const row = await prisma.calendarConnection.findUnique({ where: { id: "default" } });
  if (!row?.encryptedTokens) return null;
  const tokens = JSON.parse(decryptSecret(row.encryptedTokens)) as TokenSet;
  const client = oauthClient();
  client.setCredentials(tokens);
  client.on("tokens", async (fresh) => {
    const merged = { ...tokens, ...fresh };
    await prisma.calendarConnection.update({
      where: { id: "default" },
      data: { encryptedTokens: encryptSecret(JSON.stringify(merged)) },
    });
  });
  return google.calendar({ version: "v3", auth: client });
}

async function calendarId(): Promise<string> {
  const row = await prisma.calendarConnection.findUnique({ where: { id: "default" } });
  return row?.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
}

async function upsertGoogleEvent(input: {
  googleEventId?: string | null;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  privateProps: Record<string, string>;
}): Promise<CalendarResult> {
  if (isGoogleMock()) {
    const id = input.googleEventId || `mock-${randomId()}`;
    mockStore.events[id] = { id, summary: input.summary, start: input.start.toISOString() };
    return { ok: true, googleEventId: id, status: "SYNCED" };
  }
  if (!isGoogleConfigured()) {
    return {
      ok: false,
      status: "LOCAL_ONLY",
      message: "Brak danych Google — zapisano tylko lokalnie.",
    };
  }
  const cal = await getAuthedCalendar();
  if (!cal) {
    return {
      ok: false,
      status: "DISCONNECTED",
      message: "Google Calendar niepołączony — zapisano lokalnie.",
    };
  }
  const body: calendar_v3.Schema$Event = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: { dateTime: input.start.toISOString(), timeZone: "Europe/Warsaw" },
    end: { dateTime: input.end.toISOString(), timeZone: "Europe/Warsaw" },
    extendedProperties: { private: { ks: "1", ...input.privateProps } },
  };
  try {
    const calId = await calendarId();
    if (input.googleEventId) {
      const updated = await cal.events.update({
        calendarId: calId,
        eventId: input.googleEventId,
        requestBody: body,
      });
      return { ok: true, googleEventId: updated.data.id ?? input.googleEventId, status: "SYNCED" };
    }
    const created = await cal.events.insert({ calendarId: calId, requestBody: body });
    return { ok: true, googleEventId: created.data.id ?? "", status: "SYNCED" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Błąd Google Calendar";
    await prisma.calendarConnection.updateMany({
      where: { id: "default" },
      data: { status: "ERROR", errorMessage: message },
    });
    return { ok: false, status: "ERROR", message };
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function deleteGoogleEvent(googleEventId: string | null | undefined): Promise<void> {
  if (!googleEventId) return;
  if (isGoogleMock()) {
    delete mockStore.events[googleEventId];
    return;
  }
  const cal = await getAuthedCalendar();
  if (!cal) return;
  try {
    await cal.events.delete({ calendarId: await calendarId(), eventId: googleEventId });
  } catch {
    /* already gone */
  }
}

export async function syncJobPickupEvent(jobId: string): Promise<CalendarResult> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job?.promisedPickupAt) {
    return { ok: false, status: "LOCAL_ONLY", message: "Brak terminu odbioru." };
  }
  const start = new Date(job.promisedPickupAt);
  start.setHours(16, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const result = await upsertGoogleEvent({
    googleEventId: job.googleEventId,
    summary: `Odbiór ${job.code} — ${job.clientName}`,
    description: `${job.deviceType} ${job.deviceModel}\n${job.issueDescription}\n${BRAND.phone}`,
    start,
    end,
    location: `${BRAND.addressLine1}, ${BRAND.addressLine2}`,
    privateProps: { ksJobId: job.id, ksType: "pickup" },
  });
  await prisma.job.update({
    where: { id: job.id },
    data: {
      googleEventId: result.ok ? result.googleEventId : job.googleEventId,
      calendarSync: result.ok ? "SYNCED" : result.status,
      calendarError: result.ok ? null : result.message,
    },
  });
  await prisma.calendarEvent.upsert({
    where: { id: `job-${job.id}` },
    create: {
      id: `job-${job.id}`,
      jobId: job.id,
      title: `Odbiór ${job.code} — ${job.clientName}`,
      startAt: start,
      endAt: end,
      type: "pickup",
      googleEventId: result.ok ? result.googleEventId : null,
      syncStatus: result.ok ? "SYNCED" : result.status,
      location: `${BRAND.addressLine1}, ${BRAND.addressLine2}`,
    },
    update: {
      title: `Odbiór ${job.code} — ${job.clientName}`,
      startAt: start,
      endAt: end,
      googleEventId: result.ok ? result.googleEventId : undefined,
      syncStatus: result.ok ? "SYNCED" : result.status,
    },
  });
  return result;
}

export async function syncCalendarEvent(eventId: string): Promise<CalendarResult> {
  const ev = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!ev) return { ok: false, status: "ERROR", message: "Nie znaleziono wydarzenia." };
  const result = await upsertGoogleEvent({
    googleEventId: ev.googleEventId,
    summary: ev.title,
    description: ev.description ?? "",
    start: ev.startAt,
    end: ev.endAt,
    location: ev.location ?? undefined,
    privateProps: { ksEventId: ev.id, ksType: ev.type },
  });
  await prisma.calendarEvent.update({
    where: { id: ev.id },
    data: {
      googleEventId: result.ok ? result.googleEventId : ev.googleEventId,
      syncStatus: result.ok ? "SYNCED" : result.status,
    },
  });
  return result;
}

export async function bidirectionalSync(): Promise<{
  pushed: number;
  pulled: number;
  errors: string[];
  connected: boolean;
}> {
  const status = await getConnectionStatus();
  const errors: string[] = [];
  if (!status.configured || !status.connected) {
    return { pushed: 0, pulled: 0, errors: [status.message], connected: false };
  }

  const local = await prisma.calendarEvent.findMany({
    where: { syncStatus: { not: "SYNCED" } },
  });
  const jobs = await prisma.job.findMany({
    where: { promisedPickupAt: { not: null }, calendarSync: { not: "SYNCED" } },
  });
  let pushed = 0;
  for (const ev of local) {
    const r = await syncCalendarEvent(ev.id);
    if (r.ok) pushed += 1;
    else errors.push(r.message);
  }
  for (const job of jobs) {
    const r = await syncJobPickupEvent(job.id);
    if (r.ok) pushed += 1;
    else errors.push(r.message);
  }

  let pulled = 0;
  if (isGoogleMock()) {
    await prisma.calendarConnection.update({
      where: { id: "default" },
      data: { lastSyncAt: new Date(), status: "SYNCED" },
    });
    return { pushed, pulled, errors, connected: true };
  }

  const cal = await getAuthedCalendar();
  if (cal) {
    try {
      const res = await cal.events.list({
        calendarId: await calendarId(),
        privateExtendedProperty: ["ks=1"],
        maxResults: 100,
        singleEvents: true,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      for (const item of res.data.items ?? []) {
        const ksEventId = item.extendedProperties?.private?.ksEventId;
        const ksJobId = item.extendedProperties?.private?.ksJobId;
        if (ksEventId) {
          const existing = await prisma.calendarEvent.findUnique({ where: { id: ksEventId } });
          if (existing && item.start?.dateTime) {
            await prisma.calendarEvent.update({
              where: { id: ksEventId },
              data: {
                startAt: new Date(item.start.dateTime),
                endAt: new Date(item.end?.dateTime || item.start.dateTime),
                title: item.summary || existing.title,
                googleEventId: item.id,
                syncStatus: "SYNCED",
              },
            });
            pulled += 1;
          }
        } else if (ksJobId && item.start?.dateTime) {
          await prisma.job.updateMany({
            where: { id: ksJobId },
            data: {
              promisedPickupAt: new Date(item.start.dateTime),
              googleEventId: item.id,
              calendarSync: "SYNCED",
            },
          });
          pulled += 1;
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Błąd pobierania z Google");
    }
  }

  await prisma.calendarConnection.update({
    where: { id: "default" },
    data: {
      lastSyncAt: new Date(),
      status: errors.length ? "ERROR" : "SYNCED",
      errorMessage: errors[0] ?? null,
    },
  });
  return { pushed, pulled, errors, connected: true };
}

export { mockStore as googleMockStore };
