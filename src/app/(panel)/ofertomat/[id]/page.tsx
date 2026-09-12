import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProductCardEditor } from "@/components/ProductCardEditor";
import { MultiOfferEditor } from "@/components/MultiOfferEditor";
import type { SpecSection } from "@/lib/paste-parser";

export const dynamic = "force-dynamic";

export default async function OfferEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { lines: { orderBy: { position: "asc" } }, product: true },
  });
  if (!offer) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/ofertomat" className="font-semibold text-primary">
          ← Ofertomat
        </Link>
        <a className="ks-btn ks-btn-ghost py-1 text-xs" href={`/api/pdf/offer/${offer.id}`}>
          Drukuj PDF
        </a>
        {offer.type === "PRODUCT_CARD" && (
          <>
            <a className="ks-btn ks-btn-ghost py-1 text-xs" href={`/api/export/html/${offer.id}?token=${offer.publicToken}`}>
              Eksportuj HTML
            </a>
            <Link className="ks-btn ks-btn-ghost py-1 text-xs" href={`/oferta/${offer.publicToken}`} target="_blank">
              Podgląd jak w salonie internetowym
            </Link>
          </>
        )}
      </div>
      {offer.type === "PRODUCT_CARD" ? (
        <ProductCardEditor
          offer={{
            id: offer.id,
            number: offer.number,
            title: offer.title,
            clientName: offer.clientName,
            clientPhone: offer.clientPhone ?? "",
            clientEmail: offer.clientEmail ?? "",
            validUntil: offer.validUntil ? offer.validUntil.toISOString().slice(0, 10) : "",
            publicToken: offer.publicToken,
            product: {
              sku: offer.product?.sku ?? "",
              ean: offer.product?.ean ?? "",
              brand: offer.product?.brand ?? "",
              model: offer.product?.model ?? "",
              condition: offer.product?.condition ?? "Nowy",
              inStock: offer.product?.inStock ?? true,
              title: offer.product?.title ?? offer.title,
              description: offer.product?.description ?? "",
              priceGrossGr: offer.product?.priceGrossGr ?? 0,
              keyParams: (offer.product?.keyParams as { label: string; value: string }[]) ?? [],
              specs: (offer.product?.specs as SpecSection[]) ?? [],
              images: (offer.product?.images as { url: string; caption?: string }[]) ?? [],
              rawPaste: offer.product?.rawPaste ?? "",
            },
          }}
        />
      ) : (
        <MultiOfferEditor
          offer={{
            id: offer.id,
            number: offer.number,
            title: offer.title,
            clientName: offer.clientName,
            clientPhone: offer.clientPhone ?? "",
            validUntil: offer.validUntil ? offer.validUntil.toISOString().slice(0, 10) : "",
            vatRate: offer.vatRate,
            lines: offer.lines.map((l) => ({
              sku: l.sku ?? "",
              name: l.name,
              description: l.description ?? "",
              qty: l.qty,
              unitPriceNetGr: l.unitPriceNetGr,
            })),
          }}
        />
      )}
    </div>
  );
}
