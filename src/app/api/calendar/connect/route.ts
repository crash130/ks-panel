import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConnectUrl } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const url = getConnectUrl();
  if (!url) {
    return NextResponse.redirect(new URL("/kalendarz?err=noconfig", request.url));
  }
  return NextResponse.redirect(url);
}
