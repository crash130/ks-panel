"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  Table2,
  ClipboardPlus,
  FileSpreadsheet,
  Warehouse,
  CalendarDays,
  Menu,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { BRAND, formatPhoneDisplay } from "@/lib/brand";
import { ROLE_LABEL } from "@/lib/status";

const NAV = [
  { href: "/pulpit", label: "Pulpit", icon: LayoutGrid },
  { href: "/tablica", label: "Tablica", icon: Table2 },
  { href: "/przyjecie", label: "Przyjęcie", icon: ClipboardPlus },
  { href: "/ofertomat", label: "Ofertomat", icon: FileSpreadsheet },
  { href: "/magazyn", label: "Magazyn", icon: Warehouse },
  { href: "/kalendarz", label: "Kalendarz", icon: CalendarDays },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              active ? "bg-blue-50 text-primary" : "text-muted hover:bg-slate-50 hover:text-navy"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="ks-cloud min-h-screen">
      {open && (
        <button
          className="fixed inset-0 z-40 bg-navy/40 md:hidden"
          aria-label="Zamknij menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line bg-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Zamknij">
            <X size={20} />
          </button>
        </div>
        {nav}
        <div className="mt-auto border-t border-line px-5 py-4 text-xs leading-5 text-muted">
          <div className="font-semibold text-navy">{user.name}</div>
          <div>{ROLE_LABEL[user.role] ?? user.role}</div>
          <div className="mt-3">{BRAND.addressLine1}</div>
          <div>{BRAND.addressLine2}</div>
          <div className="font-bold text-navy">{formatPhoneDisplay()}</div>
          <div>{BRAND.hours}</div>
          <div className="mt-3 flex gap-3">
            {user.role === "OWNER" && (
              <Link href="/ustawienia" className="inline-flex items-center gap-1 font-semibold text-primary">
                <Settings size={14} /> Ustawienia
              </Link>
            )}
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex items-center gap-1 font-semibold text-muted">
                <LogOut size={14} /> Wyloguj
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            className="ks-btn ks-btn-ghost px-3"
            onClick={() => setOpen(true)}
            aria-label="Otwórz menu"
          >
            <Menu size={18} />
          </button>
          <Logo size="sm" />
          <Link href="/przyjecie" className="ks-btn ks-btn-primary">
            + Przyjęcie
          </Link>
        </div>
        <main className="px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
