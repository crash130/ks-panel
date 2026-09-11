import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const PUBLIC =
  /^\/(login|setup|oferta|api\/auth\/login|api\/health|api\/calendar\/callback|api\/files)(\/|$)/;

export function middleware(request: Request) {
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/brand") ||
    url.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  if (PUBLIC.test(url.pathname) || url.pathname === "/") {
    return NextResponse.next();
  }
  const cookie = request.headers.get("cookie") ?? "";
  const hasSession = cookie.split(";").some((p) => p.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!hasSession && !url.pathname.startsWith("/api/")) {
    const login = new URL("/login", url);
    login.searchParams.set("next", url.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
