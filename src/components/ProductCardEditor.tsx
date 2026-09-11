"use client";

import { useMemo, useState } from "react";
import { parseShopSpec, pickKeyParams, type SpecSection } from "@/lib/paste-parser";
import { formatMoney, parseMoneyToGrosze } from "@/lib/format";
import { Image as ImageIcon, Share2 } from "lucide-react";

type ImageItem = { url: string; caption?: string };

export function ProductCardEditor({
  offer,
}: {
  offer: {
    id: string;
    number: string;
    title: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    validUntil: string;
    publicToken: string;
    product: {
      sku: string;
      ean: string;
      brand: string;
      model: string;
      condition: string;
      inStock: boolean;
      title: string;
      description: string;
      priceGrossGr: number;
      keyParams: { label: string; value: string }[];
      specs: SpecSection[];
      images: ImageItem[];
      rawPaste: string;
    };
  };
}) {
  const [p, setP] = useState(offer.product);
  const [clientName, setClientName] = useState(offer.clientName);
  const [validUntil, setValidUntil] = useState(offer.validUntil);
  const [paste, setPaste] = useState(offer.product.rawPaste);
  const [pasteDesc, setPasteDesc] = useState("");
  const [status, setStatus] = useState("Nowy");
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string>(p.specs[0]?.title ?? "");

  const priceDisplay = useMemo(() => (p.priceGrossGr / 100).toFixed(2).replace(".", ","), [p.priceGrossGr]);

  function applyParser() {
    const sections = parseShopSpec(paste);
    const keys = pickKeyParams(sections);
    const rows = sections.flatMap((s) => s.rows);
    const sku = rows.find((r) => /sku|kod/i.test(r.key))?.value ?? p.sku;
    const brand = rows.find((r) => /producent|marka/i.test(r.key))?.value ?? p.brand;
    const model = rows.find((r) => /^model$/i.test(r.key))?.value ?? p.model;
    const ean = rows.find((r) => /ean/i.test(r.key))?.value ?? p.ean;
    setP((prev) => ({
      ...prev,
      specs: sections,
      keyParams: keys.length ? keys : prev.keyParams,
      sku,
      brand,
      model,
      ean,
      description: pasteDesc.trim() || prev.description,
      rawPaste: paste,
    }));
    if (sections[0]) setOpen(sections[0].title);
  }

  async function save() {
    setMsg(null);
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title,
        clientName,
        clientPhone: offer.clientPhone,
        clientEmail: offer.clientEmail,
        validUntil,
        ...p,
        rawPaste: paste,
      }),
    });
    setMsg(res.ok ? "Zapisano kartę produktu." : "Nie udało się zapisać.");
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setP((prev) => ({
        ...prev,
        images: [...prev.images, { url: data.url, caption: file.name }],
      }));
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Karta produktu</p>
          <h1 className="text-2xl font-extrabold">Edytor oferty — {offer.number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ks-btn ks-btn-ghost" onClick={save}>
            Zapisz
          </button>
          <a className="ks-btn ks-btn-ghost" href={`/oferta/${offer.publicToken}`} target="_blank">
            <Share2 size={14} /> Podgląd klienta
          </a>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <Field label="Numer oferty" value={offer.number} readOnly />
        <div>
          <label className="ks-label">Klient</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <label className="ks-label">Ważna do</label>
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div>
          <label className="ks-label">Stan</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Nowy</option>
            <option>Używany</option>
            <option>Demo</option>
          </select>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="w-auto"
          checked={p.inStock}
          onChange={(e) => setP({ ...p, inStock: e.target.checked })}
        />
        Na stanie — odbiór od ręki
      </label>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="ks-card flex min-h-[280px] flex-col items-center justify-center border-dashed p-8 text-center text-muted">
          {p.images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0].url} alt="" className="max-h-64 object-contain" />
          ) : (
            <>
              <ImageIcon className="mb-3 text-primary" />
              <p className="font-semibold text-navy">Zdjęcie główne — wgraj plik</p>
              <p className="text-xs">placeholder — podmień na zdjęcie produktu</p>
            </>
          )}
          <input className="mt-4" type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />
        </div>
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">{p.condition || status}</span>
            {p.inStock && <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-800">Na stanie</span>}
            {p.sku && <span className="rounded-full bg-slate-100 px-2 py-0.5">SKU: {p.sku}</span>}
          </div>
          <label className="ks-label mt-3">Tytuł</label>
          <input className="text-xl font-extrabold" value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} />
          <label className="ks-label mt-3">Opis</label>
          <textarea rows={4} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} />
          <label className="ks-label mt-3">Cena brutto (zł)</label>
          <input
            value={priceDisplay}
            onChange={(e) => setP({ ...p, priceGrossGr: parseMoneyToGrosze(e.target.value) })}
          />
          <div className="mt-2 text-2xl font-extrabold text-navy">{formatMoney(p.priceGrossGr)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {["sku", "ean", "brand", "model", "condition"].map((k) => (
          <div key={k}>
            <label className="ks-label">{k.toUpperCase()}</label>
            <input
              value={String(p[k as keyof typeof p] ?? "")}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-primary">Najważniejsze parametry</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {(p.keyParams.length ? p.keyParams : [{ label: "", value: "" }]).map((kp, i) => (
          <div key={i} className="ks-card p-3">
            <input
              className="mb-1 text-xs uppercase"
              placeholder="Etykieta"
              value={kp.label}
              onChange={(e) => {
                const next = [...p.keyParams];
                next[i] = { ...kp, label: e.target.value };
                setP({ ...p, keyParams: next });
              }}
            />
            <input
              placeholder="Wartość"
              value={kp.value}
              onChange={(e) => {
                const next = [...(p.keyParams.length ? p.keyParams : [{ label: "", value: "" }])];
                next[i] = { ...kp, value: e.target.value };
                setP({ ...p, keyParams: next });
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-bold text-primary"
        onClick={() => setP({ ...p, keyParams: [...p.keyParams, { label: "", value: "" }] })}
      >
        + parametr
      </button>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-primary">Wklej ze sklepu (x-kom / Media Expert / Komputronik)</h2>
      <div className="ks-card mt-3 p-5">
        <label className="ks-label">Wklej specyfikację</label>
        <textarea
          rows={8}
          placeholder={"Producent: Dell\nModel: XPS 13 9340\nProcesor: Intel Core Ultra 7 155H"}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <label className="ks-label mt-3">Opcjonalny opis (wklej opis produktu)</label>
        <textarea rows={3} value={pasteDesc} onChange={(e) => setPasteDesc(e.target.value)} />
        <button type="button" className="ks-btn ks-btn-primary mt-3" onClick={applyParser}>
          Rozbij do tabeli
        </button>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-primary">Specyfikacja</h2>
      <div className="ks-card mt-3 divide-y divide-line">
        {p.specs.length === 0 && <p className="p-5 text-sm text-muted">Brak tabeli — wklej specyfikację i kliknij „Rozbij do tabeli”.</p>}
        {p.specs.map((s) => (
          <div key={s.title} className="p-4">
            <button type="button" className="w-full text-left font-bold" onClick={() => setOpen(open === s.title ? "" : s.title)}>
              {s.title}
            </button>
            {open === s.title && (
              <div className="mt-2">
                {s.rows.map((r, i) => (
                  <div key={i} className={`grid grid-cols-2 gap-2 px-2 py-1 text-sm ${i % 2 ? "" : "bg-cloud/70"}`}>
                    <div className="text-muted">{r.key}</div>
                    <div>{r.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="ks-btn ks-btn-primary" onClick={save}>
          Zapisz kartę
        </button>
        <a className="ks-btn ks-btn-ghost" href={`/api/pdf/offer/${offer.id}`}>
          Drukuj PDF
        </a>
      </div>
    </div>
  );
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="ks-label">{label}</label>
      <input defaultValue={value} readOnly={readOnly} />
    </div>
  );
}
