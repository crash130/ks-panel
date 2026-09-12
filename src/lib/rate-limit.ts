import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function isLoginRateLimited(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const failures = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ email: email.toLowerCase() }, { ip }],
    },
  });
  return failures >= MAX_FAILURES;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ip, success },
  });
  if (success) {
    const since = new Date(Date.now() - WINDOW_MS);
    await prisma.loginAttempt.deleteMany({
      where: { email: email.toLowerCase(), ip, success: false, createdAt: { gte: since } },
    });
  }
}

export function loginRateLimitMessage() {
  return "Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za 15 minut.";
}
