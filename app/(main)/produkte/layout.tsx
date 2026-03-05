"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/produkte", label: "Produktkatalog", tab: null },
  { href: "/produkte?tab=archiv", label: "Archiv", tab: "archiv" },
] as const;

export default function ProdukteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {TABS.map((tab) => {
          const active =
            tab.tab === null
              ? currentTab !== "archiv"
              : currentTab === tab.tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                active
                  ? "border-[#FF6554] text-[#FF6554]"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
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
