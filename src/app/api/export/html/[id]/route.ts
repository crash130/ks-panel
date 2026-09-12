import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderOfferHtml } from "@/lib/html-export";
import type { SpecSection } from "@/lib/paste-parser";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!offer?.product) return NextResponse.json({ error: "Nie znaleziono karty produktu" }, { status: 404 });
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const user = await getCurrentUser();
  if (!user && token !== offer.publicToken) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });
  }
  const html = renderOfferHtml({
    number: offer.number,
    title: offer.title,
    validUntil: offer.validUntil,
    createdAt: offer.createdAt,
    product: {
      ...offer.product,
      keyParams: (offer.product.keyParams as { label: string; value: string }[]) ?? [],
      specs: (offer.product.specs as SpecSection[]) ?? [],
      images: (offer.product.images as { url: string; caption?: string }[]) ?? [],
    },
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${offer.number}.html"`,
    },
  });
}
