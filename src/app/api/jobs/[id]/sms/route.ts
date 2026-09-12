import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin, clientIp } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendIntakeConfirmation } from "@/lib/sms/send";
import { audit } from "@/lib/audit";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Nie znaleziono zlecenia." }, { status: 404 });
  const sms = await sendIntakeConfirmation(id);
  await audit({
    userId: user.id,
    action: "job.sms",
    entityType: "job",
    entityId: id,
    ip: await clientIp(),
    meta: { code: job.code, status: sms.status, resend: true, error: sms.error ?? null },
  });
  return NextResponse.json({ id, code: job.code, sms });
}
