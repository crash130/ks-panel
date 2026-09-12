import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME ?? "Właściciel";
  if (!email || !password || password.length < 10) {
    console.error("Ustaw OWNER_EMAIL i OWNER_PASSWORD (min. 10 znaków).");
    process.exit(1);
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.log("Konto już istnieje:", email);
    return;
  }
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: "OWNER",
    },
  });
  console.log("Utworzono właściciela:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
