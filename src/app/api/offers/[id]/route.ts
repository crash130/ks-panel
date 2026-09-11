import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin } from "@/lib/auth";
import { saveMultiOffer, saveProductCard } from "@/lib/offers";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  const body = await request.json();
  if (existing.type === "MULTI") {
    const offer = await saveMultiOffer(id, body);
    return NextResponse.json({ ok: true, id: offer.id });
  }
  const offer = await saveProductCard(id, {
    ...body,
    validUntil: body.validUntil ? new Date(body.validUntil) : null,
  });
  return NextResponse.json({ ok: true, id: offer.id });
}
