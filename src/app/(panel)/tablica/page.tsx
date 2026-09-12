import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { JOB_STATUS_LABEL } from "@/lib/status";
import { formatDateShort } from "@/lib/format";
import type { JobStatus } from "@prisma/client";

export const metadata = { title: "Tablica" };
export const dynamic = "force-dynamic";

const COLUMNS: JobStatus[] = [
  "PRZYJETE",
  "DIAGNOSTYKA",
  "W_NAPRAWIE",
  "OCZEKUJE_NA_CZESCI",
  "GOTOWE_DO_ODBIORU",
];

export default async function TablicaPage() {
  await requireUser();
  const jobs = await prisma.job.findMany({
    where: { status: { in: COLUMNS } },
    include: { technician: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Tablica serwisu</h1>
          <p className="text-sm text-muted">Statusy zleceń — przeciąganie w v1 zastępuje zmiana statusu w karcie.</p>
        </div>
        <Link href="/przyjecie" className="ks-btn ks-btn-primary">
          + Nowe przyjęcie
        </Link>
      </div>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = jobs.filter((j) => j.status === col);
          return (
            <div key={col} className="ks-card min-w-[240px] flex-1 p-3">
              <div className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-muted">
                {JOB_STATUS_LABEL[col]} · {items.length}
              </div>
              <div className="space-y-2">
                {items.map((j) => (
                  <Link key={j.id} href={`/przyjecie/${j.id}`} className="block rounded-xl border border-line bg-cloud/50 p-3">
                    <div className="font-bold text-primary">{j.code}</div>
                    <div className="text-sm font-semibold">{j.clientName}</div>
                    <div className="text-xs text-muted">
                      {j.deviceType} {j.deviceModel}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={j.status} promisedPickupAt={j.promisedPickupAt} />
                      <span className="text-xs text-muted">{formatDateShort(j.promisedPickupAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
