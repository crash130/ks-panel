import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { brandPngPath } from "@/lib/brand-assets";
import { formatDate, formatMoney } from "@/lib/format";
import { JOB_STATUS_LABEL } from "@/lib/status";
import type { SpecSection } from "@/lib/paste-parser";

const FONT_REG = path.join(process.cwd(), "src/lib/pdf/fonts/DejaVuSans.ttf");
const FONT_BOLD = path.join(process.cwd(), "src/lib/pdf/fonts/DejaVuSans-Bold.ttf");

function fonts() {
  return {
    regular: fs.existsSync(FONT_REG) ? FONT_REG : "Helvetica",
    bold: fs.existsSync(FONT_BOLD) ? FONT_BOLD : "Helvetica-Bold",
  };
}

function header(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  const f = fonts();
  const lockup = brandPngPath("logo-mono-a.png");
  doc.rect(0, 0, doc.page.width, 8).fill("#0B6EFD");
  if (fs.existsSync(lockup)) {
    doc.image(lockup, 48, 18, { height: 32 });
  }
  doc.font(f.regular).fontSize(8).fillColor("#5B6B82").text(BRAND.claim, 48, 56);
  doc.fillColor("#0A1F44").font(f.bold).fontSize(14).text(title, 48, 74);
  if (subtitle) {
    doc.font(f.regular).fontSize(9).fillColor("#5B6B82").text(subtitle, 48, 94);
  }
}

function footer(doc: PDFKit.PDFDocument) {
  const f = fonts();
  const y = doc.page.height - 54;
  doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor("#E4EBF3").stroke();
  doc.font(f.regular).fontSize(8).fillColor("#5B6B82").text(
    `${BRAND.addressLine1}, ${BRAND.addressLine2}  ·  tel. ${formatPhoneDisplay()}  ·  ${BRAND.hours}  ·  zasięg ${BRAND.reach}`,
    48,
    y + 8,
    { width: doc.page.width - 96 },
  );
}

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function pdfIntake(job: {
  code: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel: string;
  serialNumber?: string | null;
  accessories?: string | null;
  issueDescription: string;
  notes?: string | null;
  promisedPickupAt?: Date | null;
  createdAt: Date;
  status: string;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const f = fonts();
  header(doc, "Protokół przyjęcia sprzętu", job.code);
  doc.font(f.regular).fontSize(10).fillColor("#0A1F44");
  let y = 118;
  const line = (label: string, value: string) => {
    doc.font(f.bold).text(label, 48, y, { width: 160, continued: false });
    doc.font(f.regular).text(value || "—", 210, y, { width: 340 });
    y += 18;
  };
  line("Data przyjęcia", formatDate(job.createdAt));
  line("Klient", job.clientName);
  line("Telefon", job.clientPhone);
  line("E-mail", job.clientEmail ?? "—");
  line("Sprzęt", `${job.deviceType} ${job.deviceBrand ?? ""} ${job.deviceModel}`.trim());
  line("S/N", job.serialNumber ?? "—");
  line("Akcesoria", job.accessories ?? "—");
  line("Opis usterki", job.issueDescription);
  line("Termin odbioru", formatDate(job.promisedPickupAt ?? null));
  line("Status", JOB_STATUS_LABEL[job.status] ?? job.status);
  y += 12;
  doc.font(f.regular).fontSize(8).fillColor("#5B6B82").text(
    "PIN / hasło urządzenia są przechowywane w postaci zaszyfrowanej i nie są drukowane na protokole.",
    48,
    y,
    { width: 500 },
  );
  y += 36;
  doc.font(f.bold).fontSize(10).fillColor("#0A1F44").text("Podpis klienta", 48, y);
  doc.text("Podpis serwisu", 320, y);
  doc.moveTo(48, y + 48).lineTo(220, y + 48).strokeColor("#0A1F44").stroke();
  doc.moveTo(320, y + 48).lineTo(492, y + 48).stroke();
  footer(doc);
  return collect(doc);
}

export async function pdfRelease(job: {
  code: string;
  clientName: string;
  clientPhone: string;
  deviceType: string;
  deviceModel: string;
  issuedNotes?: string | null;
  releasedAt?: Date | null;
  chargeGrosze: number;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const f = fonts();
  header(doc, "Protokół wydania sprzętu", job.code);
  let y = 118;
  const line = (label: string, value: string) => {
    doc.font(f.bold).fontSize(10).fillColor("#0A1F44").text(label, 48, y);
    doc.font(f.regular).text(value || "—", 210, y, { width: 340 });
    y += 18;
  };
  line("Data wydania", formatDate(job.releasedAt ?? new Date()));
  line("Klient", job.clientName);
  line("Telefon", job.clientPhone);
  line("Sprzęt", `${job.deviceType} ${job.deviceModel}`);
  line("Kwota", formatMoney(job.chargeGrosze));
  line("Uwagi", job.issuedNotes ?? "—");
  y += 24;
  doc.font(f.regular).fontSize(9).text(
    "Potwierdzam odbiór sprzętu oraz zapoznanie się z zakresem wykonanych prac.",
    48,
    y,
    { width: 500 },
  );
  y += 40;
  doc.font(f.bold).text("Podpis klienta", 48, y);
  doc.text("Podpis serwisu", 320, y);
  doc.moveTo(48, y + 48).lineTo(220, y + 48).strokeColor("#0A1F44").stroke();
  doc.moveTo(320, y + 48).lineTo(492, y + 48).stroke();
  footer(doc);
  return collect(doc);
}

export async function pdfOffer(offer: {
  number: string;
  title: string;
  clientName: string;
  validUntil: Date | null;
  vatRate: number;
  type: string;
  lines: { sku?: string | null; name: string; qty: number; unitPriceNetGr: number; description?: string | null }[];
  product?: {
    title: string;
    description: string;
    priceGrossGr: number;
    sku?: string | null;
    brand?: string | null;
    keyParams: { label: string; value: string }[];
    specs: SpecSection[];
  } | null;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const f = fonts();
  header(doc, `Oferta ${offer.number}`, offer.title);
  doc.font(f.regular).fontSize(10).fillColor("#0A1F44");
  doc.text(`Klient: ${offer.clientName}`, 48, 118);
  doc.text(`Ważna do: ${formatDate(offer.validUntil)}`, 48, 134);

  if (offer.product) {
    doc.font(f.bold).fontSize(13).text(offer.product.title, 48, 150, { width: 500 });
    doc.font(f.regular).fontSize(9).fillColor("#5B6B82").text(offer.product.description, 48, 172, { width: 500 });
    let y = 210;
    for (const p of offer.product.keyParams.slice(0, 8)) {
      doc.font(f.bold).fontSize(8).fillColor("#5B6B82").text(p.label.toUpperCase(), 48, y);
      doc.font(f.regular).fontSize(10).fillColor("#0A1F44").text(p.value, 180, y, { width: 360 });
      y += 16;
    }
    doc.font(f.bold).fontSize(16).fillColor("#0B6EFD").text(formatMoney(offer.product.priceGrossGr), 48, y + 8);
    y += 40;
    for (const section of offer.product.specs) {
      if (y > 720) {
        doc.addPage();
        y = 48;
      }
      doc.font(f.bold).fontSize(11).fillColor("#0A1F44").text(section.title, 48, y);
      y += 16;
      for (const row of section.rows) {
        if (y > 740) {
          doc.addPage();
          y = 48;
        }
        doc.font(f.regular).fontSize(8).fillColor("#5B6B82").text(row.key, 48, y, { width: 180 });
        doc.fillColor("#0A1F44").text(row.value, 230, y, { width: 310 });
        y += 14;
      }
      y += 8;
    }
  } else {
    let y = 150;
    doc.font(f.bold).fontSize(9).fillColor("#5B6B82");
    doc.text("Lp", 48, y);
    doc.text("Nazwa", 70, y);
    doc.text("Ilość", 360, y);
    doc.text("Netto", 410, y);
    doc.text("VAT", 470, y);
    y += 16;
    let i = 1;
    let netSum = 0;
    for (const line of offer.lines) {
      const net = line.qty * line.unitPriceNetGr;
      netSum += net;
      doc.font(f.regular).fontSize(9).fillColor("#0A1F44");
      doc.text(String(i), 48, y);
      doc.text(`${line.name}${line.sku ? ` (${line.sku})` : ""}`, 70, y, { width: 280 });
      doc.text(String(line.qty), 360, y);
      doc.text(formatMoney(net), 410, y);
      doc.text(`${offer.vatRate}%`, 470, y);
      y += 18;
      i += 1;
    }
    const gross = Math.round(netSum * (1 + offer.vatRate / 100));
    y += 10;
    doc.font(f.bold).fontSize(11).text(`Netto: ${formatMoney(netSum)}`, 360, y);
    y += 16;
    doc.text(`Brutto: ${formatMoney(gross)}`, 360, y);
  }
  footer(doc);
  return collect(doc);
}

export async function pdfLabels(job: {
  code: string;
  clientName: string;
  deviceType: string;
  deviceModel: string;
  createdAt: Date;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 24 });
  const f = fonts();
  const w = (doc.page.width - 48 - 12) / 2;
  const h = 110;
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 24 + col * (w + 12);
    const y = 24 + row * (h + 12);
    doc.roundedRect(x, y, w, h, 8).strokeColor("#0B6EFD").lineWidth(1.2).stroke();
    const mark = brandPngPath("logo-mono-b.png");
    if (fs.existsSync(mark)) {
      doc.image(mark, x + w - 72, y + 12, { height: 18 });
    }
    doc.font(f.bold).fontSize(16).fillColor("#0A1F44").text(job.code, x + 12, y + 12);
    doc.font(f.regular).fontSize(9).fillColor("#5B6B82").text(job.clientName, x + 12, y + 36, { width: w - 24 });
    doc.text(`${job.deviceType} ${job.deviceModel}`, x + 12, y + 52, { width: w - 24 });
    doc.fontSize(8).text(`przyjęto ${formatDate(job.createdAt)}  ·  ${BRAND.phone}`, x + 12, y + 80);
  }
  return collect(doc);
}
