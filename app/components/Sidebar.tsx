"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarClock } from "./SidebarClock";

const iconClass = "h-7 w-7 shrink-0";

export function SidebarLogo() {
  return (
    <Link
      href="/dashboard"
      className="flex shrink-0 items-center justify-center pl-3 pt-6 pb-4 w-14 ml-[6px] hover:opacity-90"
      aria-label="Start"
    >
      <img
        src="/icon-coag.svg"
        alt="CO AG"
        className="h-8 w-auto max-w-[120px] object-contain"
      />
    </Link>
  );
}

const icons = {
  dashboard: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  users: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  document: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  gantt: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5v14M4 5h16M4 9h6M4 13h10M4 17h8" />
    </svg>
  ),
  message: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  box: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  truck: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M7 8v2m0 4v2m0-6h.01M17 8v2m0 4v2m0-6h.01" />
    </svg>
  ),
  currency: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mail: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const backIcon = (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: icons.dashboard },
  { href: "/mediaplaene", label: "Mediapläne", icon: icons.gantt },
  { href: "/produkte", label: "Produkte", icon: icons.box },
  { href: "/kommunikation", label: "Kommunikation", icon: icons.message },
  { href: "/kunden", label: "Kontakte", icon: icons.users },
  { href: "/finanzen", label: "Finanzen", icon: icons.currency },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const showBack = segments.length > 1;
  const parentHref = showBack ? "/" + segments.slice(0, -1).join("/") : "/";

  /* Back-Zeile: gleiche Höhe wie Hauptbox-Start (Header 5rem + main pt-[80px] = 160px). Logo ~88px → Spacer 72px. */
  const contentTopOffset = 160;
  const logoHeight = 88;
  const spacerHeight = contentTopOffset - logoHeight;
  const backRowHeight = 56 + 12; /* h-14 + gap-3 */
  const extraSlotHeight = 56 + 12; /* Platz für einen zusätzlichen Button (h-14 + gap-3) */

  return (
    <aside className="layout-bg sticky top-0 flex h-screen w-64 flex-col">
      <SidebarLogo />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div style={{ height: spacerHeight }} aria-hidden />
        <div className="flex items-center gap-3 px-3 shrink-0" style={{ height: backRowHeight }}>
          {showBack && (
            <Link
              href={parentHref}
              className="group flex shrink-0 items-center justify-start"
              title="Zurück"
              aria-label="Zurück"
            >
              <span className="flex h-14 w-14 shrink-0 items-center gap-0 rounded-[500px] transition-all duration-200 bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700">
                <span className="grid h-14 w-14 shrink-0 place-items-center [&_svg]:col-start-1 [&_svg]:row-start-1 [&_svg]:block [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0">
                  {backIcon}
                </span>
              </span>
            </Link>
          )}
        </div>
        <div style={{ height: extraSlotHeight }} aria-hidden />
        <nav className="flex flex-1 flex-col items-center gap-3 p-3 pt-0">
        {NAV.map((item) => {
          const { href, label, icon } = item;
          const badge = "badge" in item ? item.badge : undefined;
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="group flex w-full items-center justify-start"
              title={label}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center gap-0 rounded-[500px] transition-all duration-200 group-hover:w-auto group-hover:max-w-[200px] group-hover:pr-5 ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center [&_svg]:col-start-1 [&_svg]:row-start-1 [&_svg]:block [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0">
                  {icon}
                </span>
                <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-[140px] group-hover:opacity-100 text-sm font-medium truncate">
                  {label}
                </span>
                {badge != null && badge > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
        </nav>
      </div>
      <SidebarClock />
    </aside>
  );
}
