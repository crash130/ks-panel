import { NextResponse } from "next/server";
import { destroySession, sessionCookieOptions, csrfCookieOptions } from "@/lib/auth";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/cookies";
import { redirectUrl } from "@/lib/http";

export async function POST(request: Request) {
  await destroySession();
  const res = NextResponse.redirect(redirectUrl(request, "/login"), 303);
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  res.cookies.set(CSRF_COOKIE, "", { ...csrfCookieOptions(), maxAge: 0 });
  return res;
}
