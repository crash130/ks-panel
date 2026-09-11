import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin, clientIp } from "@/lib/auth";
import { createJob } from "@/lib/jobs";
import { audit } from "@/lib/audit";
import { isValidPlPhone } from "@/lib/phone";
import { sendIntakeConfirmation } from "@/lib/sms/send";
import { z } from "zod";

const schema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(6),
  clientEmail: z.string().optional(),
  deviceType: z.string().min(1),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().min(1),
  serialNumber: z.string().optional(),
  accessories: z.string().optional(),
  issueDescription: z.string().min(3),
  devicePin: z.string().optional(),
  devicePassword: z.string().optional(),
  notes: z.string().optional(),
  technicianId: z.string().optional(),
  promisedPickupAt: z.string().optional(),
  sendSms: z.string().optional(),
  smsConsent: z.string().optional(),
  printProtocol: z.string().optional(),
});

function checked(v: string | undefined): boolean {
  return v === "1" || v === "on" || v === "true";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Uzupełnij wymagane pola." }, { status: 400 });
  }
  const d = parsed.data;
  const sendSms = checked(d.sendSms);
  const smsConsent = checked(d.smsConsent);
  if (sendSms && !smsConsent) {
    return NextResponse.json(
      { error: "Zaznacz zgodę RODO na SMS serwisowy albo odznacz wysyłkę SMS." },
      { status: 400 },
    );
  }
  if (sendSms && !isValidPlPhone(d.clientPhone)) {
    return NextResponse.json(
      { error: "Podaj poprawny numer telefonu (9 cyfr), żeby wysłać SMS." },
      { status: 400 },
    );
  }
  const job = await createJob({
    clientName: d.clientName,
    clientPhone: d.clientPhone,
    clientEmail: d.clientEmail || undefined,
    deviceType: d.deviceType,
    deviceBrand: d.deviceBrand,
    deviceModel: d.deviceModel,
    serialNumber: d.serialNumber,
    accessories: d.accessories,
    issueDescription: d.issueDescription,
    devicePin: d.devicePin,
    devicePassword: d.devicePassword,
    notes: d.notes,
    technicianId: d.technicianId || undefined,
    promisedPickupAt: d.promisedPickupAt ? new Date(`${d.promisedPickupAt}T16:00:00`) : null,
    smsConsentAt: smsConsent ? new Date() : null,
  });
  await audit({
    userId: user.id,
    action: "job.create",
    entityType: "job",
    entityId: job.id,
    ip: await clientIp(),
    meta: { code: job.code },
  });

  let sms: Awaited<ReturnType<typeof sendIntakeConfirmation>> = {
    attempted: false,
    status: "skipped",
  };
  if (sendSms) {
    sms = await sendIntakeConfirmation(job.id);
    await audit({
      userId: user.id,
      action: "job.sms",
      entityType: "job",
      entityId: job.id,
      ip: await clientIp(),
      meta: { code: job.code, status: sms.status, error: sms.error ?? null },
    });
  }

  return NextResponse.json({
    id: job.id,
    code: job.code,
    sms,
    printProtocol: checked(d.printProtocol),
  });
}
