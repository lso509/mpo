"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollContainer } from "@/app/context/ScrollContainerContext";

type OverlayFeedback = {
  id: string;
  kategorie: string;
  beschreibung: string;
  status: string;
  created_at: string;
  user_name: string | null;
  position_x: number;
  position_y: number;
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function FeedbackOverlayPins() {
  const pathname = usePathname();
  const scrollContainerRef = useScrollContainer();
  const [items, setItems] = useState<OverlayFeedback[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [contentSize, setContentSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("feedback_eintraege")
      .select("id, kategorie, beschreibung, status, created_at, user_name, position_x, position_y")
      .eq("target", "overlay")
      .eq("seite", pathname)
      .not("position_x", "is", null)
      .not("position_y", "is", null)
      .order("created_at", { ascending: false });
    setItems((data as OverlayFeedback[]) ?? []);
  }, [pathname]);

  useEffect(() => {
    load();
  }, [load]);

  // Größe des scrollbaren Inhalts: vom Scroll-Container (scrollWidth/scrollHeight),
  // damit die Pin-Layer exakt so groß ist wie der Inhalt und Pins mit dem Inhalt mitscrollen.
  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;

    const update = () => {
      setContentSize({ w: el.scrollWidth, h: el.scrollHeight });
    };

    // Sofort einmal lesen, dann bei Größenänderung des Inhalts (erstes Kind = Content-Wrapper).
    update();
    const contentEl = el.firstElementChild;
    if (contentEl) {
      const ro = new ResizeObserver(update);
      ro.observe(contentEl);
      return () => ro.disconnect();
    }
  }, [scrollContainerRef, pathname]);

  const positioned = useMemo(() => {
    const w = contentSize.w || 1;
    const h = contentSize.h || 1;
    return items
      .filter((e) => e.status !== "Erledigt")
      .map((e) => ({
        ...e,
        leftPx: (Number(e.position_x) / 100) * w,
        topPx: (Number(e.position_y) / 100) * h,
      }));
  }, [items, contentSize]);

  // Deep-Link: bei Hash #feedback-{id} Pin in den Blick scrollen
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("feedback-")) return;
    const id = hash.slice(9);
    if (!id || !items.some((e) => e.id === id)) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setOpenId(id);
    }
  }, [pathname, items]);

  useEffect(() => {
    if (openId === null) return;
    const onDocClick = (e: MouseEvent) => {
      const btn = pinRefs.current[openId];
      if (btn && !btn.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openId]);

  if (items.length === 0) return null;
  if (!contentSize.h || !contentSize.w) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-10"
      style={{ width: `${contentSize.w}px`, height: `${contentSize.h}px` }}
    >
      {positioned.map((e) => (
        <div
          key={e.id}
          id={`feedback-${e.id}`}
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{
            left: `${e.leftPx}px`,
            top: `${e.topPx}px`,
          }}
        >
          <button
            ref={(el) => {
              pinRefs.current[e.id] = el;
            }}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setOpenId((id) => (id === e.id ? null : e.id));
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#FF6554] text-white shadow-lg hover:bg-[#e55a4a] focus:outline-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-2"
            aria-label={`Feedback anzeigen: ${e.beschreibung.slice(0, 30)}…`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          {openId === e.id && (
            <div
              className="absolute left-1/2 top-0 z-10 mt-1 w-72 -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white p-3 shadow-xl dark:bg-zinc-800"
              onClick={(ev) => ev.stopPropagation()}
            >
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  e.kategorie === "Bug"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                    : e.kategorie === "Idee"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                }`}
              >
                {e.kategorie}
              </span>
              <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">{e.beschreibung}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDatum(e.created_at)}
                {e.user_name ? ` · ${e.user_name}` : ""}
                {e.status !== "Offen" ? ` · ${e.status}` : ""}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
