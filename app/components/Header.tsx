"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";

const iconClass = "h-5 w-5 shrink-0";

const searchIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const bellIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const navButtonClass =
  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

export function Header() {
  return (
    <header className="flex shrink-0 items-center justify-end gap-0.5 py-2 pr-2">
      <button
        type="button"
        onClick={nochNichtImplementiert}
        className={navButtonClass}
        title="Suche"
        aria-label="Suche"
      >
        {searchIcon}
      </button>
      <button
        type="button"
        onClick={nochNichtImplementiert}
        className={`${navButtonClass} relative`}
        title="Benachrichtigungen"
        aria-label="Benachrichtigungen"
      >
        {bellIcon}
        <span className="absolute right-1 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          2
        </span>
      </button>
    </header>
  );
}
