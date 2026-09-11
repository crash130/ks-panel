import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin } from "@/lib/auth";
import { createOffer, saveMultiOffer } from "@/lib/offers";
import { prisma } from "@/lib/db";
import type { OfferType } from "@prisma/client";

const PRESETS: Record<string, { title: string; lines: { name: string; qty: number; unitPriceNetGr: number; sku?: string }[] }> = {
  hardware: {
    title: "Sprzęt i komputery",
    lines: [
      { sku: "NB-01", name: "Laptop biznesowy 16\"", qty: 1, unitPriceNetGr: 450000 },
      { name: "Konfiguracja systemu i migracja danych", qty: 1, unitPriceNetGr: 25000 },
    ],
  },
  service: {
    title: "Usługi serwisowe",
    lines: [
      { name: "Diagnostyka", qty: 1, unitPriceNetGr: 9900 },
      { name: "Naprawa / czyszczenie", qty: 1, unitPriceNetGr: 19900 },
      { name: "Odzysk danych (wycena po diagnozie)", qty: 1, unitPriceNetGr: 0 },
    ],
  },
  cctv: {
    title: "Monitoring i montaż",
    lines: [
      { name: "Kamera IP 4 Mpx", qty: 4, unitPriceNetGr: 28900 },
      { name: "Rejestrator NVR 8 kan.", qty: 1, unitPriceNetGr: 69000 },
      { name: "Montaż i uruchomienie", qty: 1, unitPriceNetGr: 80000 },
    ],
  },
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const body = await request.json();
  const type = (body.type as OfferType) || "MULTI";
  const preset = body.preset as string | undefined;
  const p = preset ? PRESETS[preset] : null;
  const offer = await createOffer(
    type,
    p?.title ?? (type === "PRODUCT_CARD" ? "Nowa karta produktu" : "Nowa oferta"),
    "Klient",
  );
  if (p && type === "MULTI") {
    await saveMultiOffer(offer.id, {
      title: p.title,
      clientName: "Klient",
      vatRate: 23,
      lines: p.lines,
    });
  }
  const fresh = await prisma.offer.findUnique({ where: { id: offer.id } });
  return NextResponse.json({ id: fresh?.id, number: fresh?.number });
}
