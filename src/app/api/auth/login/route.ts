import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword, assertOrigin } from "@/lib/auth";
import { isLoginRateLimited, recordLoginAttempt, loginRateLimitMessage } from "@/lib/rate-limit";
import { clientIp, userAgent } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await assertOrigin();
  } catch {
    return NextResponse.redirect(new URL("/login?error=csrf", request.url), 303);
  }
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/pulpit");
  const ip = await clientIp();
  const ua = await userAgent();

  if (await isLoginRateLimited(email, ip)) {
    return NextResponse.redirect(new URL("/login?error=rate", request.url), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const dummy = await bcrypt.hash("not-the-password", 10);
  const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, dummy);

  if (!user || !user.active || !ok) {
    await recordLoginAttempt(email, ip, false);
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  await recordLoginAttempt(email, ip, true);
  await createSession(user.id, ip, ua);
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/pulpit";
  return NextResponse.redirect(new URL(dest, request.url), 303);
}
