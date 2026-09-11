"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IntakeForm({ technicians }: { technicians: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/jobs", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Nie udało się zapisać przyjęcia.");
      return;
    }
    router.push(`/przyjecie/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      {error && <div className="md:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="md:col-span-2 font-bold">Klient</div>
      <div>
        <label className="ks-label" htmlFor="clientName">Imię i nazwisko / firma</label>
        <input id="clientName" name="clientName" required />
      </div>
      <div>
        <label className="ks-label" htmlFor="clientPhone">Telefon</label>
        <input id="clientPhone" name="clientPhone" required />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="clientEmail">E-mail (opcjonalnie)</label>
        <input id="clientEmail" name="clientEmail" type="email" />
      </div>
      <div className="md:col-span-2 font-bold">Sprzęt</div>
      <div>
        <label className="ks-label" htmlFor="deviceType">Typ</label>
        <select id="deviceType" name="deviceType" defaultValue="Laptop">
          <option>Laptop</option>
          <option>PC</option>
          <option>Smartfon</option>
          <option>Drukarka</option>
          <option>Monitoring</option>
          <option>Inne</option>
        </select>
      </div>
      <div>
        <label className="ks-label" htmlFor="deviceBrand">Marka</label>
        <input id="deviceBrand" name="deviceBrand" />
      </div>
      <div>
        <label className="ks-label" htmlFor="deviceModel">Model</label>
        <input id="deviceModel" name="deviceModel" required />
      </div>
      <div>
        <label className="ks-label" htmlFor="serialNumber">Numer seryjny</label>
        <input id="serialNumber" name="serialNumber" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="accessories">Akcesoria</label>
        <input id="accessories" name="accessories" placeholder="ładowarka, torba…" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="issueDescription">Opis usterki</label>
        <textarea id="issueDescription" name="issueDescription" rows={4} required />
      </div>
      <div>
        <label className="ks-label" htmlFor="devicePin">PIN (szyfrowany w bazie)</label>
        <input id="devicePin" name="devicePin" type="password" autoComplete="off" />
      </div>
      <div>
        <label className="ks-label" htmlFor="devicePassword">Hasło urządzenia</label>
        <input id="devicePassword" name="devicePassword" type="password" autoComplete="off" />
      </div>
      <div>
        <label className="ks-label" htmlFor="technicianId">Technik</label>
        <select id="technicianId" name="technicianId" defaultValue="">
          <option value="">— nieprzypisany —</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ks-label" htmlFor="promisedPickupAt">Obiecany odbiór</label>
        <input id="promisedPickupAt" name="promisedPickupAt" type="date" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="notes">Uwagi wewnętrzne</label>
        <textarea id="notes" name="notes" rows={2} />
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <button className="ks-btn ks-btn-primary" disabled={pending} type="submit">
          {pending ? "Zapis…" : "Utwórz zlecenie i protokół"}
        </button>
      </div>
    </form>
  );
}
