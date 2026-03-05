"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { MediaplaeneTabs } from "./MediaplaeneTabs";

export default function MediaplaeneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isListPage = pathname === "/mediaplaene";

  return (
    <div className="space-y-6">
      {isListPage && (
        <Suspense
          fallback={
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
              <span className="border-b-2 border-transparent px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                Mediapläne
              </span>
              <span className="border-b-2 border-transparent px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                Archiv
              </span>
            </div>
          }
        >
          <MediaplaeneTabs />
        </Suspense>
      )}
      <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center text-zinc-500 dark:text-zinc-400">Laden…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
