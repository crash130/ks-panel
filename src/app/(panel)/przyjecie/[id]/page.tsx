import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { JOB_STATUS_LABEL } from "@/lib/status";
import { JobActions } from "@/components/JobActions";
import type { JobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, include: { technician: true } });
  if (!job) notFound();
  const techs = await prisma.user.findMany({
    where: { role: { in: ["TECHNICIAN", "OWNER"] }, active: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/pulpit" className="text-sm font-semibold text-primary">
        ← Kolejka
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{job.code}</h1>
          <p className="text-muted">{job.clientName}</p>
        </div>
        <StatusBadge status={job.status} promisedPickupAt={job.promisedPickupAt} />
      </div>
      <div className="ks-card mt-6 space-y-3 p-6 text-sm">
        <Row k="Telefon" v={job.clientPhone} />
        <Row k="E-mail" v={job.clientEmail ?? "—"} />
        <Row k="Sprzęt" v={`${job.deviceType} ${job.deviceBrand ?? ""} ${job.deviceModel}`} />
        <Row k="S/N" v={job.serialNumber ?? "—"} />
        <Row k="Akcesoria" v={job.accessories ?? "—"} />
        <Row k="Usterka" v={job.issueDescription} />
        <Row k="Termin odbioru" v={formatDate(job.promisedPickupAt)} />
        <Row k="Technik" v={job.technician?.name ?? "—"} />
        <Row
          k="Kalendarz Google"
          v={
            job.calendarSync === "SYNCED"
              ? "Zsynchronizowano"
              : job.calendarSync === "ERROR"
                ? `Błąd: ${job.calendarError ?? "nieznany"}`
                : "Zapis lokalny (brak synchronizacji Google)"
          }
        />
      </div>
      <JobActions
        jobId={job.id}
        status={job.status as JobStatus}
        statuses={Object.entries(JOB_STATUS_LABEL).filter(([k]) => k !== "PO_TERMINIE") as [JobStatus, string][]}
        technicians={techs.map((t) => ({ id: t.id, name: t.name }))}
        technicianId={job.technicianId}
        hasPin={Boolean(job.devicePinEnc)}
        hasPassword={Boolean(job.devicePasswordEnc)}
        canReveal={user.role !== "TECHNICIAN" || true}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/intake/${job.id}`}>
          PDF przyjęcia
        </a>
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/release/${job.id}`}>
          PDF wydania
        </a>
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/labels/${job.id}`}>
          Naklejki
        </a>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <div className="text-muted">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
