import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/brand";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function companyExtras() {
  return {
    nip: await getSetting("nip", process.env.COMPANY_NIP || "—-—-—-—"),
    regon: await getSetting("regon", process.env.COMPANY_REGON || "—"),
    name: await getSetting("legalName", BRAND.legalName),
  };
}
