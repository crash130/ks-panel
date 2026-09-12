import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptSecret } from "../src/lib/crypto";
import { randomToken } from "../src/lib/crypto";
import { parseShopSpec, pickKeyParams } from "../src/lib/paste-parser";

const prisma = new PrismaClient();

const ME_SPEC = `Identyfikacja
Producent: Dell
Model: XPS 13 9340
SKU / kod: DELL-XPS9340-U7
EAN: 5397184960123 (demo)
Stan: Nowy — zaplombowany

Wydajność
Procesor: Intel Core Ultra 7 155H (16 rdzeni, do 4,8 GHz, NPU AI Boost)
Pamięć RAM: 16 GB LPDDR5x (lutowana)
Dysk: 1 TB SSD NVMe PCIe 4.0
Grafika: Intel Arc Graphics (zintegrowana)

Wyświetlacz
Przekątna: 13,4" (34 cm)
Rozdzielczość: 2880 × 1800 (3K)
Technologia: OLED, dotykowy, 120 Hz, 500 nitów, 100% DCI-P3

Obudowa i łączność
Obudowa: Aluminium, kolor Platinum Silver
Wymiary / waga: 295,7 × 199,1 × 14,8–15,3 mm; ok. 1,18 kg
Porty: 2× Thunderbolt 4, 1× jack 3,5 mm; hub USB-C w zestawie zalecany
Łączność: Wi-Fi 6E, Bluetooth 5.3
Kamera / audio: FHD IR (Windows Hello) · 4-głośniki stereo

Zasilanie i oprogramowanie
Bateria: 55 Wh, do ok. 12–14 h pracy (szacunek)
Zasilacz: 60 W USB-C
System: Windows 11 Home PL (możliwość upgrade do Pro)
Gwarancja: 24 miesiące producenta · lokalne wsparcie KS +30 km`;

async function main() {
  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log("SEED_DEMO_DATA!=true — pomijam seed DEMO. Aplikacja startuje pusta (kreator /setup).");
    return;
  }

  const password = async (p: string) => bcrypt.hash(p, 12);

  const owner = await prisma.user.upsert({
    where: { email: "wlasciciel@demo.ks.local" },
    update: {},
    create: {
      email: "wlasciciel@demo.ks.local",
      name: "Damian (DEMO)",
      passwordHash: await password("DEMO-Wlasciciel-2026!"),
      role: "OWNER",
    },
  });
  const recepcja = await prisma.user.upsert({
    where: { email: "recepcja@demo.ks.local" },
    update: {},
    create: {
      email: "recepcja@demo.ks.local",
      name: "Recepcja (DEMO)",
      passwordHash: await password("DEMO-Recepcja-2026!"),
      role: "RECEPTION",
    },
  });
  const marek = await prisma.user.upsert({
    where: { email: "marek@demo.ks.local" },
    update: {},
    create: {
      email: "marek@demo.ks.local",
      name: "Marek",
      passwordHash: await password("DEMO-Technik-2026!"),
      role: "TECHNICIAN",
    },
  });
  const tomek = await prisma.user.upsert({
    where: { email: "tomek@demo.ks.local" },
    update: {},
    create: {
      email: "tomek@demo.ks.local",
      name: "Tomek",
      passwordHash: await password("DEMO-Technik-2026!"),
      role: "TECHNICIAN",
    },
  });
  void recepcja;

  let pinEnc: string | null = null;
  try {
    pinEnc = encryptSecret("seed-only");
  } catch {
    pinEnc = null;
  }

  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(16, 0, 0, 0);
    return d;
  };

  const jobs = [
    {
      code: "KS-2601",
      clientName: "Anna Kowalska",
      clientPhone: "500100101",
      deviceType: "Laptop",
      deviceBrand: "Dell",
      deviceModel: "XPS 13",
      status: "W_NAPRAWIE" as const,
      technicianId: marek.id,
      promisedPickupAt: day(1),
      issueDescription: "Nie ładuje baterii, diagnostyka zasilania.",
    },
    {
      code: "KS-2602",
      clientName: "Piotr Nowak",
      clientPhone: "500100102",
      deviceType: "PC",
      deviceBrand: "DIY",
      deviceModel: "Ryzen 5",
      status: "OCZEKUJE_NA_CZESCI" as const,
      technicianId: marek.id,
      promisedPickupAt: day(4),
      issueDescription: "Wymiana płyty B450 — oczekiwanie na dostawę.",
    },
    {
      code: "KS-2603",
      clientName: "Sklep ABC Sp. z o.o.",
      clientPhone: "500100103",
      deviceType: "Monitoring",
      deviceModel: "4× IP",
      status: "DIAGNOSTYKA" as const,
      technicianId: tomek.id,
      promisedPickupAt: day(3),
      issueDescription: "Jedna kamera gubi obraz, sprawdzenie PoE.",
    },
    {
      code: "KS-2604",
      clientName: "Jan Wiśniewski",
      clientPhone: "500100104",
      deviceType: "Smartfon",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13",
      status: "GOTOWE_DO_ODBIORU" as const,
      technicianId: marek.id,
      promisedPickupAt: day(0),
      issueDescription: "Wymiana baterii zakończona.",
    },
    {
      code: "KS-2605",
      clientName: "Ewa Zielińska",
      clientPhone: "500100105",
      deviceType: "Laptop",
      deviceBrand: "Apple",
      deviceModel: "MacBook Air M1",
      status: "W_NAPRAWIE" as const,
      technicianId: tomek.id,
      promisedPickupAt: day(-3),
      issueDescription: "Zalanie, korozja na płycie — klient po terminie, wymaga kontaktu.",
    },
    {
      code: "KS-2606",
      clientName: "Biuro Krzyż",
      clientPhone: "500100106",
      deviceType: "Drukarka",
      deviceBrand: "HP",
      deviceModel: "M404",
      status: "PRZYJETE" as const,
      technicianId: null,
      promisedPickupAt: day(5),
      issueDescription: "Zacinanie papieru, czyszczenie ścieżki.",
    },
  ];

  for (const j of jobs) {
    await prisma.job.upsert({
      where: { code: j.code },
      update: {},
      create: {
        ...j,
        devicePinEnc: j.code === "KS-2601" ? pinEnc : null,
        issueDescription: j.issueDescription,
        publicStatusToken: randomToken(18),
      },
    });
  }

  await prisma.job.upsert({
    where: { code: "KS-2599" },
    update: {},
    create: {
      code: "KS-2599",
      clientName: "Klient rozliczony (DEMO)",
      clientPhone: "500100199",
      deviceType: "Laptop",
      deviceModel: "ThinkPad",
      status: "WYDANE",
      issueDescription: "Czyszczenie i pasta.",
      chargeGrosze: 58700,
      releasedAt: new Date(),
      technicianId: marek.id,
      publicStatusToken: randomToken(18),
    },
  });

  const sections = parseShopSpec(ME_SPEC);
  const keyParams = pickKeyParams(sections);
  const token = "demo-of-2603-public";

  const card = await prisma.offer.upsert({
    where: { number: "OF-2603" },
    update: {},
    create: {
      number: "OF-2603",
      type: "PRODUCT_CARD",
      title: "Dell XPS 13 9340 — ultrabook (karta produktu)",
      clientName: "Anna Kowalska",
      validUntil: day(14),
      publicToken: token,
      product: {
        create: {
          sku: "DELL-XPS9340-U7",
          ean: "5397184960123 (demo)",
          brand: "Dell",
          model: "XPS 13 9340",
          condition: "Nowy",
          inStock: true,
          title: "Dell XPS 13 9340 — Intel Core Ultra 7 / 16 GB / 1 TB SSD",
          description:
            "Ultrabook premium w aluminium — jasny ekran OLED 13,4\", cicha praca i cały dzień na baterii. Skonfigurowany i sprawdzony w salonie KS w Krzyżu Wielkopolskim.",
          priceGrossGr: 649900,
          keyParams,
          specs: sections,
          images: [
            { url: "", caption: "Przód / otwarty" },
            { url: "", caption: "Bok USB" },
            { url: "", caption: "Klawiatura" },
          ],
          rawPaste: ME_SPEC,
        },
      },
    },
  });
  void card;

  await prisma.offer.upsert({
    where: { number: "OF-2602" },
    update: {},
    create: {
      number: "OF-2602",
      type: "MULTI",
      title: "3 stacje graficzne + monitory dla studia",
      clientName: "Studio Pixel",
      validUntil: day(19),
      publicToken: randomToken(12),
      lines: {
        create: [
          { position: 1, name: "Stacja graficzna Ryzen 7 + RTX", qty: 3, unitPriceNetGr: 720000 },
          { position: 2, name: "Monitor 27\" 144 Hz", qty: 3, unitPriceNetGr: 129000 },
        ],
      },
    },
  });

  await prisma.offer.upsert({
    where: { number: "OF-2601" },
    update: {},
    create: {
      number: "OF-2601",
      type: "MULTI",
      title: "Monitoring lokalu — 4 kamery + podgląd",
      clientName: "Sklep ABC",
      validUntil: day(9),
      publicToken: randomToken(12),
      lines: {
        create: [
          { position: 1, name: "Kamera IP 4 Mpx", qty: 4, unitPriceNetGr: 28900 },
          { position: 2, name: "NVR + montaż", qty: 1, unitPriceNetGr: 149000 },
        ],
      },
    },
  });

  await prisma.offer.upsert({
    where: { number: "OF-2598" },
    update: {},
    create: {
      number: "OF-2598",
      type: "MULTI",
      title: "Naprawa + upgrade dysku — pakiet firmowy",
      clientName: "Biuro Krzyż",
      validUntil: day(4),
      status: "ACCEPTED",
      publicToken: randomToken(12),
      lines: {
        create: [{ position: 1, name: "SSD 1 TB + przeniesienie systemu", qty: 1, unitPriceNetGr: 150000 }],
      },
    },
  });

  await prisma.inventoryItem.upsert({
    where: { sku: "SSD-512" },
    update: {},
    create: { sku: "SSD-512", name: "SSD 512 GB NVMe", qty: 2, minQty: 5 },
  });
  await prisma.inventoryItem.upsert({
    where: { sku: "PASTA-1" },
    update: {},
    create: { sku: "PASTA-1", name: "Pasta termoprzewodząca", qty: 1, minQty: 3 },
  });

  await prisma.setting.upsert({
    where: { key: "nip" },
    update: {},
    create: { key: "nip", value: "___-___-__-__" },
  });
  await prisma.setting.upsert({
    where: { key: "regon" },
    update: {},
    create: { key: "regon", value: "______________" },
  });

  await prisma.calendarConnection.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", status: "DISCONNECTED" },
  });

  console.log("Seed DEMO zakończony. Konta opisane w README (etykieta DEMO).");
  console.log("Właściciel:", owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
