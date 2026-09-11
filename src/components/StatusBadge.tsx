import { JOB_STATUS_LABEL, JOB_STATUS_TONE, displayJobStatus } from "@/lib/status";

export function StatusBadge({
  status,
  promisedPickupAt,
}: {
  status: string;
  promisedPickupAt?: Date | null;
}) {
  const key = promisedPickupAt
    ? displayJobStatus({ status, promisedPickupAt })
    : status;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${JOB_STATUS_TONE[key] ?? "bg-slate-100 text-slate-700"}`}
    >
      {JOB_STATUS_LABEL[key] ?? key}
    </span>
  );
}
