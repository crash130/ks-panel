"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@prisma/client";

export function JobActions({
  jobId,
  status,
  statuses,
  technicians,
  technicianId,
  hasPin,
  hasPassword,
}: {
  jobId: string;
  status: JobStatus;
  statuses: [JobStatus, string][];
  technicians: { id: string; name: string }[];
  technicianId: string | null;
  hasPin: boolean;
  hasPassword: boolean;
  canReveal: boolean;
}) {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, string>) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "Błąd zapisu");
    }
  }

  async function reveal(kind: "pin" | "password") {
    const res = await fetch(`/api/jobs/${jobId}/secret?kind=${kind}`);
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "Brak dostępu");
      return;
    }
    setSecret(`${kind === "pin" ? "PIN" : "Hasło"}: ${d.value || "(brak)"}`);
  }

  return (
    <div className="ks-card mt-4 space-y-4 p-6">
      {msg && <p className="text-sm text-rose-700">{msg}</p>}
      {secret && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm">
          {secret} <span className="text-muted">(wpis w dzienniku audytu)</span>
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="ks-label">Status</label>
          <select defaultValue={status} onChange={(e) => patch({ status: e.target.value })}>
            {statuses.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ks-label">Technik</label>
          <select
            defaultValue={technicianId ?? ""}
            onChange={(e) => patch({ technicianId: e.target.value })}
          >
            <option value="">—</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {hasPin && (
          <button type="button" className="ks-btn ks-btn-ghost" onClick={() => reveal("pin")}>
            Pokaż PIN
          </button>
        )}
        {hasPassword && (
          <button type="button" className="ks-btn ks-btn-ghost" onClick={() => reveal("password")}>
            Pokaż hasło
          </button>
        )}
      </div>
    </div>
  );
}
