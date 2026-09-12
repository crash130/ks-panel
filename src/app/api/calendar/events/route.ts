import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncCalendarEvent } from "@/lib/google-calendar";
import { BRAND } from "@/lib/brand";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "12:00");
  if (!title || !date) return NextResponse.json({ error: "Uzupełnij pola" }, { status: 400 });
  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const ev = await prisma.calendarEvent.create({
    data: {
      title,
      startAt,
      endAt,
      type: "install",
      location: `${BRAND.addressLine1}, ${BRAND.addressLine2}`,
      syncStatus: "LOCAL_ONLY",
    },
  });
  const result = await syncCalendarEvent(ev.id);
  return NextResponse.json({
    id: ev.id,
    synced: result.ok,
    message: result.ok
      ? "Zapisano i zsynchronizowano z Google."
      : `Zapisano lokalnie. ${result.message}`,
  });
}
