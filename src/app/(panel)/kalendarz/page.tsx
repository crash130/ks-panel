import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/google-calendar";
import { formatDate } from "@/lib/format";
import { CalendarActions } from "@/components/CalendarActions";
import { InstallEventForm } from "@/components/InstallEventForm";

export const metadata = { title: "Kalendarz" };
export const dynamic = "force-dynamic";

export default async function KalendarzPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const status = await getConnectionStatus();
  const events = await prisma.calendarEvent.findMany({ orderBy: { startAt: "asc" }, take: 50 });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Kalendarz</h1>
      <p className="mt-1 text-sm text-muted">
        Terminy odbioru i montaży. Synchronizacja z Google Calendar — tylko gdy połączenie jest prawdziwe.
      </p>
      <div className="ks-card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">
              {status.connected ? "Połączono z Google Calendar" : "Google Calendar niepołączony"}
            </div>
            <p className="mt-1 text-sm text-muted">{status.message}</p>
            {status.lastSyncAt && (
              <p className="text-xs text-muted">Ostatnia synchronizacja: {formatDate(status.lastSyncAt)}</p>
            )}
            {status.errorMessage && <p className="text-sm text-rose-700">{status.errorMessage}</p>}
          </div>
          <CalendarActions connected={status.connected} configured={status.configured} />
        </div>
        {sp.ok && <p className="mt-3 text-sm text-emerald-700">Połączono z Google.</p>}
        {sp.err === "noconfig" && (
          <p className="mt-3 text-sm text-amber-700">
            Brak GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. Terminy zostają lokalne.
          </p>
        )}
        {sp.err === "oauth" && <p className="mt-3 text-sm text-rose-700">Autoryzacja Google nie powiodła się.</p>}
      </div>
      <InstallEventForm />
      <div className="ks-card mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-5 py-3">Termin</th>
              <th className="px-3 py-3">Tytuł</th>
              <th className="px-3 py-3">Typ</th>
              <th className="px-3 py-3">Google</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-muted">
                  Brak wydarzeń. Termin z przyjęcia pojawi się tutaj automatycznie.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className="px-5 py-3">{formatDate(e.startAt)}</td>
                <td className="px-3 py-3 font-medium">{e.title}</td>
                <td className="px-3 py-3">{e.type === "pickup" ? "Odbiór" : e.type === "install" ? "Montaż" : e.type}</td>
                <td className="px-3 py-3">
                  {e.syncStatus === "SYNCED" ? (
                    <span className="text-emerald-700">zsynchronizowano</span>
                  ) : e.syncStatus === "ERROR" ? (
                    <span className="text-rose-700">błąd</span>
                  ) : (
                    <span className="text-muted">tylko lokalnie</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
