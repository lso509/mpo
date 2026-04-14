"use client";

export const KATEGORIEN = ["Bug", "Idee", "Optimierung"] as const;
export type Kategorie = (typeof KATEGORIEN)[number];

export const STATUS_OPTIONS = [
  "Offen",
  "In Bearbeitung",
  "Zur Prüfung für nächsten Sprint",
  "Erledigt",
] as const;
export type FeedbackStatus = (typeof STATUS_OPTIONS)[number];

export const PRIORITAET_OPTIONS = ["Low", "High", "Critical"] as const;
export type FeedbackPrioritaet = (typeof PRIORITAET_OPTIONS)[number];

export type FeedbackKommentar = {
  id: string;
  feedback_id: string;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  kommentar: string;
};

export function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDatumMitZeit(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "—";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function isDeadlineOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${deadline}T00:00:00`);
  return due < today;
}

export function categoryBadgeClass(kategorie: string): string {
  if (kategorie === "Bug") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  if (kategorie === "Idee") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
}

export function prioritaetBadgeClass(prioritaet: string): string {
  if (prioritaet === "Critical") return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200";
  if (prioritaet === "High") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function overlayPositionPercent(
  clientX: number,
  clientY: number,
  container: HTMLElement | null
): { x: number; y: number } {
  if (!container) {
    return {
      x: clampPercent((clientX / window.innerWidth) * 100),
      y: clampPercent((clientY / window.innerHeight) * 100),
    };
  }

  const rect = container.getBoundingClientRect();
  const contentX = container.scrollLeft + (clientX - rect.left);
  const contentY = container.scrollTop + (clientY - rect.top);
  const w = Math.max(container.scrollWidth, 1);
  const h = Math.max(container.scrollHeight, 1);
  return {
    x: clampPercent((contentX / w) * 100),
    y: clampPercent((contentY / h) * 100),
  };
}

export function percentToPixels(percent: number, size: number): number {
  const safeSize = Math.max(size, 1);
  return (clampPercent(Number(percent)) / 100) * safeSize;
}
