import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin, clientIp } from "@/lib/auth";
import { createJob } from "@/lib/jobs";
import { audit } from "@/lib/audit";
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
});

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
  const job = await createJob({
    ...d,
    clientEmail: d.clientEmail || undefined,
    technicianId: d.technicianId || undefined,
    promisedPickupAt: d.promisedPickupAt ? new Date(`${d.promisedPickupAt}T16:00:00`) : null,
  });
  await audit({
    userId: user.id,
    action: "job.create",
    entityType: "job",
    entityId: job.id,
    ip: await clientIp(),
    meta: { code: job.code },
  });
  return NextResponse.json({ id: job.id, code: job.code });
}
