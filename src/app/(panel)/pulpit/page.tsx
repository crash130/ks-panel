import Link from "next/link";
import { ClipboardPlus, PackageCheck, Clock, Zap, FileSpreadsheet, Table2 } from "lucide-react";
import { dashboardStats } from "@/lib/jobs";
import { prisma } from "@/lib/db";
import { formatDateShort, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Pulpit" };
export const dynamic = "force-dynamic";

function monthLabel() {
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(new Date());
}

export default async function PulpitPage() {
  await requireUser();
  const stats = await dashboardStats();
  const inventory = await prisma.inventoryItem.findMany();
  const low = inventory.filter((i) => i.qty <= i.minQty);
  const techs = await prisma.user.findMany({
    where: { role: "TECHNICIAN", active: true },
    include: { jobs: { where: { status: { notIn: ["WYDANE", "ANULOWANE"] } } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Kolejka serwisu</h1>
          <p className="mt-1 text-sm text-muted">Dzisiaj · kolejka KS</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tablica" className="ks-btn ks-btn-ghost">
            <Table2 size={16} /> Tablica
          </Link>
          <Link href="/ofertomat" className="ks-btn ks-btn-ghost">
            <FileSpreadsheet size={16} /> Ofertomat
          </Link>
          <Link href="/przyjecie" className="ks-btn ks-btn-primary">
            + Nowe przyjęcie
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<ClipboardPlus className="text-primary" />} label="Otwarte" value={String(stats.openCount)} hint="w warsztacie" tone="text-primary" />
        <Kpi icon={<PackageCheck className="text-emerald-600" />} label="Do odbioru" value={String(stats.readyCount)} hint="gotowe" tone="text-emerald-600" />
        <Kpi icon={<Clock className="text-rose-600" />} label="Po terminie" value={String(stats.overdueCount)} hint="wymaga kontaktu" tone="text-rose-600" />
        <Kpi icon={<Zap className="text-primary" />} label="Przychód (mies.)" value={formatMoney(stats.monthRevenueGr)} hint={monthLabel()} tone="text-navy" accent />
      </div>

      <section className="ks-card mt-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4 font-bold">
          <Table2 size={16} className="text-muted" /> Aktywna kolejka
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Kod</th>
                <th className="px-3 py-3">Klient</th>
                <th className="px-3 py-3">Sprzęt</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Technik</th>
                <th className="px-3 py-3">Termin</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stats.jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Brak aktywnych zleceń. Dodaj pierwsze przyjęcie.
                  </td>
                </tr>
              )}
              {stats.jobs.map((job) => (
                <tr key={job.id} className="border-t border-line">
                  <td className="px-5 py-3 font-bold text-primary">{job.code}</td>
                  <td className="px-3 py-3 font-semibold">{job.clientName}</td>
                  <td className="px-3 py-3 text-muted">
                    {job.deviceType} {job.deviceModel}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={job.status} promisedPickupAt={job.promisedPickupAt} />
                  </td>
                  <td className="px-3 py-3">{job.technician?.name ?? "—"}</td>
                  <td className="px-3 py-3">{formatDateShort(job.promisedPickupAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/przyjecie/${job.id}`} className="ks-btn ks-btn-ghost px-3 py-1 text-xs">
                      Otwórz
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="ks-card p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <WarehouseIcon /> Niski stan magazynu
          </h2>
          <div className="mt-3 space-y-2 text-sm text-muted">
            {low.length === 0 && <p>Brak alertów magazynowych.</p>}
            {low.map((i) => (
              <p key={i.id}>
                {i.name} — {i.qty} {i.unit} (min. {i.minQty})
              </p>
            ))}
          </div>
        </section>
        <section className="ks-card p-5">
          <h2 className="font-bold text-primary">Obciążenie techników</h2>
          <div className="mt-3 space-y-2 text-sm">
            {techs.length === 0 && <p className="text-muted">Brak kont techników.</p>}
            {techs.map((t) => (
              <p key={t.id}>
                {t.name} — {t.jobs.length} {t.jobs.length === 1 ? "zlecenie" : "zlecenia"}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: string;
  accent?: boolean;
}) {
  return (
    <div className={`ks-card p-5 ${accent ? "bg-gradient-to-br from-white to-sky-50" : ""}`}>
      <div className="flex justify-center">
        <div className="flex h-44 w-full max-w-[140px] flex-col items-center rounded-[2rem] border border-dashed border-line bg-cloud/60 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">{icon}</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
        </div>
      </div>
      <div className={`mt-3 text-2xl font-extrabold ${tone}`}>{value}</div>
      <div className="text-xs text-muted">{hint}</div>
    </div>
  );
}

function WarehouseIcon() {
  return (
    <span className="text-primary" aria-hidden>
      ▤
    </span>
  );
}
