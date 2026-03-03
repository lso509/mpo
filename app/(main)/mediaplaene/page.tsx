"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TABS = [
  { id: "all", label: "Alle" },
  { id: "aktiv", label: "Aktiv" },
  { id: "entwurf", label: "Entwürfe" },
  { id: "abgeschlossen", label: "Abgeschlossen" },
  { id: "archiviert", label: "Archiviert" },
] as const;

type Mediaplan = {
  id: string;
  client: string;
  status: string;
  campaign: string;
  date_range_start: string | null;
  date_range_end: string | null;
  positionsCount: number;
  totalKundenpreis: number;
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  if (!start) return end ? fmt(end) : "—";
  if (!end) return fmt(start);
  return `${fmt(start)} - ${fmt(end)}`;
}

function formatChf(n: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " CHF";
}

export default function MediaplaenePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [plans, setPlans] = useState<Mediaplan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoading(true);
      setError(null);
      const { data: plansData, error: plansErr } = await supabase
        .from("mediaplaene")
        .select("id, client, status, campaign, date_range_start, date_range_end")
        .order("created_at", { ascending: false });

      if (plansErr) {
        setError(plansErr.message);
        setPlans([]);
        setLoading(false);
        return;
      }

      const planList = plansData ?? [];
      if (planList.length === 0) {
        setPlans([]);
        setLoading(false);
        return;
      }

      const { data: posData, error: posErr } = await supabase
        .from("mediaplan_positionen")
        .select("mediaplan_id, kundenpreis");

      if (posErr) {
        setError(posErr.message);
        setPlans([]);
        setLoading(false);
        return;
      }

      const byPlan: Record<string, { count: number; sum: number }> = {};
      for (const p of posData ?? []) {
        const id = p.mediaplan_id as string;
        if (!byPlan[id]) byPlan[id] = { count: 0, sum: 0 };
        byPlan[id].count += 1;
        byPlan[id].sum += Number(p.kundenpreis ?? 0);
      }

      setPlans(
        planList.map((row) => ({
          id: row.id,
          client: row.client ?? "",
          status: row.status ?? "Entwurf",
          campaign: row.campaign ?? "",
          date_range_start: row.date_range_start ?? null,
          date_range_end: row.date_range_end ?? null,
          positionsCount: byPlan[row.id]?.count ?? 0,
          totalKundenpreis: byPlan[row.id]?.sum ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "all") return plans;
    return plans.filter((p) => p.status.toLowerCase() === activeTab);
  }, [plans, activeTab]);

  const tabCounts = useMemo(() => {
    const counts = { all: plans.length, aktiv: 0, entwurf: 0, abgeschlossen: 0, archiviert: 0 };
    for (const p of plans) {
      const k = p.status.toLowerCase() as keyof typeof counts;
      if (k in counts && k !== "all") (counts as Record<string, number>)[k]++;
    }
    return counts;
  }, [plans]);

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
            {tab.id === "all"
              ? `${tab.label} (${tabCounts.all})`
              : `${tab.label} (${tabCounts[tab.id as keyof typeof tabCounts] ?? 0})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Fehler beim Laden: {error}
        </div>
      )}

      <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-5">
        {loading ? (
          <p className="text-zinc-500">Mediapläne werden geladen…</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((plan) => (
              <article
                key={plan.id}
                className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-950">
                      {plan.client}
                    </span>
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
                    📅{" "}
                    {formatDateRange(
                      plan.date_range_start,
                      plan.date_range_end
                    )}{" "}
                    · {plan.positionsCount} Positionen
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="text-right text-sm">
                    <p className="font-semibold text-zinc-950">
                      Gesamtsumme {formatChf(plan.totalKundenpreis)}
                    </p>
                    <p className="text-zinc-500">Agentur-Marge —</p>
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
            {filtered.length === 0 && (
              <p className="text-zinc-500">
                Keine Mediapläne in dieser Kategorie.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
