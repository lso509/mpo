"use client";

import { useState } from "react";
import Link from "next/link";
import { nochNichtImplementiert } from "@/lib/not-implemented";

function renderCurrencyPrefix(text: string) {
  const parts = text.split(/CHF(?=\s*\d)/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (
    <span key={`currency-part-${index}`}>
      {index > 0 && <span className="currency-prefix">CHF</span>}
      {part}
    </span>
  ));
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ausgangsrechnungen", label: "Ausgangsrechnungen (4)" },
  { id: "eingangsrechnungen", label: "Eingangsrechnungen (4)", badge: 1 },
  { id: "auftragsbestätigungen", label: "Auftragsbestätigungen (3)" },
];

const KPI_CARDS = [
  {
    label: "Offene Ausgangsrechnungen",
    value: "2",
    amount: "CHF 97'000",
    icon: "i",
  },
  {
    label: "Zu prüfen",
    value: "1",
    amount: "CHF 15'500",
    icon: "🕐",
  },
  {
    label: "Abrechenbare Positionen",
    value: "3",
    amount: "CHF 20'000",
    icon: "€",
  },
  {
    label: "Reklamationen",
    value: "1",
    sub: "Offene Fälle",
    icon: "⚠",
  },
];

const BILLABLE = [
  {
    id: "1",
    title: "Linkedin Sponsored Post",
    client: "Salt Schweiz AG - Frühjahrs-Kampagne 2026",
    approved: "Freigegeben: 02.03.2026",
    amount: "CHF 5'500",
  },
  {
    id: "2",
    title: "Podcast Sponsoring",
    client: "Salt Schweiz AG - Frühjahrs-Kampagne 2026",
    approved: "Freigegeben: 01.03.2026",
    amount: "CHF 8'000",
  },
  {
    id: "3",
    title: "Display Banner Watson",
    client: "Salt Schweiz AG - Brand Awareness Q1 2026",
    approved: "Freigegeben: 28.02.2026",
    amount: "CHF 6'500",
  },
];

const INCOMING_CHECK = [
  {
    id: "1",
    ref: "RE-META-2026-9999",
    context: "Instagram Stories Kampagne",
    expected: "Erwartet: CHF 15'000",
    invoice: "CHF 15'500",
    diff: "Differenz: CHF 500",
    tag: "Zu prüfen",
  },
  {
    id: "2",
    ref: "RE-GOOGLE-2026-7777",
    context: "YouTube Pre-Roll",
    expected: "Erwartet: CHF 20'000",
    invoice: "CHF 22'000",
    diff: "Differenz: CHF 2'000",
    tag: "Reklamation",
  },
];

export default function FinanzenPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Finanzzentrale
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Verwaltung von Ausgangs- und Eingangsrechnungen, Auftragsbestätigungen
        </p>
      </header>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 border-b border-zinc-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-[#FF6554] text-[#FF6554]"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
              {tab.badge != null && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={nochNichtImplementiert}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            DATEV Export
          </button>
          <button
            type="button"
            onClick={nochNichtImplementiert}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Excel Export
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_CARDS.map((kpi) => (
              <div
                key={kpi.label}
                className="haupt-box border border-zinc-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {kpi.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {kpi.value}
                    </p>
                    {(kpi.amount ?? kpi.sub) != null && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {kpi.amount ? renderCurrencyPrefix(kpi.amount) : kpi.sub}
                      </p>
                    )}
                  </div>
                  <span className="text-zinc-400" aria-hidden>
                    {kpi.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="haupt-box border border-zinc-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Abrechenbare Positionen
                </h2>
                <button
                  type="button"
                  onClick={nochNichtImplementiert}
                  className="rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a]"
                >
                  + Rechnung erstellen
                </button>
              </div>
              <ul className="mt-4 space-y-4">
                {BILLABLE.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-1 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-zinc-950">{b.title}</p>
                    <p className="text-sm text-zinc-600">{b.client}</p>
                    <p className="text-xs text-zinc-500">{b.approved}</p>
                    <p className="font-semibold text-zinc-950">{renderCurrencyPrefix(b.amount)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="haupt-box border border-zinc-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Zu prüfende Eingangsrechnungen
                </h2>
                <Link
                  href="/finanzen/eingangsrechnungen"
                  className="text-sm font-medium text-[#FF6554] hover:underline"
                >
                  Alle anzeigen &gt;
                </Link>
              </div>
              <ul className="mt-4 space-y-4">
                {INCOMING_CHECK.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-1 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-zinc-950">
                      {inv.ref} - {inv.context}
                    </p>
                    <p className="text-sm text-zinc-600">{renderCurrencyPrefix(inv.expected)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-950">
                        Rechnung: {renderCurrencyPrefix(inv.invoice)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.tag === "Reklamation"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.tag}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700">⚠ {renderCurrencyPrefix(inv.diff)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      {activeTab === "ausgangsrechnungen" && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-950">
            Ausgangsrechnungen
          </h2>
          <button
            type="button"
            onClick={nochNichtImplementiert}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            + Neue Rechnung
          </button>
        </div>
      )}
    </div>
  );
}
