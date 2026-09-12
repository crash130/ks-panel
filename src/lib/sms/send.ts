import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { normalizePlMsisdn } from "@/lib/phone";
import { assertSmsBodySafe, buildIntakeSms, jobStatusUrl } from "@/lib/sms/template";
import { getSmsProvider } from "@/lib/sms/providers";
import type { SmsStatus } from "@prisma/client";

export type IntakeSmsResult = {
  attempted: boolean;
  status: "sent" | "failed" | "skipped";
  error?: string;
  to?: string;
  provider?: string;
};

function jobSecrets(job: { devicePinEnc: string | null; devicePasswordEnc: string | null }): string[] {
  const out: string[] = [];
  try {
    const pin = decryptSecret(job.devicePinEnc);
    if (pin) out.push(pin);
  } catch {
    /* ignore decrypt errors — still must not leak ciphertext */
  }
  try {
    const pw = decryptSecret(job.devicePasswordEnc);
    if (pw) out.push(pw);
  } catch {
    /* ignore */
  }
  if (job.devicePinEnc) out.push(job.devicePinEnc);
  if (job.devicePasswordEnc) out.push(job.devicePasswordEnc);
  return out;
}

async function logSms(data: {
  jobId: string;
  to: string;
  body: string;
  status: SmsStatus;
  provider: string;
  providerId?: string | null;
  error?: string | null;
}) {
  return prisma.smsMessage.create({
    data: {
      jobId: data.jobId,
      to: data.to,
      body: data.body,
      purpose: "intake_confirm",
      status: data.status,
      provider: data.provider,
      providerId: data.providerId ?? null,
      error: data.error ?? null,
      sentAt: data.status === "SENT" ? new Date() : null,
    },
  });
}

export async function sendIntakeConfirmation(jobId: string): Promise<IntakeSmsResult> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { attempted: false, status: "skipped", error: "Nie znaleziono zlecenia." };
  }
  if (!job.smsConsentAt) {
    await logSms({
      jobId: job.id,
      to: job.clientPhone,
      body: "",
      status: "SKIPPED",
      provider: getSmsProvider().name,
      error: "Brak zgody RODO na SMS serwisowy.",
    });
    return {
      attempted: false,
      status: "skipped",
      error: "Brak zgody klienta na SMS serwisowy (RODO).",
      provider: getSmsProvider().name,
    };
  }

  const to = normalizePlMsisdn(job.clientPhone);
  if (!to) {
    await logSms({
      jobId: job.id,
      to: job.clientPhone,
      body: "",
      status: "FAILED",
      provider: getSmsProvider().name,
      error: "Nieprawidłowy numer telefonu.",
    });
    return {
      attempted: true,
      status: "failed",
      error: "Nieprawidłowy numer telefonu — SMS nie wyszedł. Wydrukuj protokół albo wyślij e-mail.",
      to: job.clientPhone,
      provider: getSmsProvider().name,
    };
  }

  const body = buildIntakeSms({
    code: job.code,
    deviceType: job.deviceType,
    deviceBrand: job.deviceBrand,
    deviceModel: job.deviceModel,
    promisedPickupAt: job.promisedPickupAt,
    statusUrl: jobStatusUrl(job.publicStatusToken),
  });

  try {
    assertSmsBodySafe(body, [...jobSecrets(job), job.id, job.notes]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "SMS zablokowany.";
    await logSms({
      jobId: job.id,
      to,
      body: "",
      status: "FAILED",
      provider: getSmsProvider().name,
      error: msg,
    });
    return { attempted: true, status: "failed", error: msg, to, provider: getSmsProvider().name };
  }

  const provider = getSmsProvider();
  const result = await provider.send(to, body);
  if (result.ok) {
    await logSms({
      jobId: job.id,
      to,
      body,
      status: "SENT",
      provider: result.provider,
      providerId: result.providerId,
    });
    return { attempted: true, status: "sent", to, provider: result.provider };
  }

  await logSms({
    jobId: job.id,
    to,
    body,
    status: "FAILED",
    provider: result.provider,
    providerId: result.providerId,
    error: result.error,
  });
  return {
    attempted: true,
    status: "failed",
    error: result.error ?? "Nie udało się wysłać SMS.",
    to,
    provider: result.provider,
  };
}
