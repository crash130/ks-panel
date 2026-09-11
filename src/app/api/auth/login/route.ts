import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword, assertOrigin, clientIp, userAgent } from "@/lib/auth";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/rate-limit";
import { redirectUrl } from "@/lib/http";

const DUMMY_HASH = "$2b$10$DyeD5t7QxU7VRHKUlg1wqe4YZanXOD.BHXPLT0bd/PFbR5qMHI3Xi";

export async function POST(request: Request) {
  try {
    await assertOrigin();
  } catch {
    return NextResponse.redirect(redirectUrl(request, "/login?error=csrf"), 303);
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
    return NextResponse.redirect(redirectUrl(request, "/login?error=rate"), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active || !ok) {
    await recordLoginAttempt(email, ip, false);
    return NextResponse.redirect(redirectUrl(request, "/login?error=1"), 303);
  }

  await recordLoginAttempt(email, ip, true);
  const session = await createSession(user.id, ip, ua);
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/pulpit";
  const res = NextResponse.redirect(redirectUrl(request, dest), 303);
  session.apply(res);
  return res;
}
