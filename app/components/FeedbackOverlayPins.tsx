"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  KATEGORIEN,
  PRIORITAET_OPTIONS,
  STATUS_OPTIONS,
  categoryBadgeClass,
  formatDatum,
  formatDeadline,
  percentToPixels,
  prioritaetBadgeClass,
  type FeedbackKommentar,
  type FeedbackPrioritaet,
  type FeedbackStatus,
  type Kategorie,
} from "@/app/components/feedback/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollContainer } from "@/app/context/ScrollContainerContext";

type OverlayFeedback = {
  id: string;
  kategorie: string;
  beschreibung: string;
  status: string;
  prioritaet: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  position_x: number;
  position_y: number;
  archived: boolean;
};

export function FeedbackOverlayPins() {
  const POPOVER_WIDTH_PX = 368; // entspricht w-[23rem]
  const POPOVER_EDGE_PADDING_PX = 16;
  const POPOVER_APPROX_HEIGHT_PX = 360;

  const { user } = useUser();
  const pathname = usePathname();
  const scrollContainerRef = useScrollContainer();
  const [items, setItems] = useState<OverlayFeedback[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const pinItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentSize, setContentSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [commentsByFeedback, setCommentsByFeedback] = useState<Record<string, FeedbackKommentar[]>>({});
  const [commentDraftByFeedback, setCommentDraftByFeedback] = useState<Record<string, string>>({});
  const [commentSavingFor, setCommentSavingFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    kategorie: Kategorie;
    beschreibung: string;
    status: FeedbackStatus;
    prioritaet: FeedbackPrioritaet;
    deadline: string;
  } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("feedback_eintraege")
      .select("id, kategorie, beschreibung, status, prioritaet, deadline, created_at, updated_at, user_name, position_x, position_y, archived")
      .eq("target", "overlay")
      .eq("archived", false)
      .eq("seite", pathname)
      .not("position_x", "is", null)
      .not("position_y", "is", null)
      .order("created_at", { ascending: false });
    setItems((data as OverlayFeedback[]) ?? []);
  }, [pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const loadComments = useCallback(async (feedbackId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("feedback_kommentare")
      .select("id, feedback_id, created_at, user_id, user_name, kommentar")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Kommentare laden fehlgeschlagen:", error);
      return;
    }
    setCommentsByFeedback((prev) => ({ ...prev, [feedbackId]: (data as FeedbackKommentar[]) ?? [] }));
  }, []);

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
        leftPx: percentToPixels(Number(e.position_x), w),
        topPx: percentToPixels(Number(e.position_y), h),
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenId(id);
    }
  }, [pathname, items]);

  useEffect(() => {
    if (openId === null) return;
    const onOutside = (e: MouseEvent) => {
      const item = pinItemRefs.current[openId];
      if (item && item.contains(e.target as Node)) return;
      setOpenId(null);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [openId]);

  const handleStartEdit = useCallback((entry: OverlayFeedback) => {
    setEditingId(entry.id);
    setEditForm({
      kategorie: entry.kategorie as Kategorie,
      beschreibung: entry.beschreibung,
      status: entry.status as FeedbackStatus,
      prioritaet: entry.prioritaet as FeedbackPrioritaet,
      deadline: entry.deadline ?? "",
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editForm) return;
    setSavingEdit(true);
    const supabase = createClient();
    const payload = {
      kategorie: editForm.kategorie,
      beschreibung: editForm.beschreibung.trim(),
      status: editForm.status,
      prioritaet: editForm.prioritaet,
      deadline: editForm.deadline || null,
    };
    const { error } = await supabase.from("feedback_eintraege").update(payload).eq("id", editingId);
    setSavingEdit(false);
    if (error) {
      console.error("Feedback aktualisieren fehlgeschlagen:", error);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...payload,
              deadline: payload.deadline,
              beschreibung: payload.beschreibung,
            }
          : item
      )
    );
    setEditingId(null);
    setEditForm(null);
  }, [editForm, editingId]);

  const handleSendComment = useCallback(
    async (feedbackId: string) => {
      const text = commentDraftByFeedback[feedbackId]?.trim();
      if (!text) return;
      setCommentSavingFor(feedbackId);
      const supabase = createClient();
      const { error } = await supabase.from("feedback_kommentare").insert({
        feedback_id: feedbackId,
        user_id: user?.id ?? null,
        user_name: user?.user_metadata?.full_name ?? user?.email ?? null,
        kommentar: text,
      });
      setCommentSavingFor(null);
      if (error) {
        console.error("Kommentar senden fehlgeschlagen:", error);
        return;
      }
      setCommentDraftByFeedback((prev) => ({ ...prev, [feedbackId]: "" }));
      await loadComments(feedbackId);
    },
    [commentDraftByFeedback, loadComments, user]
  );

  if (items.length === 0) return null;
  if (!contentSize.h || !contentSize.w) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[80]"
      style={{ width: `${contentSize.w}px`, height: `${contentSize.h}px` }}
    >
      {positioned.map((e) => (
        (() => {
          const nearLeftEdge = e.leftPx < POPOVER_WIDTH_PX / 2 + POPOVER_EDGE_PADDING_PX;
          const nearRightEdge = contentSize.w - e.leftPx < POPOVER_WIDTH_PX / 2 + POPOVER_EDGE_PADDING_PX;
          const nearTopEdge = e.topPx < POPOVER_APPROX_HEIGHT_PX + POPOVER_EDGE_PADDING_PX;
          const popoverPositionClass = nearLeftEdge
            ? "left-0 -translate-x-0"
            : nearRightEdge
              ? "right-0 left-auto translate-x-0"
              : "left-1/2 -translate-x-1/2";
          const popoverVerticalClass = nearTopEdge
            ? "top-full mt-2 translate-y-0"
            : "top-0 mt-1 -translate-y-full";

          return (
        <div
          key={e.id}
          id={`feedback-${e.id}`}
          ref={(el) => {
            pinItemRefs.current[e.id] = el;
          }}
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{
            left: `${e.leftPx}px`,
            top: `${e.topPx}px`,
          }}
        >
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setOpenId((id) => {
                const next = id === e.id ? null : e.id;
                if (next) loadComments(next);
                return next;
              });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#FF6554] text-white shadow-lg hover:bg-[#e55a4a] focus:outline-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-2"
            aria-label={`Feedback anzeigen: ${e.beschreibung}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          {openId === e.id && (
            <div
              className={`absolute z-[130] w-[23rem] rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white p-3 shadow-xl dark:bg-zinc-800 ${popoverPositionClass} ${popoverVerticalClass}`}
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryBadgeClass(e.kategorie)}`}>
                  {e.kategorie}
                </span>
                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${prioritaetBadgeClass(e.prioritaet)}`}>
                  {e.prioritaet}
                </span>
                {e.deadline && (
                  <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                    Deadline: {formatDeadline(e.deadline)}
                  </span>
                )}
              </div>

              {editingId === e.id && editForm ? (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editForm.kategorie}
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, kategorie: event.target.value as Kategorie } : prev))}
                      className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {KATEGORIEN.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.prioritaet}
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, prioritaet: event.target.value as FeedbackPrioritaet } : prev))}
                      className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {PRIORITAET_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, status: event.target.value as FeedbackStatus } : prev))}
                      className="col-span-2 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(event) => setEditForm((prev) => (prev ? { ...prev, deadline: event.target.value } : prev))}
                    className="w-full rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <textarea
                    value={editForm.beschreibung}
                    onChange={(event) => setEditForm((prev) => (prev ? { ...prev, beschreibung: event.target.value } : prev))}
                    onInput={(event) => {
                      const target = event.currentTarget;
                      target.style.height = "auto";
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    rows={3}
                    className="min-h-[76px] w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditForm(null);
                      }}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editForm.beschreibung.trim()}
                      className="rounded-full bg-[#FF6554] px-3 py-1 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
                    >
                      {savingEdit ? "Speichern…" : "Speichern"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-200">{e.beschreibung}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDatum(e.created_at)}
                    {e.user_name ? ` · ${e.user_name}` : ""}
                    {e.status !== "Offen" ? ` · ${e.status}` : ""}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(e)}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Bearbeiten
                    </button>
                  </div>
                </>
              )}

              <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Kommentare
                </p>
                <div className="mt-1 max-h-28 space-y-1 overflow-y-auto pr-1">
                  {(commentsByFeedback[e.id] ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Noch keine Kommentare.</p>
                  ) : (
                    (commentsByFeedback[e.id] ?? []).map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-zinc-50 px-2 py-1 dark:bg-zinc-700/40">
                        <p className="whitespace-pre-wrap break-words text-xs text-zinc-800 dark:text-zinc-200">{comment.kommentar}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          {comment.user_name ?? "User"} · {formatDatum(comment.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={commentDraftByFeedback[e.id] ?? ""}
                    onChange={(event) =>
                      setCommentDraftByFeedback((prev) => ({
                        ...prev,
                        [e.id]: event.target.value,
                      }))
                    }
                    placeholder="Kommentar schreiben…"
                    className="w-full rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendComment(e.id)}
                    disabled={commentSavingFor === e.id || !(commentDraftByFeedback[e.id] ?? "").trim()}
                    className="rounded-full bg-[#FF6554] px-3 py-1 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
                  >
                    Senden
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          );
        })()
      ))}
    </div>
  );
}
