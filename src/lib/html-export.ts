import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { brandPngDataUri } from "@/lib/brand-assets";
import { formatDate, formatMoney, escapeHtml } from "@/lib/format";
import type { SpecSection } from "@/lib/paste-parser";

export type PublicOffer = {
  number: string;
  title: string;
  validUntil: Date | null;
  createdAt: Date;
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

export function renderOfferHtml(offer: PublicOffer, opts?: { embedImages?: Record<string, string> }): string {
  const images = offer.product.images.length
    ? offer.product.images
    : [{ url: "", caption: "Zdjęcie 1" }];
  const slides = images
    .map((img, i) => {
      const src = (opts?.embedImages && img.url && opts.embedImages[img.url]) || img.url || "";
      const caption = escapeHtml(img.caption || `Zdjęcie ${i + 1}`);
      return `<figure class="slide${i === 0 ? " active" : ""}" data-i="${i}">
        ${src ? `<img src="${escapeHtml(src)}" alt="${caption}">` : `<div class="ph"><span>${caption}</span><small>KS · PLACEHOLDER</small></div>`}
      </figure>`;
    })
    .join("");
  const thumbs = images
    .map((img, i) => {
      const src = (opts?.embedImages && img.url && opts.embedImages[img.url]) || img.url || "";
      return `<button type="button" class="thumb${i === 0 ? " on" : ""}" data-i="${i}" aria-label="Zdjęcie ${i + 1}">${src ? `<img src="${escapeHtml(src)}" alt="">` : ""}</button>`;
    })
    .join("");
  const params = offer.product.keyParams
    .map((p) => `<div class="param"><span>${escapeHtml(p.label)}</span><strong>${escapeHtml(p.value)}</strong></div>`)
    .join("");
  const specs = offer.product.specs
    .map((s, idx) => {
      const rows = s.rows
        .map(
          (r, ri) =>
            `<div class="tr${ri % 2 ? "" : " alt"}"><dt>${escapeHtml(r.key)}</dt><dd>${escapeHtml(r.value)}</dd></div>`,
        )
        .join("");
      return `<details class="acc" ${idx === 0 ? "open" : ""}>
        <summary>${escapeHtml(s.title)}</summary>
        <div class="acc-body">${rows}</div>
      </details>`;
    })
    .join("");

  const logoSrc = brandPngDataUri("logo-mono-a.png");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Oferta ${escapeHtml(offer.number)} — ${escapeHtml(offer.product.title)}</title>
<style>
:root{--navy:#0A1F44;--primary:#0B6EFD;--accent:#00C2FF;--cloud:#F3F7FC;--muted:#5B6B82;--line:#E4EBF3}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,sans-serif;background:var(--cloud);color:var(--navy)}
.top{background:#fff;border-bottom:1px solid var(--line);padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;align-items:center;gap:10px}
.brand img{height:40px;width:auto;display:block}
.meta{text-align:right;color:var(--primary);font-weight:800}
.meta small{display:block;color:var(--muted);font-weight:500}
.wrap{max-width:1080px;margin:0 auto;padding:28px 16px 64px}
.hero{background:#fff;border:1px solid var(--line);border-radius:24px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:28px}
@media(max-width:800px){.hero{grid-template-columns:1fr}.top{flex-direction:column;align-items:flex-start}}
.stage{background:#F4F8FF;border:1px dashed #BFD4F8;border-radius:20px;min-height:320px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.slide{display:none;width:100%;height:100%;min-height:320px;align-items:center;justify-content:center;flex-direction:column}
.slide.active{display:flex}.slide img{max-width:100%;max-height:360px;object-fit:contain}
.ph{text-align:center;color:#7BA0D4}.ph span{display:block;font-weight:700;font-size:20px}
.nav{position:absolute;top:50%;transform:translateY(-50%);background:#fff;border:0;width:36px;height:36px;border-radius:50%;box-shadow:0 4px 14px #0A1F4414;cursor:pointer;font-size:18px}
.nav.prev{left:10px}.nav.next{right:10px}
.thumbs{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.thumb{width:56px;height:48px;border-radius:10px;border:2px solid transparent;background:#EEF4FF;cursor:pointer;overflow:hidden}
.thumb.on{border-color:var(--primary)}.thumb img{width:100%;height:100%;object-fit:cover}
.badge{display:inline-flex;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;margin-right:6px}
.b-new{background:#DCFCE7;color:#166534}.b-stock{background:#E0F2FE;color:#075985}.b-sku{background:#F1F5F9;color:#334155;font-weight:600}
h1{font-size:28px;line-height:1.2;margin:12px 0}
.desc{color:var(--muted);line-height:1.55}
.price{background:#EAF3FF;border-radius:16px;padding:16px 18px;margin:18px 0}
.price b{font-size:28px;color:var(--navy)}
.price small{display:block;color:var(--muted);margin-top:4px}
.facts{font-size:13px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap}
.params{margin-top:28px}
.params h2{font-size:12px;letter-spacing:.08em;color:var(--primary);text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:700px){.grid{grid-template-columns:1fr}}
.param{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.param span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.spec{margin-top:28px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:8px 18px 18px}
.acc{border-bottom:1px solid var(--line)}
.acc summary{cursor:pointer;padding:14px 0;font-weight:700;list-style:none;display:flex;justify-content:space-between}
.acc summary::-webkit-details-marker{display:none}
.acc summary:after{content:"▾";color:var(--muted)}
.tr{display:grid;grid-template-columns:220px 1fr;gap:12px;padding:8px 0;font-size:14px}
.tr.alt{background:#F8FBFF;margin:0 -8px;padding:8px}
.tr dt{color:var(--muted);font-weight:600}
.foot{margin-top:28px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px}
@media(max-width:700px){.foot{grid-template-columns:1fr}}
.foot h3{font-size:11px;letter-spacing:.08em;color:var(--primary);margin:0 0 8px}
.phone{font-size:22px;font-weight:800;margin:8px 0}
a{color:var(--primary)}
</style>
</head>
<body>
<header class="top">
  <div class="brand">
    <img src="${logoSrc}" alt="KS komputer serwis" height="40">
    <div><small style="color:#5B6B82;font-weight:500">${escapeHtml(BRAND.domain)} · oferta dla klienta</small>
    </div>
  </div>
  <div class="meta">Oferta ${escapeHtml(offer.number)}<small>Ważna do ${escapeHtml(formatDate(offer.validUntil))}</small></div>
</header>
<main class="wrap">
  <section class="hero">
    <div>
      <div class="stage" id="stage">
        ${slides}
        <button class="nav prev" type="button" data-dir="-1" aria-label="Poprzednie">‹</button>
        <button class="nav next" type="button" data-dir="1" aria-label="Następne">›</button>
      </div>
      <div class="thumbs" id="thumbs">${thumbs}</div>
    </div>
    <div>
      <div>
        <span class="badge b-new">${escapeHtml(offer.product.condition || "Nowy")}</span>
        ${offer.product.inStock ? `<span class="badge b-stock">Na stanie</span>` : ""}
        ${offer.product.sku ? `<span class="badge b-sku">SKU: ${escapeHtml(offer.product.sku)}</span>` : ""}
      </div>
      <h1>${escapeHtml(offer.product.title)}</h1>
      <p class="desc">${escapeHtml(offer.product.description)}</p>
      <div class="price"><b>${escapeHtml(formatMoney(offer.product.priceGrossGr))}</b>
        <small>brutto · ${escapeHtml(BRAND.claim)}</small>
      </div>
      <div class="facts">
        <span>Numer: <b>${escapeHtml(offer.number)}</b></span>
        <span>Data: <b>${escapeHtml(formatDate(offer.createdAt))}</b></span>
        <span>Ważna do: <b>${escapeHtml(formatDate(offer.validUntil))}</b></span>
      </div>
      <p class="desc" style="margin-top:14px">Pytania i dostępność — telefon w stopce salonu.</p>
    </div>
  </section>
  <section class="params">
    <h2>✦ Najważniejsze parametry</h2>
    <div class="grid">${params}</div>
  </section>
  <section class="spec">
    <h2 style="font-size:12px;letter-spacing:.08em;color:var(--primary);text-transform:uppercase">Specyfikacja</h2>
    ${specs}
  </section>
  <footer class="foot">
    <div>
      <h3>Salon / kontakt</h3>
      <div>${escapeHtml(BRAND.domain)} · KS</div>
      <div>${escapeHtml(BRAND.addressLine1)}, ${escapeHtml(BRAND.addressLine2)}</div>
      <div class="phone">Tel. ${escapeHtml(formatPhoneDisplay())}</div>
      <div>${escapeHtml(BRAND.hours)} (soboty w terenie)</div>
      <div style="margin-top:10px;font-size:12px;color:var(--muted)">${escapeHtml(BRAND.claim)} · lokalnie ${escapeHtml(BRAND.reach)}</div>
    </div>
    <div>
      <h3>Dane firmy</h3>
      <div>NIP: —-—-—-— · REGON: —</div>
      <div style="color:var(--muted);font-size:12px">(placeholdery — do uzupełnienia)</div>
      <p>Oferta ${escapeHtml(offer.number)} · ${escapeHtml(offer.product.title)}</p>
      <p>Cena dotyczy egzemplarza na stanie w salonie.</p>
    </div>
  </footer>
</main>
<script>
(function(){
  const slides=[].slice.call(document.querySelectorAll('.slide'));
  const thumbs=[].slice.call(document.querySelectorAll('.thumb'));
  let i=0;
  function go(n){
    i=(n+slides.length)%slides.length;
    slides.forEach((s,idx)=>s.classList.toggle('active',idx===i));
    thumbs.forEach((t,idx)=>t.classList.toggle('on',idx===i));
  }
  document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>go(i+Number(b.getAttribute('data-dir')))));
  thumbs.forEach(t=>t.addEventListener('click',()=>go(Number(t.getAttribute('data-i')))));
})();
</script>
</body></html>`;
}
