"use client";

import { useState } from "react";

const KPI_CARDS = [
  { label: "Gesamt Lieferanten", value: "8", sub: "7 aktiv" },
  { label: "Verfügbare Produkte", value: "29", sub: "über alle Lieferanten" },
  { label: "Hauptregionen", value: "4", sub: "USA, Schweiz, Deutschland, China" },
  { label: "Lieferanten-Typen", value: "7", sub: "verschiedene Kategorien" },
];

const SUPPLIERS = [
  {
    id: "1",
    name: "Amazon Advertising",
    type: "E-Commerce",
    products: 4,
    location: "USA",
    email: "advertising@amazon.com",
    phone: "+1 206 268 1000",
    status: "Aktiv" as const,
  },
  {
    id: "2",
    name: "Goldbach Media",
    type: "TV & Online",
    products: 3,
    location: "Schweiz",
    email: "info@goldbach.com",
    phone: "+41 44 250 50 50",
    status: "Aktiv" as const,
  },
  {
    id: "3",
    name: "Google Ads",
    type: "Search & Display",
    products: 5,
    location: "USA",
    email: "support@google.com",
    phone: "+1 650 253 0000",
    status: "Aktiv" as const,
  },
  {
    id: "4",
    name: "Ströer Media",
    type: "Out-of-Home",
    products: 2,
    location: "Deutschland",
    email: "kontakt@stroer.de",
    phone: "+49 30 224 40 00",
    status: "Inaktiv" as const,
  },
];

export default function LieferantenPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SUPPLIERS.find((s) => s.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Lieferanten
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Verwaltung aller Medien-Lieferanten und Partner
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            className="haupt-box border border-zinc-200 p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950">
          Alle Lieferanten
        </h2>
        <div className="content-radius overflow-hidden border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Lieferant
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Typ</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Produkte
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Standort
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Kontakt
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50 ${
                    selectedId === s.id ? "bg-[#FF6554]/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{s.type}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                      {s.products}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">📍 {s.location}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    <p className="text-xs">{s.email}</p>
                    <p className="text-xs">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "Aktiv"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected != null && (
        <section className="haupt-box border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-950">
            {selected.name} – Details
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Typ</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.type}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Standort</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.location}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">E-Mail</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Telefon</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.phone}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
