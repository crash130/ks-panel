import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import { JOB_STATUS_LABEL, displayJobStatus } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Status zlecenia",
  robots: { index: false, follow: false },
};

export default async function PublicJobStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();
  const job = await prisma.job.findUnique({
    where: { publicStatusToken: token },
    select: {
      code: true,
      status: true,
      deviceType: true,
      deviceBrand: true,
      deviceModel: true,
      promisedPickupAt: true,
      clientName: true,
    },
  });
  if (!job) notFound();
  const statusKey = displayJobStatus(job);

  return (
    <div className="ks-cloud flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ks-card w-full max-w-md p-8">
        <Logo size="md" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">{BRAND.domain}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-navy">{job.code}</h1>
        <p className="mt-1 text-sm text-muted">Status naprawy — {job.clientName}</p>
        <div className="mt-4">
          <StatusBadge status={job.status} promisedPickupAt={job.promisedPickupAt} />
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted">Sprzęt</dt>
            <dd className="font-medium">
              {job.deviceType} {job.deviceBrand ?? ""} {job.deviceModel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted">Status</dt>
            <dd className="font-medium">{JOB_STATUS_LABEL[statusKey] ?? job.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted">Planowany odbiór</dt>
            <dd className="font-medium">{formatDate(job.promisedPickupAt)}</dd>
          </div>
        </dl>
        <p className="mt-8 text-xs text-muted">
          {BRAND.legalName} · {BRAND.addressLine1}, {BRAND.addressLine2}
          <br />
          tel. {formatPhoneDisplay()} · {BRAND.hours}
        </p>
      </div>
    </div>
  );
}
