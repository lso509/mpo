"use client";

import { createClient } from "@/lib/supabase/client";
import { useFeedback } from "@/app/context/FeedbackContext";
import { useUser } from "@/hooks/useUser";
import {
  KATEGORIEN,
  PRIORITAET_OPTIONS,
  STATUS_OPTIONS,
  categoryBadgeClass,
  formatDatum,
  formatDeadline,
  prioritaetBadgeClass,
  type FeedbackKommentar,
  type FeedbackPrioritaet,
  type FeedbackStatus,
  type Kategorie,
} from "@/app/components/feedback/shared";
import { useCallback, useEffect, useRef, useState } from "react";

export type FeedbackEintragMarker = {
  id: string;
  kategorie: string;
  beschreibung: string;
  status: string;
  prioritaet: string;
  deadline: string | null;
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

export function FeedbackMarker({ target, variant = "inline", className = "" }: Props) {
  const { user } = useUser();
  const { openFeedback } = useFeedback();
  const [eintraege, setEintraege] = useState<FeedbackEintragMarker[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [expandedDescription, setExpandedDescription] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
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
    const { data, error } = await supabase
      .from("feedback_eintraege")
      .select("id, kategorie, beschreibung, status, prioritaet, deadline, created_at, user_name")
      .eq("target", target)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Feedback laden fehlgeschlagen:", error);
      setEintraege([]);
      return;
    }
    setEintraege((data as FeedbackEintragMarker[]) ?? []);
  }, [target]);

  const loadComments = useCallback(async (feedbackIds: string[]) => {
    if (feedbackIds.length === 0) {
      setCommentsByFeedback({});
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("feedback_kommentare")
      .select("id, feedback_id, created_at, user_id, user_name, kommentar")
      .in("feedback_id", feedbackIds)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Kommentare laden fehlgeschlagen:", error);
      return;
    }
    const grouped = ((data as FeedbackKommentar[]) ?? []).reduce<Record<string, FeedbackKommentar[]>>((acc, item) => {
      if (!acc[item.feedback_id]) acc[item.feedback_id] = [];
      acc[item.feedback_id].push(item);
      return acc;
    }, {});
    setCommentsByFeedback(grouped);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!popoverOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments(eintraege.map((entry) => entry.id));
  }, [popoverOpen, eintraege, loadComments]);

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

  const handleStartEdit = useCallback((entry: FeedbackEintragMarker) => {
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
    setEintraege((prev) =>
      prev.map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              ...payload,
              deadline: payload.deadline,
              beschreibung: payload.beschreibung,
            }
          : entry
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
      await loadComments(eintraege.map((entry) => entry.id));
    },
    [commentDraftByFeedback, eintraege, loadComments, user]
  );

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
            <ul className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
              {eintraege.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-2.5 py-2 text-sm"
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
                        className="min-h-[74px] w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
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
                      <p className={`mt-1 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200 ${expandedDescription[e.id] ? "" : "line-clamp-2"}`}>
                        {e.beschreibung}
                      </p>
                      {e.beschreibung.length > 130 && (
                        <button
                          type="button"
                          onClick={() => setExpandedDescription((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                          className="mt-1 text-xs font-medium text-[#FF6554] hover:underline"
                        >
                          {expandedDescription[e.id] ? "Weniger anzeigen" : "Mehr anzeigen"}
                        </button>
                      )}
                      <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatDatum(e.created_at)}
                        {e.user_name ? ` · ${e.user_name}` : ""}
                        {e.status !== "Offen" ? ` · ${e.status}` : ""}
                      </p>
                      <div className="mt-1 flex justify-end">
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

                  <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setExpandedComments((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      Kommentare ({(commentsByFeedback[e.id] ?? []).length}) {expandedComments[e.id] ? "▲" : "▼"}
                    </button>
                    {expandedComments[e.id] && (
                      <div className="mt-1 space-y-1">
                        <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
                          {(commentsByFeedback[e.id] ?? []).length === 0 ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Noch keine Kommentare.</p>
                          ) : (
                            (commentsByFeedback[e.id] ?? []).map((comment) => (
                              <div key={comment.id} className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-700/50">
                                <p className="whitespace-pre-wrap break-words text-xs text-zinc-800 dark:text-zinc-200">{comment.kommentar}</p>
                                <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {comment.user_name ?? "User"} · {formatDatum(comment.created_at)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
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
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
