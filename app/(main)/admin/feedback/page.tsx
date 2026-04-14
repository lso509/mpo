"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  KATEGORIEN,
  PRIORITAET_OPTIONS,
  STATUS_OPTIONS,
  formatDatum,
  formatDatumMitZeit,
  formatDeadline,
  isDeadlineOverdue,
  prioritaetBadgeClass,
  type FeedbackKommentar,
  type FeedbackPrioritaet,
  type FeedbackStatus,
  type Kategorie,
} from "@/app/components/feedback/shared";

/** z. B. „Simone Ospelt“ → „SO“; ein Wort → erste zwei Buchstaben. */
function userKuerzel(userName: string | null | undefined): string {
  const full = userName?.trim();
  if (!full) return "—";
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function KategorieIcon({ kategorie }: { kategorie: string }) {
  if (kategorie === "Bug") {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9V7a4 4 0 118 0v2m-8 0h8m-8 0v8a4 4 0 004 4h0a4 4 0 004-4V9M5 10H3m18 0h-2M5 14H3m18 0h-2M8 5L6 3m10 2l2-2" />
      </svg>
    );
  }
  if (kategorie === "Idee") {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a7 7 0 00-4 12.75c.7.5 1 1.2 1 1.95V18h6v-.3c0-.75.3-1.45 1-1.95A7 7 0 0012 3zm-2 18h4m-3 0v-3m2 3v-3" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-5 5m5-5l5 5" />
    </svg>
  );
}

function kategorieIconColorClass(kategorie: string): string {
  if (kategorie === "Bug") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
  if (kategorie === "Idee") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
}

type FeedbackEintrag = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user_name: string | null;
  kategorie: string;
  beschreibung: string;
  seite: string | null;
  target: string | null;
  position_x: number | null;
  position_y: number | null;
  status: string;
  prioritaet: string;
  deadline: string | null;
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [eintraege, setEintraege] = useState<FeedbackEintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKategorie, setFilterKategorie] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPrioritaet, setFilterPrioritaet] = useState<string>("");
  const [filterTarget, setFilterTarget] = useState<string>("");
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    kategorie: Kategorie;
    beschreibung: string;
    status: FeedbackStatus;
    prioritaet: FeedbackPrioritaet;
    deadline: string;
    target: string;
  } | null>(null);
  const [commentsByFeedback, setCommentsByFeedback] = useState<Record<string, FeedbackKommentar[]>>({});
  const [commentDraftByFeedback, setCommentDraftByFeedback] = useState<Record<string, string>>({});
  const [commentSavingFor, setCommentSavingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("feedback_eintraege")
      .select("id, created_at, updated_at, user_id, user_name, kategorie, beschreibung, seite, target, position_x, position_y, status, prioritaet, deadline")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setEintraege([]);
    } else {
      setError(null);
      setEintraege((data as FeedbackEintrag[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
  }, [userLoading, user, router, load]);

  const loadComments = useCallback(async (feedbackIds: string[]) => {
    if (feedbackIds.length === 0) {
      setCommentsByFeedback({});
      return;
    }
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("feedback_kommentare")
      .select("id, feedback_id, created_at, user_id, user_name, kommentar")
      .in("feedback_id", feedbackIds)
      .order("created_at", { ascending: true });
    if (err) {
      setError(err.message);
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
    if (!loading && eintraege.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadComments(eintraege.map((entry) => entry.id));
    }
  }, [loading, eintraege, loadComments]);

  const updateEntry = useCallback(async (id: string, patch: Partial<FeedbackEintrag>) => {
    setSavingRow(id);
    const supabase = createClient();
    const { error: err } = await supabase.from("feedback_eintraege").update(patch).eq("id", id);
    setSavingRow(null);
    if (err) {
      setError(err.message);
      return false;
    }
    setEintraege((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    return true;
  }, []);

  const handleSendComment = useCallback(
    async (feedbackId: string) => {
      const text = commentDraftByFeedback[feedbackId]?.trim();
      if (!text) return;
      setCommentSavingFor(feedbackId);
      const supabase = createClient();
      const { error: err } = await supabase.from("feedback_kommentare").insert({
        feedback_id: feedbackId,
        user_id: user?.id ?? null,
        user_name: user?.user_metadata?.full_name ?? user?.email ?? null,
        kommentar: text,
      });
      setCommentSavingFor(null);
      if (err) {
        setError(err.message);
        return;
      }
      setCommentDraftByFeedback((prev) => ({ ...prev, [feedbackId]: "" }));
      await loadComments(eintraege.map((entry) => entry.id));
    },
    [commentDraftByFeedback, eintraege, loadComments, user]
  );

  const startEdit = useCallback((entry: FeedbackEintrag) => {
    setEditingRow(entry.id);
    setEditForm({
      kategorie: entry.kategorie as Kategorie,
      beschreibung: entry.beschreibung,
      status: entry.status as FeedbackStatus,
      prioritaet: entry.prioritaet as FeedbackPrioritaet,
      deadline: entry.deadline ?? "",
      target: entry.target ?? "",
    });
  }, []);

  const toggleEditPanel = useCallback(
    (entry: FeedbackEintrag) => {
      const isOpen = !!expandedRows[entry.id];
      const isEditingThis = editingRow === entry.id;
      if (isOpen && isEditingThis) {
        setExpandedRows((prev) => ({ ...prev, [entry.id]: false }));
        setEditingRow(null);
        setEditForm(null);
        return;
      }
      setExpandedRows((prev) => ({ ...prev, [entry.id]: true }));
      startEdit(entry);
    },
    [editingRow, expandedRows, startEdit]
  );

  const saveEdit = useCallback(async () => {
    if (!editingRow || !editForm) return;
    const success = await updateEntry(editingRow, {
      kategorie: editForm.kategorie,
      beschreibung: editForm.beschreibung.trim(),
      status: editForm.status,
      prioritaet: editForm.prioritaet,
      deadline: editForm.deadline || null,
      target: editForm.target.trim() || null,
    });
    if (success) {
      setEditingRow(null);
      setEditForm(null);
    }
  }, [editForm, editingRow, updateEntry]);

  const filtered = eintraege.filter((e) => {
    if (filterKategorie && e.kategorie !== filterKategorie) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterPrioritaet && e.prioritaet !== filterPrioritaet) return false;
    if (filterTarget && (e.target ?? "") !== filterTarget) return false;
    if (filterOverdueOnly && !isDeadlineOverdue(e.deadline)) return false;
    return true;
  });

  const targetOptions = Array.from(
    new Set(eintraege.map((e) => e.target).filter((t): t is string => !!t))
  ).sort();

  if (userLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Wird geladen…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Feedback-Verwaltung
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Alle Feedback-Einträge (Bug, Idee, Optimierung) mit Kommentaren, Priorität, Status und Deadline.
        </p>
      </header>

      {error && (
        <div className="content-radius border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Kategorie:</span>
          <select
            value={filterKategorie}
            onChange={(e) => setFilterKategorie(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {KATEGORIEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Priorität:</span>
          <select
            value={filterPrioritaet}
            onChange={(e) => setFilterPrioritaet(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {PRIORITAET_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Ort (Target):</span>
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {targetOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={filterOverdueOnly}
            onChange={(e) => setFilterOverdueOnly(e.target.checked)}
          />
          <span>Nur überfällige Deadlines</span>
        </label>
      </div>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">Einträge werden geladen…</p>
      ) : (
        <div className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="whitespace-nowrap px-2 py-3 font-semibold text-zinc-700 dark:text-zinc-300">User</th>
                  <th className="whitespace-nowrap px-2 py-3 text-center font-semibold text-zinc-700 dark:text-zinc-300">Kat.</th>
                  <th className="whitespace-nowrap px-2 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Priorität</th>
                  <th className="whitespace-nowrap px-2 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Deadline</th>
                  <th className="whitespace-nowrap px-1 py-3 text-center font-semibold text-zinc-700 dark:text-zinc-300">Link</th>
                  <th className="min-w-[16rem] px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Beschreibung</th>
                  <th className="min-w-[12rem] whitespace-nowrap px-2 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-2 py-3 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <Fragment key={e.id}>
                    <tr
                      className={`border-b align-top ${
                        e.prioritaet === "Critical"
                          ? "border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/25 hover:bg-red-100/70 dark:hover:bg-red-950/35"
                          : "border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                      }`}
                    >
                      <td className="whitespace-nowrap px-2 py-3 align-top text-zinc-900 dark:text-zinc-100">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
                          title={e.user_name ?? e.user_id ?? undefined}
                        >
                          {e.user_name ? userKuerzel(e.user_name) : e.user_id ? "?" : "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 align-top text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${kategorieIconColorClass(e.kategorie)}`}
                          title={e.kategorie}
                          aria-label={e.kategorie}
                        >
                          <KategorieIcon kategorie={e.kategorie} />
                        </span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <select
                          value={e.prioritaet}
                          onChange={(event) => {
                            const value = event.target.value as FeedbackPrioritaet;
                            void updateEntry(e.id, { prioritaet: value });
                          }}
                          className="w-full min-w-[8.5rem] rounded-full border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {PRIORITAET_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 align-top text-zinc-600 dark:text-zinc-400">
                        <input
                          type="date"
                          value={e.deadline ?? ""}
                          onChange={(event) => {
                            void updateEntry(e.id, { deadline: event.target.value || null });
                          }}
                          className="w-[10.25rem] max-w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        {isDeadlineOverdue(e.deadline) && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600 dark:text-rose-300">Überfällig</p>
                        )}
                      </td>
                      <td className="px-1 py-3 align-top text-center text-zinc-600 dark:text-zinc-400">
                        {e.seite ? (
                          <a
                            href={
                              e.target === "overlay" && e.position_x != null && e.position_y != null
                                ? `${e.seite}#feedback-${e.id}`
                                : e.seite
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6554] text-white transition hover:bg-[#e55a4a]"
                            title={e.seite}
                            aria-label={
                              e.target === "overlay" && e.position_x != null && e.position_y != null
                                ? "Zur Pin-Stelle auf der Seite"
                                : "Seite öffnen"
                            }
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.5 19.5L19 5m0 0H8.25M19 5v10.75"
                              />
                            </svg>
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="min-w-[16rem] max-w-xl px-3 py-3 align-top text-zinc-900 dark:text-zinc-100">
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{e.beschreibung}</p>
                      </td>
                      <td className="min-w-[12rem] px-2 py-3 align-top">
                        <select
                          value={e.status}
                          onChange={(event) => {
                            const value = event.target.value as FeedbackStatus;
                            void updateEntry(e.id, { status: value });
                          }}
                          className="w-full min-w-0 max-w-[18rem] rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:border-[#FF6554] focus:outline-none focus:ring-1 focus:ring-[#FF6554]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 align-top text-right">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleEditPanel(e)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            aria-label="Eintrag bearbeiten"
                            title="Eintrag bearbeiten"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                          </button>
                        </div>
                        {savingRow === e.id && (
                          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Wird gespeichert…</p>
                        )}
                      </td>
                    </tr>
                    {expandedRows[e.id] && (
                      <tr className="border-b border-zinc-100 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-900/40">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/70">
                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Eintrag
                              </p>
                              {editingRow === e.id && editForm ? (
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
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={editForm.status}
                                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, status: event.target.value as FeedbackStatus } : prev))}
                                      className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                                    >
                                      {STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="date"
                                      value={editForm.deadline}
                                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, deadline: event.target.value } : prev))}
                                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={editForm.target}
                                    onChange={(event) => setEditForm((prev) => (prev ? { ...prev, target: event.target.value } : prev))}
                                    placeholder="Target (optional)"
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
                                    rows={4}
                                    className="min-h-[84px] w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRow(null);
                                        setEditForm(null);
                                      }}
                                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    >
                                      Abbrechen
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      disabled={savingRow === e.id || !editForm.beschreibung.trim()}
                                      className="rounded-full bg-[#FF6554] px-3 py-1 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
                                    >
                                      Speichern
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                                  <p>
                                    <span className="font-medium">Priorität:</span>{" "}
                                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${prioritaetBadgeClass(e.prioritaet)}`}>
                                      {e.prioritaet}
                                    </span>
                                  </p>
                                  <p><span className="font-medium">Deadline:</span> {formatDeadline(e.deadline)}</p>
                                  <p><span className="font-medium">Status:</span> {e.status}</p>
                                  <p><span className="font-medium">Zuletzt geändert:</span> {formatDatumMitZeit(e.updated_at)}</p>
                                </div>
                              )}
                            </div>

                            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/70">
                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Kommentare ({(commentsByFeedback[e.id] ?? []).length})
                              </p>
                              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                                {(commentsByFeedback[e.id] ?? []).length === 0 ? (
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Kommentare vorhanden.</p>
                                ) : (
                                  (commentsByFeedback[e.id] ?? []).map((comment) => (
                                    <div key={comment.id} className="rounded-lg bg-zinc-100 px-2.5 py-2 dark:bg-zinc-700/50">
                                      <p className="whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-200">
                                        {comment.kommentar}
                                      </p>
                                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
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
                                  className="w-full rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendComment(e.id)}
                                  disabled={commentSavingFor === e.id || !(commentDraftByFeedback[e.id] ?? "").trim()}
                                  className="rounded-full bg-[#FF6554] px-3 py-1 text-sm font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
                                >
                                  {commentSavingFor === e.id ? "Senden…" : "Senden"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="p-6 text-center text-zinc-500 dark:text-zinc-400">Keine Einträge.</p>
          )}
        </div>
      )}
    </div>
  );
}
