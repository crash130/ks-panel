import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, assertOrigin, clientIp, userAgent } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    await assertOrigin();
  } catch {
    return NextResponse.redirect(new URL("/setup?error=csrf", request.url), 303);
  }
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  const form = await request.formData();
  const parsed = schema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/setup?error=1", request.url), 303);
  }
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      role: "OWNER",
    },
  });
  await createSession(user.id, await clientIp(), await userAgent());
  return NextResponse.redirect(new URL("/pulpit", request.url), 303);
}
