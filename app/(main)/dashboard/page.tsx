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
};

const EMPLOYEES = ["Emma Weber", "Hans Meier", "Mike Schmidt", "Sarah Müller"] as const;

function mapRow(row: Record<string, unknown>): Task {
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
      ? "bg-amber-100 text-amber-900 border-amber-200"
      : status === "Erledigt"
        ? "bg-emerald-100 text-emerald-900 border-emerald-200"
        : "bg-zinc-100 text-zinc-700 border-zinc-200";

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
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        isOverdue
          ? "border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50"
          : "cursor-pointer border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">
            {task.client}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-950">
            {task.campaign}
          </h3>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            task.taskTypeTag === "purple"
              ? "bg-violet-100 text-violet-900"
              : task.taskTypeTag === "orange"
                ? "bg-orange-100 text-orange-900"
                : task.taskTypeTag === "blue"
                  ? "bg-blue-100 text-blue-900"
                  : task.taskTypeTag === "green"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-zinc-100 text-zinc-700"
          }`}
        >
          {task.task}
        </span>
      </div>
      <dl className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>📅</span>
          <span className="font-medium text-zinc-800">{task.dueDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700">
            {initials(task.assignee)}
          </div>
          <span className="font-medium text-zinc-800">{task.assignee}</span>
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
    <section className="grid gap-4">
      <header className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            {title}
          </h2>
          <p className="text-sm font-medium text-zinc-500">{count} Aufgaben</p>
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
      const { data, error: err } = await supabase
        .from("aufgaben")
        .select("*")
        .order("due_date", { ascending: true });
      if (err) {
        setError(err.message);
        setTasks([]);
      } else {
        setTasks((data ?? []).map(mapRow));
      }
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
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Agentur-Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Übersicht aller offenen Aufgaben und Deadlines
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Fehler beim Laden: {error}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
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
                    ? "border-violet-500 bg-violet-100 text-violet-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {assigneeFilter != null && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-600">
                Gefiltert nach: <strong>{assigneeFilter}</strong>
              </p>
              <button
                type="button"
                onClick={() => setAssigneeFilter(null)}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ✕ Filter zurücksetzen
              </button>
            </div>
          )}
        </section>

        {loading ? (
          <p className="text-zinc-500">Aufgaben werden geladen…</p>
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
