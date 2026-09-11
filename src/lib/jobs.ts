import { prisma } from "@/lib/db";
import { encryptSecret, decryptSecret, randomToken } from "@/lib/crypto";
import { isJobOverdue } from "@/lib/status";
import type { JobStatus, Prisma } from "@prisma/client";
import { syncJobPickupEvent } from "@/lib/google-calendar";

export async function nextJobCode(): Promise<string> {
  const year = new Date().getFullYear() % 100;
  const prefix = `KS-${year}`;
  const last = await prisma.job.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
  });
  const n = last ? Number.parseInt(last.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isFinite(n) ? n : 1).padStart(2, "0")}`;
}

export type IntakeInput = {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  deviceType: string;
  deviceBrand?: string;
  deviceModel: string;
  serialNumber?: string;
  accessories?: string;
  issueDescription: string;
  devicePin?: string;
  devicePassword?: string;
  notes?: string;
  technicianId?: string;
  promisedPickupAt?: Date | null;
  smsConsentAt?: Date | null;
};

export async function createJob(input: IntakeInput) {
  const code = await nextJobCode();
  const job = await prisma.job.create({
    data: {
      code,
      clientName: input.clientName.trim(),
      clientPhone: input.clientPhone.trim(),
      clientEmail: input.clientEmail?.trim() || null,
      deviceType: input.deviceType.trim(),
      deviceBrand: input.deviceBrand?.trim() || null,
      deviceModel: input.deviceModel.trim(),
      serialNumber: input.serialNumber?.trim() || null,
      accessories: input.accessories?.trim() || null,
      issueDescription: input.issueDescription.trim(),
      devicePinEnc: input.devicePin ? encryptSecret(input.devicePin) : null,
      devicePasswordEnc: input.devicePassword ? encryptSecret(input.devicePassword) : null,
      notes: input.notes?.trim() || null,
      technicianId: input.technicianId || null,
      promisedPickupAt: input.promisedPickupAt ?? null,
      publicStatusToken: randomToken(18),
      smsConsentAt: input.smsConsentAt ?? null,
    },
  });

  if (job.promisedPickupAt) {
    await syncJobPickupEvent(job.id);
  }
  return job;
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const data: Prisma.JobUpdateInput = { status };
  if (status === "WYDANE") data.releasedAt = new Date();
  return prisma.job.update({ where: { id }, data });
}

export function revealDeviceSecret(enc: string | null | undefined): string {
  if (!enc) return "";
  return decryptSecret(enc);
}

export async function dashboardStats() {
  const jobs = await prisma.job.findMany({
    where: { status: { notIn: ["WYDANE", "ANULOWANE"] } },
    include: { technician: true },
  });
  const open = jobs.filter((j) => j.status !== "GOTOWE_DO_ODBIORU");
  const ready = jobs.filter((j) => j.status === "GOTOWE_DO_ODBIORU");
  const overdue = jobs.filter((j) => isJobOverdue(j));
  const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const revenue = await prisma.job.aggregate({
    _sum: { chargeGrosze: true },
    where: { status: "WYDANE", releasedAt: { gte: from, lt: to } },
  });
  const offerRevenue = await prisma.offer.findMany({
    where: { status: "ACCEPTED", updatedAt: { gte: from, lt: to } },
    include: { lines: true, product: true },
  });
  let offerSum = 0;
  for (const o of offerRevenue) {
    if (o.product) offerSum += o.product.priceGrossGr;
    else {
      const net = o.lines.reduce((s, l) => s + l.qty * l.unitPriceNetGr, 0);
      offerSum += Math.round(net * (1 + o.vatRate / 100));
    }
  }
  return {
    openCount: open.length,
    readyCount: ready.length,
    overdueCount: overdue.length,
    monthRevenueGr: (revenue._sum.chargeGrosze ?? 0) + offerSum,
    jobs,
  };
}
