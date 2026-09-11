import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Pierwsza konfiguracja" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return (
    <div className="ks-cloud flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ks-card w-full max-w-lg p-8">
        <Logo size="lg" />
        <h1 className="mt-6 text-2xl font-extrabold">Konfiguracja początkowa</h1>
        <p className="mt-2 text-sm text-muted">
          Brak kont w bazie. Utwórz konto właściciela salonu {BRAND.legalName}. To jednorazowy krok.
        </p>
        <form action="/api/auth/setup" method="post" className="mt-6 space-y-4">
          <div>
            <label className="ks-label" htmlFor="name">
              Imię i nazwisko
            </label>
            <input id="name" name="name" required defaultValue="Damian" />
          </div>
          <div>
            <label className="ks-label" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="ks-label" htmlFor="password">
              Hasło (min. 10 znaków)
            </label>
            <input id="password" name="password" type="password" minLength={10} required />
          </div>
          <button className="ks-btn ks-btn-primary w-full" type="submit">
            Utwórz konto właściciela
          </button>
        </form>
      </div>
    </div>
  );
}
