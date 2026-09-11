import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashToken, randomToken } from "@/lib/crypto";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/cookies";
import type { Role, User } from "@prisma/client";

export { SESSION_COOKIE, CSRF_COOKIE };
const SESSION_DAYS = 14;

export type AuthUser = Pick<User, "id" | "email" | "name" | "role" | "active">;

export function sessionCookieOptions() {
  const secure = process.env.AUTH_SECURE_COOKIES === "true";
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function csrfCookieOptions() {
  const secure = process.env.AUTH_SECURE_COOKIES === "true";
  return {
    httpOnly: false as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const token = randomToken(32);
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { id, userId, expiresAt, ip, userAgent },
  });
  const csrf = randomToken(16);
  return {
    token,
    csrf,
    apply(res: { cookies: { set: (name: string, value: string, opts: object) => unknown } }) {
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      res.cookies.set(CSRF_COOKIE, csrf, csrfCookieOptions());
    },
  };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  store.set(CSRF_COOKIE, "", { ...csrfCookieOptions(), maxAge: 0 });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return null;
  }
  const { id, email, name, role, active } = session.user;
  return { id, email, name, role, active };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/pulpit");
  }
  return user;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function userAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "";
}

export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  let token = store.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = randomToken(16);
    store.set(CSRF_COOKIE, token, csrfCookieOptions());
  }
  return token;
}

export function assertCsrf(formToken: string | null | undefined, cookieToken: string | null | undefined) {
  if (!formToken || !cookieToken || formToken !== cookieToken) {
    throw new Error("Nieprawidłowy token CSRF");
  }
}

export async function assertOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin) return;
  try {
    const url = new URL(origin);
    if (host && url.host !== host) {
      throw new Error("Nieprawidłowe pochodzenie żądania");
    }
  } catch {
    throw new Error("Nieprawidłowe pochodzenie żądania");
  }
}
