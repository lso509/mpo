import type { PositionRow } from "@/lib/mediaplan/types";

export function beraterInitials(email: string | undefined): string {
  if (!email) return "?";
  const part = email.split("@")[0];
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return part ? part.slice(0, 1).toUpperCase() : "?";
}

export function formatChf(n: number | null): string {
  if (n == null) return "—";
  return (
    new Intl.NumberFormat("de-CH", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) +
    " CHF"
  );
}

/** Freitext CHF (z. B. Formular) → Zahl oder null wenn leer/ungültig */
export function parseOptionalChfInput(raw: string): number | null {
  const t = raw.trim().replace(/'/g, "").replace(/\s/g, "");
  if (!t) return null;
  const n = parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (!start) return end ? fmt(end) : "—";
  if (!end) return fmt(start);
  return `${fmt(start)} - ${fmt(end)}`;
}

/** ISO-Kalenderwoche (Montag = Wochenanfang) */
export function getISOWeek(d: Date): number {
  const d2 = new Date(d);
  d2.setHours(0, 0, 0, 0);
  const day = d2.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d2.setDate(d2.getDate() + diff);
  const yearStart = new Date(d2.getFullYear(), 0, 1);
  return Math.ceil((((d2.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Montag der Woche eines Datums */
export function getMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

/**
 * ISO-Datum (YYYY-MM-DD) in lokaler Zeitzone (mittags), damit Wochen-/Tagesgrenzen
 * nicht durch UTC-Parsing verschoben werden.
 */
export function parseCalendarDateLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d, 12, 0, 0, 0);
}

/** Frühester Positions-Start (nur mit gesetztem start_date). */
function earliestPositionStartDate(positions: PositionRow[]): Date | null {
  let best: Date | null = null;
  for (const p of positions) {
    const d = parseCalendarDateLocal(p.start_date);
    if (!d) continue;
    if (!best || d.getTime() < best.getTime()) best = d;
  }
  return best;
}

/**
 * Gantt: Zeitleiste beginnt mindestens eine leere Kalenderwoche vor der Woche der ersten Buchung
 * (Montag der Vorwoche zum Montag der Buchungswoche), zusätzlich zum Plan-Anfang.
 */
function ganttMinWithEmptyWeekBeforeFirstBooking(planMin: Date, positions: PositionRow[]): Date {
  const earliest = earliestPositionStartDate(positions);
  if (!earliest) return planMin;
  const firstBookingWeekMonday = getMonday(earliest);
  const weekBeforeFirst = new Date(firstBookingWeekMonday);
  weekBeforeFirst.setDate(weekBeforeFirst.getDate() - 7);
  weekBeforeFirst.setHours(0, 0, 0, 0);
  return new Date(Math.min(planMin.getTime(), weekBeforeFirst.getTime()));
}

/** Gantt: Zeitleiste = Mediaplan-Laufzeit in Gänze (Montag der Startwoche bis Plan-Ende); Fallback ohne Plan-Daten */
export function getTimelineRange(
  planStart: string | null,
  planEnd: string | null,
  positions: PositionRow[]
): { min: Date; max: Date } {
  if (planStart && planEnd) {
    const start = parseCalendarDateLocal(planStart) ?? new Date(planStart);
    const end = parseCalendarDateLocal(planEnd) ?? new Date(planEnd);
    let min = getMonday(start);
    min = ganttMinWithEmptyWeekBeforeFirstBooking(min, positions);
    return { min, max: end };
  }
  const dates: number[] = [];
  if (planStart) {
    const d = parseCalendarDateLocal(planStart);
    if (d) dates.push(d.getTime());
  }
  if (planEnd) {
    const d = parseCalendarDateLocal(planEnd);
    if (d) dates.push(d.getTime());
  }
  for (const p of positions) {
    if (p.start_date) {
      const d = parseCalendarDateLocal(p.start_date);
      if (d) dates.push(d.getTime());
    }
    if (p.end_date) {
      const d = parseCalendarDateLocal(p.end_date);
      if (d) dates.push(d.getTime());
    }
    if (p.creative_deadline) {
      const d = parseCalendarDateLocal(p.creative_deadline);
      if (d) dates.push(d.getTime());
    }
  }
  if (dates.length === 0) {
    const d = new Date();
    const min = new Date(d.getFullYear(), d.getMonth(), 1);
    const max = new Date(d.getFullYear(), d.getMonth() + 2, 0);
    return { min, max };
  }
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  min.setDate(min.getDate() - 14);
  max.setDate(max.getDate() + 14);
  let minOut = getMonday(min);
  minOut = ganttMinWithEmptyWeekBeforeFirstBooking(minOut, positions);
  return { min: minOut, max };
}

/** Kalendermonate addieren (Gantt: max. sichtbare Spanne). */
export function addCalendarMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function freigabeStatus(pos: PositionRow): "Offen" | "Freigegeben" | "Abgelehnt" {
  const s = pos.prozess_status && typeof pos.prozess_status === "object" ? pos.prozess_status["1"] : undefined;
  if (s === "Freigegeben" || s === "Erledigt") return "Freigegeben";
  if (s === "Abgelehnt") return "Abgelehnt";
  return "Offen";
}
