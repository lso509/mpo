"use client";

import { Suspense } from "react";
import { ProdukteTabs } from "./ProdukteTabs";

export default function ProdukteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
            <span className="border-b-2 border-transparent px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Produktkatalog
            </span>
            <span className="border-b-2 border-transparent px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Archiv
            </span>
          </div>
        }
      >
        <ProdukteTabs />
      </Suspense>
      <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center text-zinc-500">Laden…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
