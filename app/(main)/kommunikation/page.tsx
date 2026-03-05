"use client";

import { useState } from "react";
import { nochNichtImplementiert } from "@/lib/not-implemented";

const STATUS_BADGES = [
  { id: "ungelesen", label: "Ungelesen", count: 2 },
  { id: "aktion", label: "Aktion erforderlich", count: 4 },
  { id: "dringend", label: "Dringend", count: 1 },
];

const FILTER_TABS = ["Alle", "Ungelesen", "Aktion erforderlich"];

const FEED_ITEMS = [
  {
    id: "1",
    type: "FREIGABE ABGELEHNT",
    typeStyle: "red",
    badges: ["DRINGEND", "Aktion erforderlich"],
    title: "Budget überschreitet Vorgabe",
    from: "Thomas Müller (Salt Schweiz)",
    context: "Frühlingsaktion 2026 - Display Banner - Homepage Leaderboard",
    description:
      "The budget of 62,500 CHF significantly exceeds our internal target. Can you reduce it to a maximum of 50,000 CHF? Perhaps by adjusting the quantity or a higher discount?",
    details: "Aktueller Preis: 625 CHF · Vorgeschlagen: 500 CHF · Status: abgelehnt",
    time: "vor 19 Std",
    comments: 2,
  },
  {
    id: "2",
    type: "KUNDENFRAGE",
    typeStyle: "blue",
    badges: ["Aktion erforderlich"],
    title: "Reporting-Zeitplan",
    from: "Sarah Weber (UBS)",
    context: "Sommerkampagne 2026 - Native Article - Sponsored Content",
    description:
      "When can we expect the first report for the Native Article Campaign? Do you need any additional information from our side?",
    details: "Status: Online Reporting: Offen",
    time: "vor 22 Std",
  },
  {
    id: "3",
    type: "FREIGABE ANGEFORDERT",
    typeStyle: "blue",
    badges: ["Aktion erforderlich"],
    title: "Neue Position zur Freigabe",
    from: "Sie (Agentur) - UBS",
    context: "Sommerkampagne 2026 - Instagram Stories - Werbeanzeige",
    description:
      'We have added a new "Instagram Stories - Advertisement" position. Budget: 36,000 CHF. Please review and approve.',
    details: "Aktueller Preis: 360 CHF · Status: Freigabe ausstehend",
    time: "vor 1 Tag",
  },
  {
    id: "4",
    type: "FREIGABE BESTÄTIGT",
    typeStyle: "green",
    badges: [],
    title: "Position bestätigt",
    from: "Michael Schmid (Swisscom)",
    context: "Q1 Digital Push - Video Pre-Roll - 30 Sekunden",
    description:
      "Position has been reviewed and approved. You can start with the implementation. Please provide the Creative by March 10th at the latest.",
    details: "Status: bestätigt",
    time: "vor 2 Tagen",
  },
];

export default function KommunikationPage() {
  const [filter, setFilter] = useState("Alle");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Kommunikation
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Zentrale Übersicht aller Kundenkommunikation und Benachrichtigungen
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        {STATUS_BADGES.map((s) => (
          <span
            key={s.id}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            {s.count} {s.label}
          </span>
        ))}
      </div>

      <input
        type="search"
        placeholder="Suche in Nachrichten, Kunden, Mediaplänen..."
        className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Filter &gt;
        </button>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filter === tab
                ? "bg-[#FF6554]/15 text-[#FF6554]"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {FEED_ITEMS.map((item) => (
          <li
            key={item.id}
            className="content-radius border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  item.typeStyle === "red"
                    ? "bg-red-100 text-red-800"
                    : item.typeStyle === "green"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {item.type}
              </span>
              {item.badges.map((b) => (
                <span
                  key={b}
                  className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                >
                  {b}
                </span>
              ))}
            </div>
            <h3 className="mt-3 font-semibold text-zinc-950">{item.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {item.from} · {item.context}
            </p>
            <p className="mt-2 text-sm text-zinc-700">{item.description}</p>
            <p className="mt-2 text-xs text-zinc-500">{item.details}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>{item.time}</span>
              {item.comments != null && (
                <span className="flex items-center gap-1">💬 {item.comments}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
