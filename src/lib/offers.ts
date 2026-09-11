import { prisma } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import type { OfferType, Prisma } from "@prisma/client";
import type { SpecSection } from "@/lib/paste-parser";

export async function nextOfferNumber(): Promise<string> {
  const year = new Date().getFullYear() % 100;
  const prefix = `OF-${year}`;
  const last = await prisma.offer.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });
  const n = last ? Number.parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isFinite(n) ? n : 1).padStart(2, "0")}`;
}

export async function createOffer(type: OfferType, title: string, clientName: string) {
  const number = await nextOfferNumber();
  return prisma.offer.create({
    data: {
      number,
      type,
      title,
      clientName,
      publicToken: randomToken(18),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      product:
        type === "PRODUCT_CARD"
          ? {
              create: {
                title,
                description: "",
                priceGrossGr: 0,
                keyParams: [],
                specs: [],
                images: [],
              },
            }
          : undefined,
    },
    include: { lines: true, product: true },
  });
}

export async function saveMultiOffer(
  id: string,
  data: {
    title: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    validUntil?: Date | null;
    vatRate: number;
    notes?: string;
    lines: { sku?: string; name: string; description?: string; qty: number; unitPriceNetGr: number }[];
  },
) {
  await prisma.offerLine.deleteMany({ where: { offerId: id } });
  return prisma.offer.update({
    where: { id },
    data: {
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      validUntil: data.validUntil ?? undefined,
      vatRate: data.vatRate,
      notes: data.notes || null,
      lines: {
        create: data.lines.map((l, i) => ({
          position: i + 1,
          sku: l.sku || null,
          name: l.name,
          description: l.description || null,
          qty: l.qty,
          unitPriceNetGr: l.unitPriceNetGr,
        })),
      },
    },
    include: { lines: true, product: true },
  });
}

export async function saveProductCard(
  offerId: string,
  data: {
    title: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    validUntil?: Date | null;
    sku?: string;
    ean?: string;
    brand?: string;
    model?: string;
    condition?: string;
    inStock: boolean;
    description: string;
    priceGrossGr: number;
    keyParams: { label: string; value: string }[];
    specs: SpecSection[];
    images: { url: string; caption?: string }[];
    rawPaste?: string;
  },
) {
  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      validUntil: data.validUntil ?? undefined,
    },
  });
  const productData: Prisma.ProductCardUpsertArgs["create"] = {
    offerId,
    title: data.title,
    sku: data.sku || null,
    ean: data.ean || null,
    brand: data.brand || null,
    model: data.model || null,
    condition: data.condition || "Nowy",
    inStock: data.inStock,
    description: data.description,
    priceGrossGr: data.priceGrossGr,
    keyParams: data.keyParams,
    specs: data.specs,
    images: data.images,
    rawPaste: data.rawPaste || null,
  };
  await prisma.productCard.upsert({
    where: { offerId },
    create: productData,
    update: productData,
  });
  return prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
    include: { product: true, lines: true },
  });
}

export function offerGross(offer: {
  vatRate: number;
  lines: { qty: number; unitPriceNetGr: number }[];
  product: { priceGrossGr: number } | null;
}): number {
  if (offer.product) return offer.product.priceGrossGr;
  const net = offer.lines.reduce((s, l) => s + l.qty * l.unitPriceNetGr, 0);
  return Math.round(net * (1 + offer.vatRate / 100));
}
