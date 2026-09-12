import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicProductView } from "@/components/PublicProductView";
import type { SpecSection } from "@/lib/paste-parser";

export const dynamic = "force-dynamic";

export default async function PublicOfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = await prisma.offer.findUnique({
    where: { publicToken: token },
    include: { product: true },
  });
  if (!offer?.product) notFound();
  return (
    <PublicProductView
      offer={{
        number: offer.number,
        title: offer.title,
        validUntil: offer.validUntil ? offer.validUntil.toISOString() : null,
        createdAt: offer.createdAt.toISOString(),
        product: {
          ...offer.product,
          keyParams: (offer.product.keyParams as { label: string; value: string }[]) ?? [],
          specs: (offer.product.specs as SpecSection[]) ?? [],
          images: (offer.product.images as { url: string; caption?: string }[]) ?? [],
        },
      }}
    />
  );
}
