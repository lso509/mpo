"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { SearchField } from "./SearchField";

const iconClass = "h-5 w-5 shrink-0";

const bellIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const logoutIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const iconCircleClass =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-zinc-600 dark:text-zinc-400 transition-colors duration-200 hover:bg-white hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 [&_svg]:h-7 [&_svg]:w-7";

function initials(email: string | undefined): string {
  if (!email) return "?";
  const part = email.split("@")[0];
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return part ? part.slice(0, 1).toUpperCase() : "?";
}

export function Header() {
  const router = useRouter();
  const { user } = useUser();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Abmelden fehlgeschlagen:", e);
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="layout-bg flex shrink-0 items-center gap-0.5 py-2 pr-2 pl-2">
      <div className="flex min-w-0 flex-1 justify-center">
        <Suspense fallback={<div className="h-[54px] w-full max-w-2xl rounded-full bg-[var(--haupt-box-bg)] dark:bg-zinc-800 animate-pulse" />}>
          <SearchField />
        </Suspense>
      </div>
      <button
        type="button"
        onClick={nochNichtImplementiert}
        className={`${iconCircleClass} relative bg-white dark:bg-zinc-800`}
        title="Benachrichtigungen"
        aria-label="Benachrichtigungen"
      >
        {bellIcon}
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          2
        </span>
      </button>
      <div className="group relative ml-1 h-14 w-14 shrink-0">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[#FF6554]/15 dark:bg-[#FF6554]/20 transition-opacity duration-200 group-hover:opacity-0">
          {user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ? (
            <img
              src={(user.user_metadata?.avatar_url ?? user.user_metadata?.picture) as string}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#FF6554] dark:text-[#ff8877]">
              {user ? initials(user.email ?? "") : "—"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={`${iconCircleClass} absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto`}
          title="Abmelden"
          aria-label="Abmelden"
        >
          {logoutIcon}
        </button>
      </div>
    </header>
  );
}
