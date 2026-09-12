import { NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err || !code) {
    return NextResponse.redirect(new URL("/kalendarz?err=oauth", request.url));
  }
  try {
    await handleOAuthCallback(code);
    return NextResponse.redirect(new URL("/kalendarz?ok=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/kalendarz?err=oauth", request.url));
  }
}
