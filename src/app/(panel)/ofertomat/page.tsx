import Link from "next/link";
import { List, Laptop, Wrench, Cctv, FileSpreadsheet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { OFFER_TYPE_LABEL } from "@/lib/status";
import { offerGross } from "@/lib/offers";
import { CreateOfferButtons } from "@/components/CreateOfferButtons";

export const metadata = { title: "Ofertomat" };
export const dynamic = "force-dynamic";

export default async function OfertomatPage() {
  await requireUser();
  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { lines: true, product: true },
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">Ofertomat</h1>
        <p className="mt-1 text-sm text-muted">
          Wybierz tryb oferty — wielopozycyjna jak w salonie albo karta jednego produktu
        </p>
      </div>

      <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-muted">Tryb oferty</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="ks-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
              <List />
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase text-primary">
              Wielopozycyjna
            </span>
          </div>
          <h2 className="mt-4 text-lg font-extrabold">Oferta wielopozycyjna</h2>
          <p className="mt-2 text-sm text-muted">
            Salonowy arkusz z wieloma pozycjami — sprzęt, usługi, monitoring. Tabela SKU, zdjęcia, bloki urządzeń i
            montażu.
          </p>
          <CreateOfferButtons type="MULTI" label="Otwórz edytor / PDF" />
        </div>
        <div className="ks-card border-2 border-primary/30 bg-gradient-to-br from-white to-sky-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-primary">
              <Laptop />
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase text-primary">
              1 produkt
            </span>
          </div>
          <h2 className="mt-4 text-lg font-extrabold">Karta produktu (1 szt.)</h2>
          <p className="mt-2 text-sm text-muted">
            Jak w x-kom / Komputronik / Media Expert — hero, galeria, kluczowe parametry, pełna specyfikacja i cena.
            Idealna na laptop lub PC.
          </p>
          <CreateOfferButtons type="PRODUCT_CARD" label="Złóż kartę produktu" />
        </div>
      </div>

      <p className="mt-8 text-[11px] font-bold uppercase tracking-wider text-muted">
        Szybki start (szablony wielopozycyjne)
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <Template icon={<Laptop className="text-primary" />} title="Sprzęt i komputery" text="Laptopy, PC, podzespoły — prezentacja salonowa ze zdjęciami i SKU." type="MULTI" preset="hardware" />
        <Template icon={<Wrench className="text-primary" />} title="Usługi serwisowe" text="Diagnostyka, naprawa, montaż, odzysk danych — pozycje usługowe." type="MULTI" preset="service" />
        <Template icon={<Cctv className="text-primary" />} title="Monitoring i montaż" text="Kamery IP, NVR, okablowanie i robocizna — bloki urządzeń i montażu." type="MULTI" preset="cctv" />
      </div>

      <section className="ks-card mt-8 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4 font-bold">
          <FileSpreadsheet size={16} /> Ostatnie oferty
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Numer</th>
                <th className="px-3 py-3">Tytuł</th>
                <th className="px-3 py-3">Typ</th>
                <th className="px-3 py-3">Klient</th>
                <th className="px-3 py-3">Ważna do</th>
                <th className="px-3 py-3">Brutto</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted">
                    Brak ofert. Wybierz tryb powyżej.
                  </td>
                </tr>
              )}
              {offers.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-5 py-3 font-bold text-primary">{o.number}</td>
                  <td className="px-3 py-3 font-medium">{o.title}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        o.type === "PRODUCT_CARD" ? "bg-sky-100 text-sky-800" : "bg-blue-50 text-primary"
                      }`}
                    >
                      {OFFER_TYPE_LABEL[o.type]}
                    </span>
                  </td>
                  <td className="px-3 py-3">{o.clientName}</td>
                  <td className="px-3 py-3">{formatDate(o.validUntil)}</td>
                  <td className="px-3 py-3 font-bold">{formatMoney(offerGross(o))}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/ofertomat/${o.id}`} className="ks-btn ks-btn-ghost px-3 py-1 text-xs">
                        Edytuj
                      </Link>
                      <a href={`/api/pdf/offer/${o.id}`} className="ks-btn ks-btn-ghost px-3 py-1 text-xs">
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Template({
  icon,
  title,
  text,
  type,
  preset,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  type: "MULTI" | "PRODUCT_CARD";
  preset: string;
}) {
  return (
    <div className="ks-card p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">{icon}</div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
      <CreateOfferButtons type={type} preset={preset} label="Użyj szablonu" ghost />
    </div>
  );
}
