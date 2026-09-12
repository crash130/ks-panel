import { NextResponse } from "next/server";
import { getCurrentUser, clientIp } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revealDeviceSecret } from "@/lib/jobs";
import { audit } from "@/lib/audit";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  const { id } = await ctx.params;
  const kind = new URL(request.url).searchParams.get("kind");
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  const enc = kind === "password" ? job.devicePasswordEnc : job.devicePinEnc;
  await audit({
    userId: user.id,
    action: "job.reveal_secret",
    entityType: "job",
    entityId: id,
    meta: { kind, code: job.code },
    ip: await clientIp(),
  });
  return NextResponse.json({ value: revealDeviceSecret(enc) });
}
