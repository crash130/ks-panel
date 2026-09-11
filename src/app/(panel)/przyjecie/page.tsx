import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { IntakeForm } from "@/components/IntakeForm";

export const metadata = { title: "Przyjęcie" };
export const dynamic = "force-dynamic";

export default async function PrzyjeciePage() {
  await requireUser();
  const techs = await prisma.user.findMany({
    where: { role: { in: ["TECHNICIAN", "OWNER"] }, active: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">Nowe przyjęcie</h1>
      <p className="mt-1 text-sm text-muted">
        Tworzy zlecenie z kodem KS, protokół PDF i opcjonalne wydarzenie w kalendarzu (termin odbioru).
      </p>
      <div className="ks-card mt-6 p-6">
        <IntakeForm technicians={techs.map((t) => ({ id: t.id, name: t.name }))} />
      </div>
    </div>
  );
}
