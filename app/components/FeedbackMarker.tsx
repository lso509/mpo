"use client";

import { createClient } from "@/lib/supabase/client";
import { useFeedback } from "@/app/context/FeedbackContext";
import { useCallback, useEffect, useRef, useState } from "react";

export type FeedbackEintragMarker = {
  id: string;
  kategorie: string;
  beschreibung: string;
  status: string;
  created_at: string;
  user_name: string | null;
};

type Props = {
  /** Eindeutige Kennung für diese Stelle (z.B. "produkte.save-button"). */
  target: string;
  /** Optional: Anzeige neben dem Element (z.B. "inline" = Badge direkt daneben, "hover" = nur bei Hover). */
  variant?: "inline" | "hover";
  className?: string;
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function FeedbackMarker({ target, variant = "inline", className = "" }: Props) {
  const { openFeedback } = useFeedback();
  const [eintraege, setEintraege] = useState<FeedbackEintragMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("feedback_eintraege")
      .select("id, kategorie, beschreibung, status, created_at, user_name")
      .eq("target", target)
      .order("created_at", { ascending: false });
    setEintraege((data as FeedbackEintragMarker[]) ?? []);
    setLoading(false);
  }, [target]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!popoverOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [popoverOpen]);

  const handleAddFeedback = useCallback(() => {
    setPopoverOpen(false);
    openFeedback(target);
  }, [target, openFeedback]);

  const count = eintraege.length;
  const openCount = eintraege.filter((e) => e.status !== "Erledigt").length;

  // Pin ausblenden, wenn alle Einträge erledigt sind
  if (count > 0 && openCount === 0) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setPopoverOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-1 ${
          variant === "hover"
            ? "border-transparent bg-transparent text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-[#FF6554]"
            : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
        }`}
        title={`${count} Feedback an dieser Stelle`}
        aria-label={`${count} Feedback, Liste anzeigen`}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {count > 0 && <span>{openCount > 0 ? openCount : count}</span>}
      </button>

      {popoverOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[280px] max-w-[360px] rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white p-3 shadow-lg dark:bg-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 pb-2 mb-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Feedback hier
            </span>
            <button
              type="button"
              onClick={handleAddFeedback}
              className="rounded-full bg-[#FF6554] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#e55a4a]"
            >
              + Hinzufügen
            </button>
          </div>
          {eintraege.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-1">
              Noch kein Feedback. Klicke auf „Hinzufügen“, um einen Hinweis zu platzieren (für alle sichtbar).
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {eintraege.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-2.5 py-2 text-sm"
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
                  <p className="mt-1 text-zinc-800 dark:text-zinc-200 line-clamp-2">{e.beschreibung}</p>
                  <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    {formatDatum(e.created_at)}
                    {e.user_name ? ` · ${e.user_name}` : ""}
                    {e.status !== "Offen" ? ` · ${e.status}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
