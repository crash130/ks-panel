import { NextResponse } from "next/server";
import { getCurrentUser, assertOrigin } from "@/lib/auth";
import { disconnectGoogle } from "@/lib/google-calendar";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  try {
    await assertOrigin();
  } catch {
    return NextResponse.json({ error: "CSRF" }, { status: 403 });
  }
  await disconnectGoogle();
  return NextResponse.redirect(new URL("/kalendarz", request.url), 303);
}
