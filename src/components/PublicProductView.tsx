"use client";

import { useState } from "react";
import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { formatDate, formatMoney } from "@/lib/format";
import { Logo } from "@/components/Logo";
import type { SpecSection } from "@/lib/paste-parser";

export function PublicProductView({
  offer,
}: {
  offer: {
    number: string;
    title: string;
    validUntil: string | null;
    createdAt: string;
    product: {
      title: string;
      description: string;
      sku?: string | null;
      condition?: string | null;
      inStock: boolean;
      priceGrossGr: number;
      keyParams: { label: string; value: string }[];
      specs: SpecSection[];
      images: { url: string; caption?: string }[];
    };
  };
}) {
  const images = offer.product.images.length ? offer.product.images : [{ url: "", caption: "Zdjęcie 1" }];
  const [i, setI] = useState(0);
  const img = images[i];

  return (
    <div className="ks-cloud min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-4">
        <div>
          <Logo size="sm" />
          <div className="mt-1 text-xs text-muted">{BRAND.domain} · oferta dla klienta</div>
        </div>
        <div className="text-right font-extrabold text-primary">
          Oferta {offer.number}
          <div className="text-xs font-medium text-muted">Ważna do {formatDate(offer.validUntil)}</div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="ks-card grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <div className="relative flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-sky-50">
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.caption ?? ""} className="max-h-80 object-contain" />
              ) : (
                <div className="text-center text-sky-400">
                  <div className="text-lg font-bold">{img.caption ?? "Zdjęcie"}</div>
                  <div className="text-xs">KS · PLACEHOLDER</div>
                </div>
              )}
              <button
                type="button"
                className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow"
                onClick={() => setI((i - 1 + images.length) % images.length)}
                aria-label="Poprzednie"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow"
                onClick={() => setI((i + 1) % images.length)}
                aria-label="Następne"
              >
                ›
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((im, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setI(idx)}
                  className={`h-12 w-14 overflow-hidden rounded-lg border-2 ${idx === i ? "border-primary" : "border-transparent bg-sky-50"}`}
                >
                  {im.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={im.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                {offer.product.condition || "Nowy"}
              </span>
              {offer.product.inStock && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-800">Na stanie</span>
              )}
              {offer.product.sku && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">SKU: {offer.product.sku}</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold">{offer.product.title}</h1>
            <p className="mt-3 text-muted">{offer.product.description}</p>
            <div className="mt-4 rounded-2xl bg-sky-50 p-4">
              <div className="text-3xl font-extrabold">{formatMoney(offer.product.priceGrossGr)}</div>
              <div className="text-xs text-muted">brutto · {BRAND.claim}</div>
            </div>
            <p className="mt-3 text-sm text-muted">Pytania i dostępność — telefon w stopce salonu.</p>
          </div>
        </section>
        <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-primary">Najważniejsze parametry</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {offer.product.keyParams.map((p) => (
            <div key={p.label} className="ks-card p-4">
              <div className="text-[11px] uppercase text-muted">{p.label}</div>
              <div className="font-bold">{p.value}</div>
            </div>
          ))}
        </div>
        <section className="ks-card mt-8 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Specyfikacja</h2>
          {offer.product.specs.map((s, idx) => (
            <details key={s.title} open={idx === 0} className="border-b border-line py-3">
              <summary className="cursor-pointer font-bold">{s.title}</summary>
              <div className="mt-2">
                {s.rows.map((r, ri) => (
                  <div key={ri} className={`grid grid-cols-2 gap-2 px-2 py-1 text-sm ${ri % 2 ? "" : "bg-cloud"}`}>
                    <div className="text-muted">{r.key}</div>
                    <div>{r.value}</div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
        <footer className="ks-card mt-8 grid gap-6 p-5 md:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-primary">Salon / kontakt</div>
            <div className="mt-2">{BRAND.domain} · KS</div>
            <div>
              {BRAND.addressLine1}, {BRAND.addressLine2}
            </div>
            <div className="mt-2 text-2xl font-extrabold">Tel. {formatPhoneDisplay()}</div>
            <div className="text-sm text-muted">{BRAND.hours}</div>
            <div className="mt-2 text-xs text-muted">
              {BRAND.claim} · lokalnie {BRAND.reach}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-primary">Dane firmy</div>
            <div className="mt-2 text-sm">NIP: —-—-—-— · REGON: —</div>
            <p className="mt-2 text-sm">
              Oferta {offer.number} · {offer.product.title}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
