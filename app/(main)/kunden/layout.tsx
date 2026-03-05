"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/kunden", label: "Kunden", exact: true },
  { href: "/kunden/lieferanten", label: "Lieferanten", exact: false },
] as const;

export default function KundenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                active
                  ? "border-[#FF6554] text-[#FF6554]"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
