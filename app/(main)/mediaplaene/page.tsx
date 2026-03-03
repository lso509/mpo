"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = [
  { id: "all", label: "Alle (5)" },
  { id: "aktiv", label: "Aktiv (2)" },
  { id: "entwurf", label: "Entwürfe (2)" },
  { id: "abgeschlossen", label: "Abgeschlossen (1)" },
  { id: "archiviert", label: "Archiviert (0)" },
];

const PLANS = [
  {
    id: "1",
    client: "Salt",
    status: "Aktiv" as const,
    campaign: "Q1 2026 - Digitale Transformation",
    dateRange: "01.03.2026 - 30.06.2026",
    positions: 6,
    total: "255.000,00 €",
    margin: "10.000,00 €",
  },
  {
    id: "2",
    client: "FL1",
    status: "Aktiv" as const,
    campaign: "Frühjahrs-Kampagne 2026",
    dateRange: "15.02.2026 - 31.05.2026",
    positions: 4,
    total: "128.500,00 €",
    margin: "5.000,00 €",
  },
  {
    id: "3",
    client: "VP Bank",
    status: "Entwurf" as const,
    campaign: "Brand Awareness Initiative",
    dateRange: "01.04.2026 - 31.07.2026",
    positions: 5,
    total: "185.750,00 €",
    margin: "7.500,00 €",
  },
  {
    id: "4",
    client: "Salt",
    status: "Abgeschlossen" as const,
    campaign: "Q4 2025 - Jahresendkampagne",
    dateRange: "01.10.2025 - 31.12.2025",
    positions: 8,
    total: "312.000,00 €",
    margin: "12.000,00 €",
  },
  {
    id: "5",
    client: "FL1",
    status: "Entwurf" as const,
    campaign: "Sommer Special 2026",
    dateRange: "01.06.2026 - 31.08.2026",
    positions: 3,
    total: "95.000,00 €",
    margin: "3.000,00 €",
  },
];

export default function MediaplaenePage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? PLANS
      : PLANS.filter((p) => p.status.toLowerCase() === activeTab);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Mediapläne
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Alle Kampagnen und Mediapläne
          </p>
        </header>
        <Link
          href="/mediaplaene/neu"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Neuer Mediaplan
        </Link>
      </div>

      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((plan) => (
          <article
            key={plan.id}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-950">{plan.client}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plan.status === "Aktiv"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-700">
                {plan.campaign}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                📅 {plan.dateRange} · {plan.positions} Positionen
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="text-right text-sm">
                <p className="font-semibold text-zinc-950">
                  Gesamtsumme {plan.total}
                </p>
                <p className="text-zinc-500">Agentur-Marge {plan.margin}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/mediaplaene/${plan.id}`}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  👁 Ansehen
                </Link>
                <Link
                  href={`/mediaplaene/${plan.id}`}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  ✏ Bearbeiten
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
