"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";

type SmsRow = {
  id: string;
  to: string;
  status: string;
  provider: string;
  providerId: string | null;
  error: string | null;
  createdAt: string;
};

export function SmsFollowup({
  jobId,
  clientEmail,
  clientName,
  jobCode,
  smsParam,
  smsError,
  printParam,
  smsConsentAt,
  messages,
  publicStatusToken,
}: {
  jobId: string;
  clientEmail: string | null;
  clientName: string;
  jobCode: string;
  smsParam?: string;
  smsError?: string;
  printParam?: string;
  smsConsentAt: string | null;
  publicStatusToken: string;
  messages: SmsRow[];
}) {
  const router = useRouter();
  const printed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (printParam !== "1" || printed.current) return;
    printed.current = true;
    window.open(`/api/pdf/intake/${jobId}`, "_blank", "noopener,noreferrer");
  }, [printParam, jobId]);

  async function resend() {
    setBusy(true);
    setLocalError(null);
    const res = await fetch(`/api/jobs/${jobId}/sms`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setLocalError(data.error ?? "Nie udało się ponowić SMS.");
      return;
    }
    if (data.sms?.status === "failed") {
      setLocalError(data.sms.error ?? "SMS nie wyszedł.");
      router.replace(`/przyjecie/${jobId}?sms=failed`);
    } else if (data.sms?.status === "sent") {
      router.replace(`/przyjecie/${jobId}?sms=sent`);
    }
    router.refresh();
  }

  const last = messages[0];
  const failed =
    smsParam === "failed" || Boolean(smsError) || Boolean(localError) || last?.status === "FAILED";
  const sent = smsParam === "sent" && !failed;
  const skipped = smsParam === "skipped" && !failed;
  const statusLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/status/${publicStatusToken}`
      : `/status/${publicStatusToken}`;
  const mailto = clientEmail
    ? `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(`KS ${jobCode} — potwierdzenie przyjęcia`)}&body=${encodeURIComponent(
        `Dzień dobry ${clientName},\n\nZlecenie ${jobCode} zostało przyjęte w KS (komputerserwis.pl).\nStatus: ${statusLink}\nTel. 505 825 047\n`,
      )}`
    : null;

  return (
    <div className="mt-6 space-y-3">
      {sent && !failed && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          Potwierdzenie SMS wysłane na numer klienta.
        </div>
      )}
      {skipped && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          SMS nie został wysłany (odznaczono na przyjęciu). Możesz wydrukować protokół albo wysłać e-mail.
        </div>
      )}
      {failed && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <p className="font-semibold">Zlecenie zapisane, ale SMS nie wyszedł.</p>
          <p className="mt-1">{localError || smsError || last?.error || "Błąd bramki SMS."}</p>
          <p className="mt-2 text-rose-700">Wydrukuj protokół albo wyślij e-mail — klient nie zostaje bez potwierdzenia.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/intake/${jobId}`}>
          Drukuj protokół
        </a>
        {mailto && (
          <a className="ks-btn ks-btn-ghost" href={mailto}>
            Wyślij e-mail
          </a>
        )}
        {smsConsentAt && (
          <button className="ks-btn ks-btn-ghost" type="button" disabled={busy} onClick={resend}>
            {busy ? "Wysyłanie…" : "Ponów SMS"}
          </button>
        )}
        <a className="ks-btn ks-btn-ghost" href={`/status/${publicStatusToken}`} target="_blank" rel="noreferrer">
          Status dla klienta
        </a>
      </div>
      {messages.length > 0 && (
        <div className="ks-card overflow-x-auto p-4 text-sm">
          <h2 className="text-sm font-bold">Dziennik SMS</h2>
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-semibold">Czas</th>
                <th className="py-1 pr-3 font-semibold">Do</th>
                <th className="py-1 pr-3 font-semibold">Status</th>
                <th className="py-1 pr-3 font-semibold">Dostawca</th>
                <th className="py-1 font-semibold">ID / błąd</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="py-1.5 pr-3 font-mono">{m.to}</td>
                  <td className="py-1.5 pr-3">{m.status}</td>
                  <td className="py-1.5 pr-3">{m.provider}</td>
                  <td className="py-1.5">{m.providerId || m.error || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
