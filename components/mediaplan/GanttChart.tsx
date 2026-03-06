"use client";

import type { MediaplanRow, PositionRow } from "@/lib/mediaplan/types";
import { getTimelineRange, getISOWeek, getMonday, formatDateRange } from "@/lib/mediaplan/utils";
import { useMemo } from "react";

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
  const totalMs = max.getTime() - min.getTime();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

  const bars = useMemo(() => {
    return positions.map((pos, index) => {
      const start = pos.start_date ? new Date(pos.start_date).getTime() : min.getTime();
      const defaultEnd = start + 24 * 60 * 60 * 1000 * 14;
      const end = pos.end_date
        ? new Date(pos.end_date).getTime()
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

  return (
    <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4 sm:p-5 overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-3">
          <div className="w-40 shrink-0 flex flex-col">
            <div className="mb-1 h-4" aria-hidden />
            <div className="mb-2 h-6" aria-hidden />
            <div className="flex flex-col gap-3">
              {bars.map((bar) => (
                <div
                  key={bar.id}
                  className="h-8 flex items-center truncate text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  title={bar.title}
                >
                  {bar.title}
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex-1 min-w-0 flex flex-col">
            <div className="absolute inset-0 pointer-events-none z-10" aria-hidden>
              {monthBoundaries.map((leftPct, i) => (
                <div
                  key={`month-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-500"
                  style={{ left: `${leftPct}%` }}
                />
              ))}
            </div>
            <div className="relative z-0 mb-1 h-4">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-xs font-normal text-zinc-400 dark:text-zinc-500"
                  style={{ left: `${m.center}%`, transform: "translateX(-50%)" }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="relative z-0 mb-2 h-6">
              {weekLabels.map((w, i) => (
                <span
                  key={i}
                  className="absolute text-xs text-zinc-500 dark:text-zinc-400"
                  style={{ left: `${w.center}%`, transform: "translateX(-50%)" }}
                >
                  {w.label}
                </span>
              ))}
            </div>
            <div className="relative z-0 space-y-3">
              {bars.map((bar) => (
                <div
                  key={bar.id}
                  className="relative h-8 rounded bg-zinc-100 dark:bg-zinc-700/50 overflow-hidden"
                >
                  {weekBoundaries.map((leftPct, i) => (
                    <div
                      key={`week-${i}`}
                      className="absolute top-0 bottom-0 w-[2px] bg-white dark:bg-zinc-400 pointer-events-none"
                      style={{ left: `${leftPct}%` }}
                      aria-hidden
                    />
                  ))}
                  <div
                    className={`absolute top-1 bottom-1 rounded ${interactive ? "cursor-pointer" : ""}`}
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
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                      style={{
                        left: `${((new Date(bar.creativeDeadlineDate).getTime() - min.getTime()) / totalMs) * 100}%`,
                      }}
                      title={`Creative Deadline: ${formatDateRange(bar.creativeDeadlineDate, null)}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-right text-xs text-zinc-500 dark:text-zinc-400">
          Laufzeit der Positionen; vertikale Linie = Creative Deadline (falls gesetzt).
        </p>
      </div>
    </div>
  );
}
