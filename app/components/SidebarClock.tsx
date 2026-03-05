"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCalendarWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function SidebarClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="layout-bg sticky bottom-0 shrink-0 p-3 text-center" suppressHydrationWarning>
      <p className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
        {now ? formatTime(now) : "–:–:–"}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {now ? formatDate(now) : "–"}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {now != null ? `KW ${getCalendarWeek(now)}` : "KW –"}
      </p>
    </div>
  );
}
