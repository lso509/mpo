"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";

import { useState } from "react";
import Link from "next/link";

const CATEGORY_CARDS = [
  { label: "Gesamt", value: 9, color: "zinc" },
  { label: "Kunde", value: 4, color: "blue" },
  { label: "Verlag", value: 4, color: "emerald" },
  { label: "Lieferant", value: 0, color: "orange" },
  { label: "Intern", value: 1, color: "violet" },
];

const TEMPLATES = [
  {
    id: "1",
    title: "Creatives beim Kunden anfordern",
    subject: "Creative-Material für {{campaign_name}} benötigt",
    placeholders: 8,
    created: "15.1.2026",
    updated: "10.2.2026",
    tags: ["Kunde", "Creatives vorhanden"],
  },
  {
    id: "2",
    title: "Einbuchungsbestätigung an Verlag",
    subject: "Buchung für {{client_name}} - {{campaign_name}}",
    placeholders: 11,
    created: "15.1.2026",
    tags: ["Verlag", "Einbuchung Verlag"],
  },
  {
    id: "3",
    title: "Neue Position zur Freigabe an Kunde",
    subject: "Neue Position zur Freigabe: {{position_name}}",
    placeholders: 11,
    created: "5.2.2026",
    tags: ["Kunde", "Freigabestatus"],
  },
  {
    id: "4",
    title: "Creative-Übersicht: Alle Positionen gesammelt",
    subject: "Creative-Übersicht: {{campaign_name}} - Alle Positionen",
    placeholders: 2,
    created: "3.3.2026",
    tags: ["Kunde", "Creatives vorhanden"],
  },
];

export default function EmailVorlagenPage() {
  const [newModalOpen, setNewModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          E-Mail Vorlagen
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Vordefinierte E-Mail-Templates für wiederkehrende Kommunikation
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        {CATEGORY_CARDS.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border px-4 py-3 ${
              c.color === "zinc"
                ? "border-zinc-200 bg-zinc-50"
                : c.color === "blue"
                  ? "border-blue-200 bg-blue-50"
                  : c.color === "emerald"
                    ? "border-emerald-200 bg-emerald-50"
                    : c.color === "orange"
                      ? "border-orange-200 bg-orange-50"
                      : "border-violet-200 bg-violet-50"
            }`}
          >
            <p className="text-xs font-medium text-zinc-600">{c.label}</p>
            <p className="text-xl font-semibold text-zinc-950">{c.value}</p>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="ml-auto rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          + Neue Vorlage
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Suche nach Name, Betreff oder Inhalt..."
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm"
        />
        <select className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700">
          <option>Alle Kategorien</option>
        </select>
        <select className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700">
          <option>Alle Schritte</option>
        </select>
      </div>

      <ul className="space-y-3">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <Link
              href={`/einstellungen/email-vorlagen/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl opacity-70">✉</span>
                <div>
                  <p className="font-semibold text-zinc-950">{t.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Betreff: {t.subject}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t.placeholders} Platzhalter · Erstellt: {t.created}
                    {t.updated != null && ` · Aktualisiert: ${t.updated}`}
                  </p>
                </div>
              </div>
              <span className="text-zinc-400">→</span>
            </Link>
          </li>
        ))}
      </ul>

      {newModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setNewModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-zinc-950">
              Neue Vorlage erstellen
            </h3>
            <form className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500">
                  Name
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500">
                  Kategorie
                </label>
                <select className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <option>Kunde</option>
                  <option>Verlag</option>
                  <option>Lieferant</option>
                  <option>Intern</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={nochNichtImplementiert}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
