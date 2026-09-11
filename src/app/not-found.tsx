import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ks-cloud flex min-h-screen items-center justify-center px-4">
      <div className="ks-card max-w-md p-8 text-center">
        <h1 className="text-2xl font-extrabold">Nie znaleziono strony</h1>
        <p className="mt-2 text-sm text-muted">Sprawdź adres albo wróć do panelu KS.</p>
        <Link href="/pulpit" className="ks-btn ks-btn-primary mt-6 inline-flex">
          Pulpit
        </Link>
      </div>
    </div>
  );
}
