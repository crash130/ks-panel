import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.productName} · ${BRAND.legalName}`,
    template: `%s · ${BRAND.productName}`,
  },
  description: `${BRAND.claim} — panel warsztatu ${BRAND.domain}`,
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png" }, { url: "/brand/logo-mono-b.png", type: "image/png" }],
    apple: "/brand/favicon.png",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
