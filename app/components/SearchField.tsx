"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const iconClass = "h-5 w-5 shrink-0";

const searchIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const chevronDownIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export function SearchField() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isProdukte = pathname === "/produkte";
  const searchValue = isProdukte ? (searchParams.get("q") ?? "") : "";

  const setSearchQuery = useCallback(
    (value: string) => {
      if (!isProdukte) return;
      startTransition(() => {
        const next = new URLSearchParams(searchParams.toString());
        if (value.trim()) next.set("q", value);
        else next.delete("q");
        const query = next.toString();
        router.replace(pathname + (query ? `?${query}` : ""), { scroll: false });
      });
    },
    [isProdukte, pathname, router, searchParams]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProdukte) setSearchQuery(e.target.value);
    },
    [isProdukte, setSearchQuery]
  );

  return (
    <div className="flex w-full max-w-2xl items-center rounded-full bg-[var(--haupt-box-bg)] dark:bg-zinc-800 h-[54px]">
      <button
        type="button"
        onClick={nochNichtImplementiert}
        className="flex h-[54px] w-[54px] shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-l-full transition-colors"
        aria-label="Suche"
      >
        {searchIcon}
      </button>
      <input
        type="search"
        placeholder={isProdukte ? "Produktkatalog durchsuchen…" : "Search here..."}
        value={searchValue}
        onChange={handleChange}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
        aria-label="Suchbegriff"
      />
      <button
        type="button"
        onClick={nochNichtImplementiert}
        className="flex h-[54px] w-[54px] shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-r-full transition-colors"
        aria-label="Filter oder Optionen"
      >
        {chevronDownIcon}
      </button>
    </div>
  );
}
