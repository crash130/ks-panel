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
    const sendSms = fd.get("sendSms");
    const smsConsent = fd.get("smsConsent");
    if (sendSms && !smsConsent) {
      setError("Zaznacz zgodę RODO na SMS serwisowy albo odznacz wysyłkę SMS.");
      setPending(false);
      return;
    }
    const res = await fetch("/api/jobs", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Nie udało się zapisać przyjęcia.");
      return;
    }
    const qs = new URLSearchParams();
    if (data.sms?.status) qs.set("sms", data.sms.status);
    if (data.sms?.error) qs.set("smsError", String(data.sms.error));
    if (fd.get("printProtocol")) qs.set("print", "1");
    router.push(`/przyjecie/${data.id}?${qs.toString()}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      {error && (
        <div className="md:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}
      <div className="md:col-span-2 font-bold">Klient</div>
      <div>
        <label className="ks-label" htmlFor="clientName">
          Imię i nazwisko / firma
        </label>
        <input id="clientName" name="clientName" required />
      </div>
      <div>
        <label className="ks-label" htmlFor="clientPhone">
          Telefon
        </label>
        <input id="clientPhone" name="clientPhone" required inputMode="tel" autoComplete="tel" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="clientEmail">
          E-mail (opcjonalnie)
        </label>
        <input id="clientEmail" name="clientEmail" type="email" />
      </div>
      <div className="md:col-span-2 font-bold">Sprzęt</div>
      <div>
        <label className="ks-label" htmlFor="deviceType">
          Typ
        </label>
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
        <label className="ks-label" htmlFor="deviceBrand">
          Marka
        </label>
        <input id="deviceBrand" name="deviceBrand" />
      </div>
      <div>
        <label className="ks-label" htmlFor="deviceModel">
          Model
        </label>
        <input id="deviceModel" name="deviceModel" required />
      </div>
      <div>
        <label className="ks-label" htmlFor="serialNumber">
          Numer seryjny
        </label>
        <input id="serialNumber" name="serialNumber" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="accessories">
          Akcesoria
        </label>
        <input id="accessories" name="accessories" placeholder="ładowarka, torba…" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="issueDescription">
          Opis usterki
        </label>
        <textarea id="issueDescription" name="issueDescription" rows={4} required />
      </div>
      <div>
        <label className="ks-label" htmlFor="devicePin">
          PIN (szyfrowany w bazie)
        </label>
        <input id="devicePin" name="devicePin" type="password" autoComplete="off" />
      </div>
      <div>
        <label className="ks-label" htmlFor="devicePassword">
          Hasło urządzenia
        </label>
        <input id="devicePassword" name="devicePassword" type="password" autoComplete="off" />
      </div>
      <div>
        <label className="ks-label" htmlFor="technicianId">
          Technik
        </label>
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
        <label className="ks-label" htmlFor="promisedPickupAt">
          Obiecany odbiór
        </label>
        <input id="promisedPickupAt" name="promisedPickupAt" type="date" />
      </div>
      <div className="md:col-span-2">
        <label className="ks-label" htmlFor="notes">
          Uwagi wewnętrzne
        </label>
        <textarea id="notes" name="notes" rows={2} />
      </div>
      <fieldset className="md:col-span-2 space-y-3 rounded-xl border border-line bg-[#f8fbff] p-4">
        <legend className="px-1 text-sm font-bold">Potwierdzenie dla klienta</legend>
        <label className="flex items-start gap-3 text-sm font-medium">
          <input type="checkbox" name="smsConsent" value="1" defaultChecked />
          <span>
            Klient zgadza się na SMS serwisowy (nie marketing) — RODO
            <span className="mt-0.5 block text-xs font-normal text-muted">
              Potwierdzenie przyjęcia, kod zlecenia i status. PIN i hasło urządzenia nigdy nie trafiają do SMS.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm font-medium">
          <input type="checkbox" name="sendSms" value="1" defaultChecked />
          <span>Wyślij potwierdzenie SMS</span>
        </label>
        <label className="flex items-start gap-3 text-sm font-medium">
          <input type="checkbox" name="printProtocol" value="1" />
          <span>Drukuj protokół po zapisie</span>
        </label>
      </fieldset>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <button className="ks-btn ks-btn-primary" disabled={pending} type="submit">
          {pending ? "Zapis…" : "Zapisz zlecenie"}
        </button>
      </div>
    </form>
  );
}
