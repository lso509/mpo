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
import { CollapsibleChevron } from "@/components/shared/CollapsibleChevron";
import { Fragment, useMemo, useState } from "react";

type Props = {
  plan: MediaplanRow;
  positions: PositionRow[];
  interactive?: boolean;
  onRenamePosition?: (positionId: string, title: string) => void | Promise<void>;
  onRenameCampaign?: (oldName: string, newName: string) => void | Promise<void>;
};

export function GanttChart({ plan, positions, interactive = false, onRenamePosition, onRenameCampaign }: Props) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [editingBarId, setEditingBarId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingCampaignName, setEditingCampaignName] = useState<string | null>(null);
  const [campaignNameDraft, setCampaignNameDraft] = useState("");
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

  const categoryColorMap = useMemo(() => {
    const palette = ["#FF6554", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6"];
    const categories = Array.from(
      new Set(
        positions.map((p) => categoryLabel(p.position_kategorie))
      )
    );
    return new Map(categories.map((cat, idx) => [cat, palette[idx % palette.length]]));
  }, [positions]);

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
      const cat = categoryLabel(pos.position_kategorie);
      const color = categoryColorMap.get(cat) ?? "#FF6554";
      return {
        id: pos.id,
        title: pos.title,
        category: cat,
        left: clampedLeft,
        width: clampedWidth,
        color,
        hasCreativeDeadline: !!pos.creative_deadline,
        creativeDeadlineDate: pos.creative_deadline,
        startDateLabel: fmtDate(new Date(start)),
        endDateLabel: fmtDate(new Date(end)),
      };
    });
  }, [positions, min, max, totalMs, categoryColorMap]);

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
                  {editingCampaignName === group.category ? (
                    <div className="flex w-full items-center gap-1">
                      <input
                        type="text"
                        value={campaignNameDraft}
                        onChange={(e) => setCampaignNameDraft(e.target.value)}
                        className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const next = campaignNameDraft.trim();
                          if (!next) return;
                          if (onRenameCampaign) await onRenameCampaign(group.category, next);
                          setEditingCampaignName(null);
                        }}
                        className="rounded bg-[#FF6554] px-1.5 py-1 text-[10px] font-semibold text-white"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="group inline-flex w-full items-center justify-between gap-2 px-0 py-0.5 text-left text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedCategories((prev) => ({ ...prev, [group.category]: !isCollapsed }))
                        }
                        className="inline-flex min-w-0 flex-1 items-center justify-between gap-2"
                      >
                        <span className="block min-w-0 truncate whitespace-nowrap">{group.category}</span>
                        <CollapsibleChevron open={!isCollapsed} size="sm" />
                      </button>
                      {group.category !== "Ohne Kampagne" && onRenameCampaign && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampaignName(group.category);
                            setCampaignNameDraft(group.category);
                          }}
                          className="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500 hover:text-[#FF6554]"
                          title="Kampagne umbenennen"
                          aria-label="Kampagne umbenennen"
                        >
                          ✎
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="py-1" aria-hidden />
                {!isCollapsed &&
                  group.bars.map((bar) => (
                    <Fragment key={bar.id}>
                      <div
                        className={`${stickyLabelCell} group flex min-h-0 min-w-0 self-stretch items-center py-1 text-xs font-medium leading-snug text-zinc-500 dark:text-zinc-400`}
                        lang="de"
                        title={bar.title}
                      >
                        {editingBarId === bar.id ? (
                          <div className="flex w-full items-center gap-1">
                            <input
                              type="text"
                              value={titleDraft}
                              onChange={(e) => setTitleDraft(e.target.value)}
                              className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const next = titleDraft.trim();
                                if (!next) return;
                                if (onRenamePosition) await onRenamePosition(bar.id, next);
                                setEditingBarId(null);
                              }}
                              className="rounded bg-[#FF6554] px-1.5 py-1 text-[10px] font-semibold text-white"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div className="flex w-full items-center gap-1">
                            <span className="block flex-1 truncate whitespace-nowrap">{bar.title}</span>
                            {onRenamePosition && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBarId(bar.id);
                                  setTitleDraft(bar.title);
                                }}
                                className="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500 hover:text-[#FF6554]"
                                title="Titel bearbeiten"
                                aria-label="Titel bearbeiten"
                              >
                                ✎
                              </button>
                            )}
                          </div>
                        )}
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
                            <>
                              <div
                                className="absolute top-0 bottom-0 z-[4] w-0.5 bg-amber-500"
                                style={{
                                  left: `${(((parseCalendarDateLocal(bar.creativeDeadlineDate)?.getTime() ?? min.getTime()) - min.getTime()) / totalMs) * 100}%`,
                                }}
                                title={`Creative Deadline: ${formatDateRange(bar.creativeDeadlineDate, null)}`}
                              />
                              <div
                                className="absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 p-1 text-white"
                                style={{
                                  left: `${(((parseCalendarDateLocal(bar.creativeDeadlineDate)?.getTime() ?? min.getTime()) - min.getTime()) / totalMs) * 100}%`,
                                }}
                                title={`Creative Deadline: ${formatDateRange(bar.creativeDeadlineDate, null)}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                  <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 8.5A1.5 1.5 0 1 1 8.5 11a1.5 1.5 0 0 1 0-3ZM5 19l4.5-6 3.5 4.5 2.5-3L19 19H5Z"/>
                                </svg>
                              </div>
                            </>
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
