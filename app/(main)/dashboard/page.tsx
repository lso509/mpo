"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskDetailPanel } from "../../components/TaskDetailPanel";

type TaskStatus = "Offen" | "Erledigt" | "Nicht relevant";
type TaskSection = "overdue" | "next7" | "allOpen";

type Task = {
  id: string;
  client: string;
  campaign: string;
  campaignWave?: string;
  status: TaskStatus;
  task: string;
  taskTypeTag?: "purple" | "orange" | "blue" | "green";
  dueDate: string;
  assignee: string;
  section: TaskSection;
  mediaplan_id?: string | null;
  mediaplan_position_id?: string | null;
  task_vorlage_id?: string | null;
  email_vorlage_id?: string | null;
  email_vorlage_title?: string | null;
};

const EMPLOYEES = ["Emma Weber", "Hans Meier", "Mike Schmidt", "Sarah Müller"] as const;

function mapRow(
  row: Record<string, unknown>,
  emailVorlagenByTaskVorlage: Record<string, { id: string; title: string }>
): Task {
  const taskVorlageId = row.task_vorlage_id as string | undefined;
  const ev = taskVorlageId ? emailVorlagenByTaskVorlage[taskVorlageId] : undefined;
  return {
    id: String(row.id),
    client: String(row.client),
    campaign: String(row.campaign),
    campaignWave: row.campaign_wave != null ? String(row.campaign_wave) : undefined,
    status: row.status as TaskStatus,
    task: String(row.task),
    taskTypeTag: row.task_type_tag != null ? (row.task_type_tag as Task["taskTypeTag"]) : undefined,
    dueDate: String(row.due_date),
    assignee: String(row.assignee),
    section: row.section as TaskSection,
    mediaplan_id: row.mediaplan_id as string | undefined ?? undefined,
    mediaplan_position_id: row.mediaplan_position_id as string | undefined ?? undefined,
    task_vorlage_id: taskVorlageId ?? undefined,
    email_vorlage_id: ev?.id ?? undefined,
    email_vorlage_title: ev?.title ?? undefined,
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/g);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.at(-1)?.[0] ?? "";
  return (a + b).toUpperCase();
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles =
    status === "Offen"
      ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
      : status === "Erledigt"
        ? "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700"
        : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

function TaskCard({
  task,
  isOverdue,
  onClick,
}: {
  task: Task;
  isOverdue: boolean;
  onClick: () => void;
}) {
  const isFromAutomation = !!(task.mediaplan_id ?? task.task_vorlage_id);
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`content-radius border p-5 transition ${
        isOverdue
          ? "border-[#FF6554]/40 dark:border-[#FF6554]/50 bg-gradient-to-br from-[#FF6554]/10 to-blue-50 dark:from-[#FF6554]/20 dark:to-blue-950/40 cursor-pointer"
          : "cursor-pointer border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            {task.client}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
            {task.campaign}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFromAutomation && (
            <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
              Automatisierung
            </span>
          )}
          <StatusBadge status={task.status} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            task.taskTypeTag === "purple"
              ? "bg-[#FF6554]/15 text-[#FF6554] dark:bg-[#FF6554]/20 dark:text-[#ff8877]"
              : task.taskTypeTag === "orange"
                ? "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200"
                : task.taskTypeTag === "blue"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200"
                  : task.taskTypeTag === "green"
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          }`}
        >
          {task.task}
        </span>
      </div>
      <dl className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>📅</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{task.dueDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {initials(task.assignee)}
          </div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{task.assignee}</span>
        </div>
      </dl>
    </article>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="haupt-box dark:bg-zinc-800 p-5">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{count} Aufgaben</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoading(true);
      setError(null);
      const [
        { data: aufgabenData, error: aufgabenErr },
        { data: taskVorlagenData },
        { data: emailVorlagenData },
      ] = await Promise.all([
        supabase.from("aufgaben").select("*").order("due_date", { ascending: true }),
        supabase.from("task_vorlagen").select("id, email_vorlage_id"),
        supabase.from("email_vorlagen").select("id, title"),
      ]);
      if (aufgabenErr) {
        setError(aufgabenErr.message);
        setTasks([]);
        setLoading(false);
        return;
      }
      const taskVorlagen = (taskVorlagenData ?? []) as { id: string; email_vorlage_id: string | null }[];
      const emailVorlagen = (emailVorlagenData ?? []) as { id: string; title: string }[];
      const emailById: Record<string, { id: string; title: string }> = Object.fromEntries(
        emailVorlagen.map((e) => [e.id, e])
      );
      const emailVorlagenByTaskVorlage: Record<string, { id: string; title: string }> = {};
      for (const tv of taskVorlagen) {
        if (tv.email_vorlage_id && emailById[tv.email_vorlage_id]) {
          emailVorlagenByTaskVorlage[tv.id] = emailById[tv.email_vorlage_id];
        }
      }
      setTasks((aufgabenData ?? []).map((row) => mapRow(row as Record<string, unknown>, emailVorlagenByTaskVorlage)));
      setLoading(false);
    }
    load();
  }, []);

  const filteredTasks = useMemo(() => {
    if (assigneeFilter == null) return tasks;
    return tasks.filter((t) => t.assignee === assigneeFilter);
  }, [tasks, assigneeFilter]);

  const overdue = filteredTasks.filter((t) => t.section === "overdue");
  const next7 = filteredTasks.filter((t) => t.section === "next7");
  const allOpen = filteredTasks.filter((t) => t.section === "allOpen");

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
            Agentur-Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Übersicht aller offenen Aufgaben und Deadlines
          </p>
        </header>

        {error && (
          <div className="content-radius border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
            Fehler beim Laden: {error}
          </div>
        )}

        <section className="haupt-box dark:bg-zinc-800 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span aria-hidden>🔽</span>
            Nach Mitarbeiter filtern
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {EMPLOYEES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setAssigneeFilter((prev) => (prev === name ? null : name))
                }
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  assigneeFilter === name
                    ? "border-[#FF6554] bg-[#FF6554]/15 text-[#FF6554] dark:border-[#FF6554] dark:bg-[#FF6554]/20 dark:text-[#ff8877]"
                    : "border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {assigneeFilter != null && (
            <div className="flex items-center gap-3">
<p className="text-sm text-zinc-600 dark:text-zinc-400">
              Gefiltert nach: <strong className="text-zinc-900 dark:text-zinc-100">{assigneeFilter}</strong>
            </p>
              <button
                type="button"
                onClick={() => setAssigneeFilter(null)}
                className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                ✕ Filter zurücksetzen
              </button>
            </div>
          )}
        </section>

        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Aufgaben werden geladen…</p>
        ) : (
          <>
        <Section title="Überfällige Aufgaben" count={overdue.length}>
          {overdue.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              isOverdue
              onClick={() => setSelectedTask(t)}
            />
          ))}
        </Section>

        <Section title="Fällig in den nächsten 7 Tagen" count={next7.length}>
          {next7.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              isOverdue={false}
              onClick={() => setSelectedTask(t)}
            />
          ))}
        </Section>

        <Section title="Alle offenen Aufgaben" count={allOpen.length}>
          {allOpen.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              isOverdue={false}
              onClick={() => setSelectedTask(t)}
            />
          ))}
        </Section>
          </>
        )}
      </div>

      {selectedTask != null && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
