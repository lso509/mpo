"use client";

import type { MediaplanRow, PositionRow } from "@/lib/mediaplan/types";
import {
  addCalendarMonths,
  getTimelineRange,
  getISOWeek,
  getMonday,
  formatDateRange,
  parseCalendarDateLocal,
} from "@/lib/mediaplan/utils";
import { Fragment, useMemo } from "react";

type Props = {
  plan: MediaplanRow;
  positions: PositionRow[];
  interactive?: boolean;
};

export function GanttChart({ plan, positions, interactive = false }: Props) {
  const { min, max } = useMemo(
    () => getTimelineRange(plan.date_range_start, plan.date_range_end, positions),
    [plan.date_range_start, plan.date_range_end, positions]
  );
  const totalMs = Math.max(max.getTime() - min.getTime(), 24 * 60 * 60 * 1000);
  /** Eine Viewport-Breite entspricht höchstens 6 Monaten; längere Pläne horizontal scrollbar. */
  const sixMonthMs = useMemo(
    () => addCalendarMonths(min, 6).getTime() - min.getTime(),
    [min]
  );
  const viewportSpanMs = Math.min(totalMs, Math.max(sixMonthMs, 24 * 60 * 60 * 1000));
  const chartWidthFactor = viewportSpanMs > 0 ? totalMs / viewportSpanMs : 1;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

  const bars = useMemo(() => {
    return positions.map((pos, index) => {
      const startParsed = parseCalendarDateLocal(pos.start_date);
      const start = startParsed ? startParsed.getTime() : min.getTime();
      const defaultEnd = start + 24 * 60 * 60 * 1000 * 14;
      const endParsed = parseCalendarDateLocal(pos.end_date);
      const end = endParsed
        ? endParsed.getTime()
        : pos.start_date
          ? start + 24 * 60 * 60 * 1000 * 14
          : defaultEnd;
      const left = ((start - min.getTime()) / totalMs) * 100;
      const width = ((end - start) / totalMs) * 100;
      const clampedLeft = Math.max(0, Math.min(100, left));
      const clampedWidth = Math.max(2, Math.min(100 - clampedLeft, width));
      const colors = ["#FF6554", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b"];
      const color = colors[index % colors.length];
      return {
        id: pos.id,
        title: pos.title,
        left: clampedLeft,
        width: clampedWidth,
        color,
        hasCreativeDeadline: !!pos.creative_deadline,
        creativeDeadlineDate: pos.creative_deadline,
        startDateLabel: fmtDate(new Date(start)),
        endDateLabel: fmtDate(new Date(end)),
      };
    });
  }, [positions, min, max, totalMs]);

  const weekLabels = useMemo(() => {
    const labels: { left: number; label: string }[] = [];
    let weekStart = getMonday(new Date(min));
    const minTime = min.getTime();
    const maxTime = max.getTime();
    while (weekStart.getTime() <= maxTime) {
      const t = weekStart.getTime();
      if (t >= minTime) {
        const left = ((t - minTime) / totalMs) * 100;
        if (left <= 100) labels.push({ left, label: `KW ${getISOWeek(weekStart)}` });
      }
      weekStart.setDate(weekStart.getDate() + 7);
    }
    return labels.map((w, i) => ({ ...w, center: (w.left + (labels[i + 1]?.left ?? 100)) / 2 }));
  }, [min, max, totalMs]);

  const weekBoundaries = useMemo(() => {
    const boundaries: number[] = [];
    let weekStart = getMonday(new Date(min));
    const minTime = min.getTime();
    const maxTime = max.getTime();
    while (weekStart.getTime() <= maxTime) {
      const t = weekStart.getTime();
      if (t >= minTime) {
        const left = ((t - minTime) / totalMs) * 100;
        if (left >= 0 && left <= 100) boundaries.push(left);
      }
      weekStart.setDate(weekStart.getDate() + 7);
    }
    return boundaries;
  }, [min, max, totalMs]);

  const monthLabels = useMemo(() => {
    const labels: { left: number; label: string }[] = [];
    let d = new Date(min.getFullYear(), min.getMonth(), 1);
    const minTime = min.getTime();
    const maxTime = max.getTime();
    while (d.getTime() <= maxTime) {
      const t = d.getTime();
      if (t >= minTime) {
        const left = ((t - minTime) / totalMs) * 100;
        if (left >= 0 && left <= 100)
          labels.push({ left, label: d.toLocaleDateString("de-CH", { month: "long" }) });
      }
      d.setMonth(d.getMonth() + 1);
    }
    return labels.map((m, i) => ({ ...m, center: (m.left + (labels[i + 1]?.left ?? 100)) / 2 }));
  }, [min, max, totalMs]);

  const monthBoundaries = useMemo(() => {
    const boundaries: number[] = [];
    let d = new Date(min.getFullYear(), min.getMonth(), 1);
    const minTime = min.getTime();
    const maxTime = max.getTime();
    while (d.getTime() <= maxTime) {
      const t = d.getTime();
      if (t >= minTime) {
        const left = ((t - minTime) / totalMs) * 100;
        if (left > 0 && left <= 100) boundaries.push(left);
      }
      d.setMonth(d.getMonth() + 1);
    }
    return boundaries;
  }, [min, max, totalMs]);

  if (positions.length === 0) {
    return (
      <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine Positionen mit Laufzeit vorhanden.</p>
      </div>
    );
  }

  const stickyLabelCell =
    "sticky left-0 z-20 border-r border-zinc-200 bg-white pr-3 dark:border-zinc-600 dark:bg-zinc-800/80";

  return (
    <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4 sm:p-5">
      <div className="overflow-x-auto overscroll-x-contain">
        <div
          className="grid w-full min-w-full grid-cols-[minmax(11rem,18rem)_minmax(600px,1fr)] gap-x-3 gap-y-0"
          style={
            chartWidthFactor > 1
              ? { width: `${chartWidthFactor * 100}%`, minWidth: "100%" }
              : { minWidth: "100%" }
          }
        >
          <div className={`${stickyLabelCell} h-4 shrink-0 pb-3`} aria-hidden />
          <div className="relative h-4 pb-3">
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
              {monthBoundaries.map((leftPct, i) => (
                <div
                  key={`month-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-500"
                  style={{ left: `${leftPct}%` }}
                />
              ))}
            </div>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute z-[11] text-xs font-normal text-zinc-400 dark:text-zinc-500"
                style={{ left: `${m.center}%`, transform: "translateX(-50%)" }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className={`${stickyLabelCell} h-6 shrink-0 pb-3`} aria-hidden />
          <div className="relative h-6 pb-3">
            {weekLabels.map((w, i) => (
              <span
                key={i}
                className="absolute z-[11] text-xs text-zinc-500 dark:text-zinc-400"
                style={{ left: `${w.center}%`, transform: "translateX(-50%)" }}
              >
                {w.label}
              </span>
            ))}
          </div>

          {bars.map((bar, rowIndex) => (
            <Fragment key={bar.id}>
              <div
                className={`${stickyLabelCell} flex min-h-0 min-w-0 self-stretch flex-col justify-start py-0.5 text-sm font-medium leading-snug break-words text-zinc-800 hyphens-auto dark:text-zinc-200 ${rowIndex < bars.length - 1 ? "pb-3" : ""}`}
                lang="de"
              >
                {bar.title}
              </div>
              <div
                className={`flex min-h-8 items-center self-stretch ${rowIndex < bars.length - 1 ? "pb-3" : ""}`}
              >
                <div className="relative h-8 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-700/50">
                  <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
                    {monthBoundaries.map((leftPct, i) => (
                      <div
                        key={`mb-${bar.id}-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-500"
                        style={{ left: `${leftPct}%` }}
                      />
                    ))}
                  </div>
                  {weekBoundaries.map((leftPct, i) => (
                    <div
                      key={`week-${i}`}
                      className="pointer-events-none absolute top-0 bottom-0 z-[1] w-[2px] bg-white dark:bg-zinc-400"
                      style={{ left: `${leftPct}%` }}
                      aria-hidden
                    />
                  ))}
                  <div
                    className={`absolute top-1 bottom-1 z-[2] rounded ${interactive ? "cursor-pointer" : ""}`}
                    style={{
                      left: `${bar.left}%`,
                      width: `${bar.width}%`,
                      backgroundColor: bar.color,
                      opacity: 0.85,
                    }}
                    title={`${bar.title}\nStart: ${bar.startDateLabel} – Ende: ${bar.endDateLabel}`}
                  />
                  {bar.hasCreativeDeadline && bar.creativeDeadlineDate && (
                    <div
                      className="absolute top-0 bottom-0 z-[2] w-0.5 bg-amber-500"
                      style={{
                        left: `${(((parseCalendarDateLocal(bar.creativeDeadlineDate)?.getTime() ?? min.getTime()) - min.getTime()) / totalMs) * 100}%`,
                      }}
                      title={`Creative Deadline: ${formatDateRange(bar.creativeDeadlineDate, null)}`}
                    />
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <p className="mt-2 text-right text-xs text-zinc-500 dark:text-zinc-400">
        Laufzeit der Positionen; vertikale Linie = Creative Deadline (falls gesetzt).
        {chartWidthFactor > 1
          ? " Bei Laufzeiten über sechs Monaten die Ansicht horizontal scrollen."
          : ""}
      </p>
    </div>
  );
}
