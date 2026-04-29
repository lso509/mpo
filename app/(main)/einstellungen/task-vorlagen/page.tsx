"use client";

import { REFERENZ_OPTIONS, RICHTUNG_OPTIONS, sortTaskVorlagen, type Referenz, type Richtung, type TaskVorlage } from "@/lib/produkte";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TaskVorlageRow = TaskVorlage & {
  email_vorlage_id: string | null;
  standard_tage: number | null;
  standard_richtung: Richtung | null;
  standard_referenz: Referenz | null;
  is_active: boolean | null;
};

type EmailRef = {
  id: string;
  title: string;
};

export default function TaskVorlagenPage() {
  const [tasks, setTasks] = useState<TaskVorlageRow[]>([]);
  const [emailById, setEmailById] = useState<Record<string, EmailRef>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskVorlageRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("task_vorlagen")
        .select("id, category, title, description, email_vorlage_id, standard_tage, standard_richtung, standard_referenz, is_active")
        .order("category")
        .order("title"),
      supabase.from("email_vorlagen").select("id, title"),
    ]).then(([taskResult, emailResult]) => {
      if (taskResult.error) {
        setError(taskResult.error.message);
        setTasks([]);
      } else {
        const sorted = sortTaskVorlagen((taskResult.data ?? []) as TaskVorlage[]).map((task) => {
          const row = task as TaskVorlageRow;
          const normalizedRichtung: Richtung =
            row.standard_richtung === "nach" || row.standard_richtung === "am gleichen Tag" ? row.standard_richtung : "vor";
          const normalizedReferenz: Referenz =
            row.standard_referenz === "Startdatum" || row.standard_referenz === "Creative Deadline" ? row.standard_referenz : "Enddatum";
          return {
            ...row,
            email_vorlage_id: row.email_vorlage_id ?? null,
            standard_tage: row.standard_tage ?? 0,
            standard_richtung: normalizedRichtung,
            standard_referenz: normalizedReferenz,
            is_active: row.is_active !== false,
          };
        });
        setTasks(sorted);
      }

      if (!emailResult.error && emailResult.data) {
        const map: Record<string, EmailRef> = {};
        for (const row of emailResult.data as EmailRef[]) {
          map[row.id] = row;
        }
        setEmailById(map);
      }

      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) counts[task.category] = (counts[task.category] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0], "de"));
  }, [tasks]);
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, TaskVorlageRow[]>();
    for (const task of tasks) {
      const list = groups.get(task.category) ?? [];
      list.push(task);
      groups.set(task.category, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], "de"));
  }, [tasks]);

  const activeLabel = (task: TaskVorlageRow) => (task.is_active === false ? "Inaktiv" : "Aktiv");
  const scheduleLabel = (task: TaskVorlageRow) => {
    const tage = task.standard_tage ?? 0;
    const richtung = task.standard_richtung ?? "vor";
    const referenz = task.standard_referenz ?? "Enddatum";
    return `${tage} ${tage === 1 ? "Tag" : "Tage"} ${richtung} ${referenz}`;
  };

  async function handleSaveTask() {
    if (!editingTask) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      title: editingTask.title.trim(),
      description: editingTask.description?.trim() || null,
      category: editingTask.category.trim().toUpperCase(),
      standard_tage: Math.max(0, Number(editingTask.standard_tage ?? 0)),
      standard_richtung: editingTask.standard_richtung ?? "vor",
      standard_referenz: editingTask.standard_referenz ?? "Enddatum",
      is_active: editingTask.is_active !== false,
    };
    const { data, error: updateError } = await supabase
      .from("task_vorlagen")
      .update(payload)
      .eq("id", editingTask.id)
      .select("id");
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("Speichern fehlgeschlagen: Keine Berechtigung oder Vorlage nicht gefunden.");
      return;
    }
    setTasks((prev) => prev.map((task) => (task.id === editingTask.id ? { ...task, ...payload } : task)));
    setEditingTask(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">Task Vorlagen</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Automatisierungen und ihre Verknüpfung mit E-Mail Vorlagen
        </p>
      </header>

      {error && (
        <div className="content-radius border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          Fehler beim Laden: {error}
        </div>
      )}

      <section className="haupt-box p-6 dark:bg-zinc-800">
        <div className="flex flex-wrap gap-3">
          <div className="content-radius border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/80">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gesamt</p>
            <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{tasks.length}</p>
          </div>
          {categories.map(([category, count]) => (
            <div key={category} className="content-radius border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/80">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{category}</p>
              <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{count}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-zinc-500 dark:text-zinc-400">Task Vorlagen werden geladen…</p>
        ) : (
          <div className="mt-6 space-y-5">
            {groupedTasks.map(([category, categoryTasks]) => (
              <section key={category} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {category} ({categoryTasks.length})
                </h3>
                <ul className="space-y-3">
                  {categoryTasks.map((task) => {
                    const linked = task.email_vorlage_id ? emailById[task.email_vorlage_id] : undefined;
                    return (
                      <li key={task.id} className="content-radius border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{task.title}</p>
                            {task.description && (
                              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{task.description}</p>
                            )}
                            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Standard: {scheduleLabel(task)} · {activeLabel(task)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {linked ? (
                              <Link
                                href={`/einstellungen/email-vorlagen/${linked.id}`}
                                className="shrink-0 rounded-full border border-[#FF6554]/40 bg-[#FF6554]/10 px-3 py-1.5 text-xs font-medium text-[#FF6554] hover:bg-[#FF6554]/20"
                              >
                                E-Mail: {linked.title}
                              </Link>
                            ) : (
                              <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-300">
                                Keine E-Mail-Vorlage
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                              Bearbeiten
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingTask(null)}>
          <div className="w-full max-w-2xl content-radius border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-100">Vorlage bearbeiten</h2>
              <button type="button" onClick={() => setEditingTask(null)} className="text-2xl leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Task-Name</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Beschreibung</label>
                <textarea
                  rows={2}
                  value={editingTask.description ?? ""}
                  onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategorie</label>
                <input
                  type="text"
                  value={editingTask.category}
                  onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, category: e.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Standard-Zeitpunkt</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400">Tage</label>
                    <input
                      type="number"
                      min={0}
                      value={editingTask.standard_tage ?? 0}
                      onChange={(e) =>
                        setEditingTask((prev) =>
                          prev ? { ...prev, standard_tage: Number.isNaN(Number(e.target.value)) ? 0 : Math.max(0, Number(e.target.value)) } : prev
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400">Richtung</label>
                    <select
                      value={editingTask.standard_richtung ?? "vor"}
                      onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, standard_richtung: e.target.value as Richtung } : prev))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {RICHTUNG_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400">Referenz</label>
                    <select
                      value={editingTask.standard_referenz ?? "Enddatum"}
                      onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, standard_referenz: e.target.value as Referenz } : prev))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {REFERENZ_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {scheduleLabel(editingTask)}
                </p>
              </div>

              <label className="flex items-center gap-2 border-t border-zinc-200 pt-4 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={editingTask.is_active !== false}
                  onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))}
                />
                Vorlage ist aktiv und kann bei Produkten ausgewählt werden.
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveTask}
                disabled={saving}
                className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
