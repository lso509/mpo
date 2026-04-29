"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";
import Link from "next/link";
import { useState } from "react";

type TaskStatus = "Offen" | "Erledigt" | "Nicht relevant";
type TaskSection = "overdue" | "next7" | "allOpen";

type Task = {
  id: string;
  client: string;
  campaign: string;
  campaignWave?: string;
  status: TaskStatus;
  task: string;
  dueDate: string;
  assignee: string;
  section: TaskSection;
  email_vorlage_id?: string | null;
  email_vorlage_title?: string | null;
};

const TASK_TYPES = [
  "1. Freigabestatus prüfen",
  "2. Kampagnenbriefing erstellen",
  "3. Einbuchung bei Verlag",
  "4. Creatives bereitstellen",
];
const STATUS_OPTIONS = ["Nicht begonnen", "In Bearbeitung", "Erledigt", "Offen"];
const EMPLOYEES = ["Emma Weber", "Hans Meier", "Mike Schmidt", "Sarah Müller"];

const MOCK_DOCS = [
  { name: "Creative_Banner_1920x1080.jpg", size: "2.4 MB", date: "15.02.2026" },
  { name: "Creative_Mobile_750x1334.jpg", size: "1.8 MB", date: "15.02.2026" },
  { name: "Kampagnenbriefing_Q1_2026.pdf", size: "456 KB", date: "12.02.2026" },
];

export function TaskDetailPanel({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: () => void;
}) {
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [responsible, setResponsible] = useState(task.assignee);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [notes, setNotes] = useState(
    "Kreativ-Briefing muss vor Beginn der Produktion mit dem Kunden besprochen werden."
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl"
        aria-labelledby="task-detail-title"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="task-detail-title" className="text-lg font-semibold text-zinc-950">
            Aufgabendetails
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Schließen"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            <div className="grid gap-2">
              <p className="text-xs font-medium text-zinc-500">Kunde</p>
              <p className="text-sm font-medium text-zinc-900">{task.client}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-medium text-zinc-500">Produkt</p>
              <p className="text-sm font-medium text-zinc-900">{task.campaign}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-medium text-zinc-500">Kampagne</p>
              <p className="text-sm font-medium text-zinc-900">
                {task.campaignWave ?? "—"}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-500">
                Aufgabentyp
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {TASK_TYPES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {task.email_vorlage_id && task.email_vorlage_title ? (
              <div className="content-radius border border-[#FF6554]/30 bg-[#FF6554]/10 p-4">
                <p className="text-sm font-semibold text-[#FF6554]">
                  E-Mail Vorlage verfügbar
                </p>
                <p className="mt-1 text-xs text-[#e55a4a]">
                  {task.email_vorlage_title}
                </p>
                <Link
                  href={`/einstellungen/email-vorlagen/${task.email_vorlage_id}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6554] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e55a4a]"
                >
                  ✉ E-Mail Vorlage öffnen
                </Link>
              </div>
            ) : (
              <div className="content-radius border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-700">
                  Keine E-Mail-Vorlage mit dieser Aufgabe verknüpft.
                </p>
                <button
                  type="button"
                  onClick={nochNichtImplementiert}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  ✉ E-Mail Vorlagen verwalten
                </button>
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-500">
                Verantwortlich
              </label>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {EMPLOYEES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-500">
                Fälligkeitsdatum
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm text-zinc-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  📅
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-500">
                Notizen
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              />
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-medium text-zinc-500">Dokumente</p>
              <button
                type="button"
                onClick={nochNichtImplementiert}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-zinc-200 bg-zinc-50 py-4 text-sm font-medium text-zinc-600 hover:border-[#FF6554]/40 hover:bg-[#FF6554]/10 hover:text-[#FF6554]"
              >
                ↑ Dokument hochladen
              </button>
              <p className="text-xs text-zinc-500">
                z.B. Creatives, Briefings, Reportings, Rechnungen (max. 10 MB)
              </p>
              <ul className="mt-2 space-y-2">
                {MOCK_DOCS.map((doc) => (
                  <li
                    key={doc.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-zinc-800">
                      {doc.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {doc.size} · {doc.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <footer className="border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={onSave}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-800 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-900"
          >
            💾 Speichern
          </button>
        </footer>
      </aside>
    </>
  );
}
