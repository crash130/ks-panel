"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CalendarActions({ connected, configured }: { connected: boolean; configured: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function sync() {
    setPending(true);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    const data = await res.json();
    setPending(false);
    if (!data.connected) {
      setMsg(data.errors?.[0] ?? "Brak połączenia — nic nie udajemy jako sukces.");
    } else {
      setMsg(`Wysłano: ${data.pushed}, pobrano: ${data.pulled}${data.errors?.length ? `. Błędy: ${data.errors.join("; ")}` : ""}`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {configured && !connected && (
        <a className="ks-btn ks-btn-primary" href="/api/calendar/connect">
          Połącz Google Calendar
        </a>
      )}
      <button type="button" className="ks-btn ks-btn-ghost" onClick={sync} disabled={pending}>
        {pending ? "Synchronizacja…" : "Sync z Google"}
      </button>
      {connected && (
        <form action="/api/calendar/disconnect" method="post">
          <button className="ks-btn ks-btn-ghost">Rozłącz</button>
        </form>
      )}
      {msg && <p className="w-full text-sm text-muted">{msg}</p>}
    </div>
  );
}
