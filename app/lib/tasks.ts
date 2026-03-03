export type TaskStatus = "open" | "done" | "not_relevant";

export type Task = {
  id: string;
  title: string;
  client: string;
  campaign: string;
  assignee: string;
  /**
   * Date-only ISO string: YYYY-MM-DD
   */
  dueDate: string;
  status: TaskStatus;
};

export function toUtcDayNumber(dateOnlyIso: string): number {
  const [y, m, d] = dateOnlyIso.split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function todayUtcDayNumber(now = new Date()): number {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
}

export function formatDateLong(dateOnlyIso: string, locale = "de-CH"): string {
  const [y, m, d] = dateOnlyIso.split("-").map(Number);
  if (!y || !m || !d) return dateOnlyIso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "2-digit" }).format(dt);
}
