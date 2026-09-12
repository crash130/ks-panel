import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin, clientIp } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateJobStatus } from "@/lib/jobs";
import { syncJobPickupEvent } from "@/lib/google-calendar";
import { audit } from "@/lib/audit";
import type { JobStatus } from "@prisma/client";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  if (body.status) {
    await updateJobStatus(id, body.status as JobStatus);
    await audit({
      userId: user.id,
      action: "job.status",
      entityType: "job",
      entityId: id,
      meta: { status: body.status },
      ip: await clientIp(),
    });
  }
  if (body.technicianId !== undefined) {
    await prisma.job.update({
      where: { id },
      data: { technicianId: body.technicianId || null },
    });
  }
  if (body.promisedPickupAt) {
    await prisma.job.update({
      where: { id },
      data: { promisedPickupAt: new Date(body.promisedPickupAt) },
    });
    await syncJobPickupEvent(id);
  }
  const job = await prisma.job.findUnique({ where: { id } });
  return NextResponse.json(job);
}
