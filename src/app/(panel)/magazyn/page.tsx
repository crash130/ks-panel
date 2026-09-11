import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Magazyn" };
export const dynamic = "force-dynamic";

export default async function MagazynPage() {
  await requireUser();
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Magazyn</h1>
      <p className="mt-1 text-sm text-muted">
        v1: stany minimalne i alerty na pulpicie. Pełna gospodarka dostawcami — poza zakresem.
      </p>
      <div className="ks-card mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-5 py-3">SKU</th>
              <th className="px-3 py-3">Nazwa</th>
              <th className="px-3 py-3">Ilość</th>
              <th className="px-3 py-3">Min.</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-muted">
                  Magazyn pusty. Po seedzie DEMO pojawią się przykładowe pozycje.
                </td>
              </tr>
            )}
            {items.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="px-5 py-3 font-mono text-xs">{i.sku}</td>
                <td className="px-3 py-3">{i.name}</td>
                <td className={`px-3 py-3 font-bold ${i.qty <= i.minQty ? "text-rose-600" : ""}`}>
                  {i.qty} {i.unit}
                </td>
                <td className="px-3 py-3">{i.minQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
