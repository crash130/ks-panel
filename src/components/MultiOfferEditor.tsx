"use client";

import { useState } from "react";
import { formatMoney, parseMoneyToGrosze } from "@/lib/format";

type Line = { sku: string; name: string; description: string; qty: number; unitPriceNetGr: number };

export function MultiOfferEditor({
  offer,
}: {
  offer: {
    id: string;
    number: string;
    title: string;
    clientName: string;
    clientPhone: string;
    validUntil: string;
    vatRate: number;
    lines: Line[];
  };
}) {
  const [title, setTitle] = useState(offer.title);
  const [clientName, setClientName] = useState(offer.clientName);
  const [validUntil, setValidUntil] = useState(offer.validUntil);
  const [vatRate, setVatRate] = useState(offer.vatRate);
  const [lines, setLines] = useState<Line[]>(offer.lines.length ? offer.lines : [{ sku: "", name: "", description: "", qty: 1, unitPriceNetGr: 0 }]);
  const [msg, setMsg] = useState<string | null>(null);

  const net = lines.reduce((s, l) => s + l.qty * l.unitPriceNetGr, 0);
  const gross = Math.round(net * (1 + vatRate / 100));

  async function save() {
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, clientName, validUntil, vatRate, lines }),
    });
    setMsg(res.ok ? "Zapisano ofertę." : "Błąd zapisu.");
  }

  function update(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-extrabold">
        Oferta {offer.number}
      </h1>
      {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="ks-label">Tytuł</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="ks-label">Klient</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <label className="ks-label">Ważna do</label>
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div>
          <label className="ks-label">VAT %</label>
          <input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
        </div>
      </div>
      <div className="ks-card mt-6 overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-2">SKU</th>
              <th className="p-2">Nazwa</th>
              <th className="p-2">Ilość</th>
              <th className="p-2">Cena netto</th>
              <th className="p-2">Suma</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="p-2">
                  <input value={l.sku} onChange={(e) => update(i, { sku: e.target.value })} />
                </td>
                <td className="p-2">
                  <input value={l.name} onChange={(e) => update(i, { name: e.target.value })} />
                </td>
                <td className="p-2 w-24">
                  <input type="number" value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
                </td>
                <td className="p-2">
                  <input
                    value={(l.unitPriceNetGr / 100).toFixed(2).replace(".", ",")}
                    onChange={(e) => update(i, { unitPriceNetGr: parseMoneyToGrosze(e.target.value) })}
                  />
                </td>
                <td className="p-2 font-semibold">{formatMoney(l.qty * l.unitPriceNetGr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="mt-3 text-sm font-bold text-primary"
          onClick={() => setLines([...lines, { sku: "", name: "", description: "", qty: 1, unitPriceNetGr: 0 }])}
        >
          + pozycja
        </button>
        <div className="mt-4 text-right">
          <div>Netto: {formatMoney(net)}</div>
          <div className="text-xl font-extrabold">Brutto: {formatMoney(gross)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="ks-btn ks-btn-primary" onClick={save}>
          Zapisz ofertę
        </button>
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/offer/${offer.id}`}>
          PDF
        </a>
      </div>
    </div>
  );
}
