import { requireRole } from "@/lib/auth";
import { companyExtras, setSetting } from "@/lib/settings";
import { redirect } from "next/navigation";

export const metadata = { title: "Ustawienia" };
export const dynamic = "force-dynamic";

export default async function UstawieniaPage() {
  await requireRole(["OWNER"]);
  const extras = await companyExtras();

  async function save(formData: FormData) {
    "use server";
    await requireRole(["OWNER"]);
    await setSetting("nip", String(formData.get("nip") ?? ""));
    await setSetting("regon", String(formData.get("regon") ?? ""));
    redirect("/ustawienia?ok=1");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold">Ustawienia firmy</h1>
      <p className="mt-1 text-sm text-muted">NIP i REGON są placeholderami do uzupełnienia.</p>
      <form action={save} className="ks-card mt-6 space-y-4 p-6">
        <div>
          <label className="ks-label">NIP</label>
          <input name="nip" defaultValue={extras.nip} />
        </div>
        <div>
          <label className="ks-label">REGON</label>
          <input name="regon" defaultValue={extras.regon} />
        </div>
        <button className="ks-btn ks-btn-primary" type="submit">
          Zapisz
        </button>
      </form>
    </div>
  );
}
