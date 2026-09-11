import { Logo } from "@/components/Logo";
import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Logowanie" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const users = await prisma.user.count();
  if (users === 0) redirect("/setup");
  const me = await getCurrentUser();
  if (me) redirect("/pulpit");
  const sp = await searchParams;
  const err =
    sp.error === "rate"
      ? "Zbyt wiele nieudanych prób. Spróbuj za 15 minut."
      : sp.error === "csrf"
        ? "Sesja wygasła. Spróbuj ponownie."
        : sp.error
          ? "Nieprawidłowy e-mail lub hasło."
          : null;

  return (
    <div className="ks-cloud flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ks-card w-full max-w-md p-8">
        <Logo size="lg" />
        <h1 className="mt-6 text-2xl font-extrabold text-navy">Panel KS</h1>
        <p className="mt-1 text-sm text-muted">{BRAND.claim} — {BRAND.domain}</p>
        {err && (
          <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {err}
          </div>
        )}
        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={sp.next ?? "/pulpit"} />
          <div>
            <label className="ks-label" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div>
            <label className="ks-label" htmlFor="password">
              Hasło
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="ks-btn ks-btn-primary w-full" type="submit">
            Zaloguj
          </button>
        </form>
        <p className="mt-6 text-xs text-muted">
          {BRAND.addressLine1}, {BRAND.addressLine2}
          <br />
          tel. {formatPhoneDisplay()} · {BRAND.hours} · zasięg {BRAND.reach}
        </p>
      </div>
    </div>
  );
}
