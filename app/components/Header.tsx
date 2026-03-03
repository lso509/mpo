"use client";

import Link from "next/link";
import { nochNichtImplementiert } from "@/lib/not-implemented";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2 hover:opacity-90"
      >
        <span className="text-lg font-bold text-zinc-900">MP</span>
        <span className="font-semibold text-zinc-900">MediaPlan Pro</span>
      </Link>
      <div className="flex-1 min-w-0">
        <input
          type="search"
          placeholder="Suche nach Mediaplänen, Kunden, Produkten..."
          className="w-full max-w-xl rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          title="Benachrichtigungen"
        >
          <span className="relative inline-block">
            🔔
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              2
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          title="Profil"
        >
          👤
        </button>
      </div>
    </header>
  );
}
