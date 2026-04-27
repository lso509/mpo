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
import { Fragment, useMemo, useState } from "react";

type Props = {
  plan: MediaplanRow;
  positions: PositionRow[];
  interactive?: boolean;
};

export function GanttChart({ plan, positions, interactive = false }: Props) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const categoryLabel = (value: string | null | undefined) => {
    const cleaned = (value ?? "").trim();
    return cleaned.length > 0 ? cleaned : "Ohne Kategorie";
  };
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
        category: categoryLabel(pos.position_kategorie),
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

  const groupedBars = useMemo(() => {
    const groups: { category: string; bars: typeof bars }[] = [];
    for (const bar of bars) {
      const last = groups[groups.length - 1];
      if (!last || last.category !== bar.category) {
        groups.push({ category: bar.category, bars: [bar] });
      } else {
        last.bars.push(bar);
      }
    }
    return groups;
  }, [bars]);

  const weekLabels = useMemo(() => {
    const labels: { left: number; label: string }[] = [];
    const weekStart = getMonday(new Date(min));
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
    const weekStart = getMonday(new Date(min));
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
    const d = new Date(min.getFullYear(), min.getMonth(), 1);
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
    const d = new Date(min.getFullYear(), min.getMonth(), 1);
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

          <div className={`${stickyLabelCell} h-6 shrink-0 pb-3 pt-[5px]`} aria-hidden />
          <div className="relative h-6 pb-3 pt-[5px]">
            {weekLabels.map((w, i) => (
              <span
                key={i}
                className="absolute z-[11] text-[10px] text-zinc-500 dark:text-zinc-400"
                style={{ left: `${w.center}%`, transform: "translateX(-50%)" }}
              >
                {w.label}
              </span>
            ))}
          </div>

          {groupedBars.map((group) => {
            const isCollapsed = collapsedCategories[group.category] === true;
            return (
              <Fragment key={group.category}>
                <div className={`${stickyLabelCell} pt-[10px] py-1`}>
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedCategories((prev) => ({ ...prev, [group.category]: !isCollapsed }))
                    }
                    className="inline-flex w-full items-center justify-between gap-2 px-0 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#FF6554] hover:text-[#e55a4a]"
                  >
                    <span>{group.category}</span>
                    <span>{isCollapsed ? "▸" : "▾"}</span>
                  </button>
                </div>
                <div className="py-1" aria-hidden />
                {!isCollapsed &&
                  group.bars.map((bar) => (
                    <Fragment key={bar.id}>
                      <div
                        className={`${stickyLabelCell} flex min-h-0 min-w-0 self-stretch items-center py-1 text-xs font-medium leading-snug text-zinc-800 dark:text-zinc-200`}
                        lang="de"
                        title={bar.title}
                      >
                        <span className="block w-full truncate whitespace-nowrap">{bar.title}</span>
                      </div>
                      <div className="flex min-h-7 items-stretch self-stretch">
                        <div className="relative h-full w-full overflow-hidden bg-zinc-100/80 dark:bg-zinc-700/40">
                          <div className="absolute inset-0 z-[2] pointer-events-none" aria-hidden>
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
                              className="pointer-events-none absolute top-0 bottom-0 z-[1] w-[2px] bg-white dark:bg-zinc-300/90"
                              style={{ left: `${leftPct}%` }}
                              aria-hidden
                            />
                          ))}
                          <div
                            className={`absolute top-1 bottom-1 z-[3] rounded ${interactive ? "cursor-pointer" : ""}`}
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
                              className="absolute top-0 bottom-0 z-[4] w-0.5 bg-amber-500"
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
              </Fragment>
            );
          })}
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
