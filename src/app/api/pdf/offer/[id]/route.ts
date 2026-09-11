import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pdfOffer } from "@/lib/pdf";
import type { SpecSection } from "@/lib/paste-parser";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  const { id } = await ctx.params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { lines: { orderBy: { position: "asc" } }, product: true },
  });
  if (!offer) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  const buf = await pdfOffer({
    ...offer,
    product: offer.product
      ? {
          ...offer.product,
          keyParams: (offer.product.keyParams as { label: string; value: string }[]) ?? [],
          specs: (offer.product.specs as SpecSection[]) ?? [],
        }
      : null,
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${offer.number}.pdf"`,
    },
  });
}
