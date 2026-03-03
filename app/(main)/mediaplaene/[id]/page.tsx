"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

const POSITIONS = [
  {
    id: "1",
    title: "Display Banner - Homepage Leaderboard",
    desc: "Frühlingsaktion - Welle 1, 2.500 CPM",
    tag: "Sichtbarkeit",
    status: ["Reporting", "Offen"],
    brutto: "68.250,00 CHF",
    discount: "-10% (6.825,00 CHF)",
    kundenpreis: "61.875,00 CHF",
  },
  {
    id: "2",
    title: "Print - Tageszeitungen Inserat",
    desc: "Frühlingsaktion - Welle 1, 3 Schaltungen",
    tag: "Sichtbarkeit",
    status: ["Einbuchung", "Rechnung"],
    brutto: "20.160,00 CHF",
    discount: "-5% (1.008,00 CHF)",
    kundenpreis: "19.152,00 CHF",
  },
  {
    id: "3",
    title: "TV Spot - Prime Time",
    desc: "Frühlingsaktion - Welle 2, 12 Spots",
    tag: "Sichtbarkeit",
    status: ["Reporting", "Offen"],
    brutto: "110.000,00 CHF",
    discount: "-8% (7.600,00 CHF)",
    kundenpreis: "103.132,00 CHF",
  },
  {
    id: "4",
    title: "Radio Spot - Drive Time",
    desc: "Frühlingsaktion - Welle 2, 30 Spots",
    tag: "Sichtbarkeit",
    status: ["Einbuchung", "Offen", "Rechnung", "Offen"],
    brutto: "14.000,00 CHF",
    discount: "-10% (1.400,00 CHF)",
    kundenpreis: "12.600,00 CHF",
  },
  {
    id: "5",
    title: "Google Search Ads - Brand",
    desc: "Frühlingsaktion - Welle 2, 50.000 Klicks",
    tag: "Traffic",
    status: ["Rechnung", "Offen"],
    brutto: "38.000,00 CHF",
    discount: "-5% (1.900,00 CHF)",
    kundenpreis: "36.100,00 CHF",
  },
];

const COMMENTS = [
  {
    author: "Sarah Müller",
    date: "21.02.2026, 14:30",
    text: "Kunde hat die Budgeterhöhung für Q2 bestätigt. Wir können mit der Planung fortfahren.",
  },
  {
    author: "Thomas Weber",
    date: "20.02.2026, 10:15",
    text: "Video-Creatives sind vom Kunden freigegeben worden. Versand an Publisher erfolgt morgen.",
  },
];

export default function MediaplanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
  const [viewMode, setViewMode] = useState<"agentur" | "kunde">("agentur");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Frühjahrs-Kampagne 2026
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Salt Schweiz | 1.1.2026 - 31.12.2026
            {planId && <span className="ml-2 text-zinc-400">(ID: {planId})</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Creative-Übersicht senden (8)
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-600">
              Ansichtsmodus:
            </span>
            <button
              type="button"
              onClick={() => setViewMode("agentur")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === "agentur"
                  ? "bg-violet-100 text-violet-900"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              Agentur-Ansicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kunde")}
              className="relative rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              <span
                className={
                  viewMode === "kunde"
                    ? "bg-violet-100 text-violet-900"
                    : "bg-zinc-100 text-zinc-600"
                }
              >
                Kunden-Ansicht
              </span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </div>
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            PDF Export (A3)
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Neue Positionen zur Freigabe (1)
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Es wurde 1 neue Position zu diesem Mediaplan hinzugefügt. Bitte prüfen
          Sie diese und erteilen Sie Ihre Freigabe.
        </p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700">
            Kundeninformationen
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Unternehmen:</dt>
              <dd className="font-medium text-zinc-900">Salt Mobile AG</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Adresse:</dt>
              <dd className="font-medium text-zinc-900">
                Richtiring 7, 8304 Wallisellen, Schweiz
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">E-Mail:</dt>
              <dd className="font-medium text-zinc-900">marketing@salt.ch</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Telefon:</dt>
              <dd className="font-medium text-zinc-900">+41 800 700 700</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-700">
            Ihr Kundenberater
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Name:</dt>
              <dd className="font-medium text-zinc-900">Sarah Müller</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Position:</dt>
              <dd className="font-medium text-zinc-900">Senior Account Manager</dd>
            </div>
            <div>
              <dt className="text-zinc-500">E-Mail:</dt>
              <dd className="font-medium text-zinc-900">
                sarah.mueller@coagency.ch
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Telefon / Mobil:</dt>
              <dd className="font-medium text-zinc-900">
                +41 44 123 45 67 / +41 79 123 45 67
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-950">
            Bestätigte Positionen ({POSITIONS.length})
          </h2>
          <div className="flex gap-2">
            <input type="checkbox" className="rounded" aria-label="Alle auswählen" />
            <button
              type="button"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Bulk Edit
            </button>
          </div>
        </div>
        <ul className="mt-4 space-y-4">
          {POSITIONS.map((pos) => (
            <li
              key={pos.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 rounded" />
                <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium text-zinc-950">{pos.title}</p>
                  <p className="text-sm text-zinc-600">{pos.desc}</p>
                  <span className="mt-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                    {pos.tag}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 sm:flex-nowrap">
                {pos.status.map((s, i) => (
                  <span key={i} className="rounded bg-zinc-100 px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-right text-sm">
                <p className="text-zinc-500">Brutto {pos.brutto}</p>
                <p className="text-zinc-500">{pos.discount}</p>
                <p className="font-semibold text-zinc-950">
                  Kundenpreis {pos.kundenpreis}
                </p>
              </div>
              <button
                type="button"
                className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Löschen"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/30 hover:text-violet-700"
        >
          + Position hinzufügen
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-700">
            Einmalige Positionen
          </h3>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">
                Bestätigte Positionen (exkl. MwSt.)
              </dt>
              <dd className="font-medium text-zinc-900">2.042,00 €</dd>
            </div>
            <div className="flex justify-between text-amber-700">
              <dt>Ausstehende Freigaben</dt>
              <dd className="font-medium">242,25 €</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2">
              <dt className="font-medium text-zinc-700">Gesamt einmalig</dt>
              <dd className="font-semibold text-zinc-950">2.284,25 €</dd>
            </div>
            <div className="flex justify-between text-sm text-zinc-500">
              <dt>Totalrabatt (einmalige Positionen)</dt>
              <dd>188,00 €</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-700">
            Agentur-Marge
          </h3>
          <p className="mt-3 text-2xl font-semibold text-zinc-950">
            286,23 €
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-950">
          Notizen &amp; Kommentare zum Mediaplan ({COMMENTS.length})
        </h3>
        <ul className="mt-4 space-y-4">
          {COMMENTS.map((c, i) => (
            <li key={i} className="border-l-2 border-violet-200 pl-4">
              <p className="text-sm font-medium text-zinc-900">{c.author}</p>
              <p className="text-xs text-zinc-500">{c.date}</p>
              <p className="mt-1 text-sm text-zinc-700">{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Notiz zum Mediaplan hinzufügen..."
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600"
            disabled
          >
            Senden
          </button>
        </div>
      </section>

      <footer className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          📄 Als Entwurf speichern
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ✓ Plan aktivieren
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ↓ PDF exportieren
        </button>
      </footer>
    </div>
  );
}
