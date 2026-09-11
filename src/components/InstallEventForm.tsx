"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InstallEventForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/calendar/events", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(data.message ?? (res.ok ? "Dodano wydarzenie." : "Błąd"));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="ks-card mt-6 grid gap-3 p-5 md:grid-cols-4">
      <div className="md:col-span-4 font-bold">Nowe wydarzenie (montaż / wizyta)</div>
      <div className="md:col-span-2">
        <label className="ks-label">Tytuł</label>
        <input name="title" required placeholder="Montaż monitoringu — Sklep ABC" />
      </div>
      <div>
        <label className="ks-label">Data</label>
        <input name="date" type="date" required />
      </div>
      <div>
        <label className="ks-label">Godzina</label>
        <input name="time" type="time" defaultValue="12:00" />
      </div>
      <div className="md:col-span-4">
        <button className="ks-btn ks-btn-primary" type="submit">
          Dodaj i spróbuj zsynchronizować
        </button>
        {msg && <span className="ml-3 text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}
