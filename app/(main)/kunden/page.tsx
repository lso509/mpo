"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";

import { useState } from "react";
import Link from "next/link";

const KPI_CARDS = [
  { label: "Gesamt Kunden", value: "8", sub: "7 aktiv" },
  { label: "Aktive Mediapläne", value: "6", sub: "über alle Kunden" },
  { label: "Offene Aufgaben", value: "29", sub: "gesamt" },
  { label: "Gesamtbudget", value: "1.475.750,00 €", sub: "aktive Kunden" },
];

const CUSTOMERS = [
  {
    id: "1",
    name: "Acme Corp",
    industry: "Technologie",
    activePlans: 1,
    budget: "95.000,00 €",
    openTasks: 3,
    lastActivity: "20.02.2026",
    status: "Aktiv" as const,
  },
  {
    id: "2",
    name: "FL1",
    industry: "Energie",
    activePlans: 1,
    budget: "128.500,00 €",
    openTasks: 4,
    lastActivity: "20.02.2026",
    status: "Aktiv" as const,
  },
  {
    id: "3",
    name: "Salt",
    industry: "Telekommunikation",
    activePlans: 2,
    budget: "567.000,00 €",
    openTasks: 8,
    lastActivity: "19.02.2026",
    status: "Aktiv" as const,
  },
  {
    id: "4",
    name: "RetailCo",
    industry: "Einzelhandel",
    activePlans: 0,
    budget: "78.000,00 €",
    openTasks: 0,
    lastActivity: "15.02.2026",
    status: "Inaktiv" as const,
  },
];

export default function KundenPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CUSTOMERS.find((c) => c.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Kunden
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Übersicht aller Kunden und deren Aktivitäten
        </p>
      </header>

      <div className="flex gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="border-b-2 border-violet-600 pb-3 pr-4 text-sm font-medium text-violet-600"
        >
          Übersicht
        </button>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="border-b-2 border-transparent pb-3 pr-4 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Reporting
        </button>
      </div>

      <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
            <p className="text-xs font-medium text-zinc-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{kpi.sub}</p>
          </div>
        ))}
        </div>
      </section>

      <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500">
          Alle Kunden
        </h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Kunde
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Branche
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Aktive Pläne
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Gesamtbudget
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Offene Aufgaben
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Letzte Aktivität
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700" />
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50 ${
                    selectedId === c.id ? "bg-violet-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="flex items-center gap-2 font-medium text-zinc-900 hover:underline"
                    >
                      👤 {c.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{c.industry}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                      {c.activePlans}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {c.budget}
                  </td>
                  <td className="px-4 py-3">
                    {c.openTasks > 0 ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        {c.openTasks}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{c.lastActivity}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === "Aktiv"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium text-violet-600 hover:underline"
                    >
                      Dashboard &gt;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected != null && (
        <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-950">
            {selected.name} – Details
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Branche</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.industry}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">
                Aktive Mediapläne
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.activePlans}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Gesamtbudget</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.budget}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">
                Offene Aufgaben
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.openTasks}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
