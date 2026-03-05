"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Kunde = {
  id: string;
  name: string;
  industry: string | null;
  status: string | null;
  activePlans: number;
  budget: number;
  openTasks: number;
  lastActivity: string | null;
};

function formatEur(n: number): string {
  return (
    new Intl.NumberFormat("de-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + " €"
  );
}

export default function KundenPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoading(true);
      setError(null);
      const [
        { data: kundenData, error: kErr },
        { data: plansData },
        { data: posData },
        { data: aufgabenData },
      ] = await Promise.all([
        supabase.from("kunden").select("id, name, industry, status").order("name"),
        supabase.from("mediaplaene").select("id, kunde_id, status"),
        supabase.from("mediaplan_positionen").select("mediaplan_id, kundenpreis"),
        supabase.from("aufgaben").select("id, client, status, mediaplan_id"),
      ]);
      if (kErr) {
        setError(kErr.message);
        setKunden([]);
        setLoading(false);
        return;
      }
      const list = kundenData ?? [];
      const plans = plansData ?? [];
      const positions = posData ?? [];
      const aufgaben = aufgabenData ?? [];

      const planByKunde: Record<string, { count: number; planIds: string[] }> = {};
      const budgetByPlan: Record<string, number> = {};
      for (const p of positions) {
        const id = p.mediaplan_id as string;
        budgetByPlan[id] = (budgetByPlan[id] ?? 0) + Number(p.kundenpreis ?? 0);
      }
      for (const m of plans) {
        const kid = (m.kunde_id as string) ?? "_none_";
        if (!planByKunde[kid]) planByKunde[kid] = { count: 0, planIds: [] };
        if (m.status === "Aktiv") planByKunde[kid].count += 1;
        planByKunde[kid].planIds.push(m.id as string);
      }

      const mediaplanToKunde: Record<string, string> = {};
      for (const m of plans) {
        if (m.kunde_id) mediaplanToKunde[m.id as string] = m.kunde_id as string;
      }
      const kundeIdsByClient: Record<string, string> = {};
      for (const k of list) {
        kundeIdsByClient[k.name] = k.id;
      }
      const openByKunde: Record<string, number> = {};
      for (const a of aufgaben) {
        if (a.status !== "Offen") continue;
        const kundeId =
          (a.mediaplan_id && mediaplanToKunde[a.mediaplan_id as string]) ??
          (a.client && kundeIdsByClient[a.client as string]);
        if (kundeId) openByKunde[kundeId] = (openByKunde[kundeId] ?? 0) + 1;
      }

      setKunden(
        list.map((k) => {
          const kid = k.id;
          const { count: activePlans, planIds } = planByKunde[kid] ?? { count: 0, planIds: [] };
          const budget = planIds.reduce((s, pid) => s + (budgetByPlan[pid] ?? 0), 0);
          return {
            id: k.id,
            name: k.name,
            industry: k.industry ?? null,
            status: k.status ?? null,
            activePlans,
            budget,
            openTasks: openByKunde[kid] ?? 0,
            lastActivity: null,
          };
        })
      );
      setLoading(false);
    }
    load();
  }, []);

  const kpiCards = useMemo(() => {
    const total = kunden.length;
    const aktiv = kunden.filter((k) => k.status === "Aktiv").length;
    const totalPlans = kunden.reduce((s, k) => s + k.activePlans, 0);
    const totalTasks = kunden.reduce((s, k) => s + k.openTasks, 0);
    const totalBudget = kunden.reduce((s, k) => s + k.budget, 0);
    return [
      { label: "Gesamt Kunden", value: String(total), sub: `${aktiv} aktiv` },
      { label: "Aktive Mediapläne", value: String(totalPlans), sub: "über alle Kunden" },
      { label: "Offene Aufgaben", value: String(totalTasks), sub: "gesamt" },
      { label: "Gesamtbudget", value: formatEur(totalBudget), sub: "aktive Kunden" },
    ];
  }, [kunden]);

  const selected = kunden.find((c) => c.id === selectedId);

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
          className="border-b-2 border-[#FF6554] pb-3 pr-4 text-sm font-medium text-[#FF6554]"
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Fehler beim Laden: {error}
        </div>
      )}

      <section className="haupt-box p-5">
        {loading ? (
          <p className="text-zinc-500">Kunden werden geladen…</p>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="content-radius border border-zinc-200 bg-white p-5"
            >
            <p className="text-xs font-medium text-zinc-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{kpi.sub}</p>
          </div>
        ))}
        </div>
        )}
      </section>

      <section className="haupt-box p-5">
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
              {kunden.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50 ${
                    selectedId === c.id ? "bg-[#FF6554]/10" : ""
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
                  <td className="px-4 py-3 text-zinc-600">{c.industry ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                      {c.activePlans}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {formatEur(c.budget)}
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
                  <td className="px-4 py-3 text-zinc-600">{c.lastActivity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === "Aktiv"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {c.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium text-[#FF6554] hover:underline"
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
        <section className="haupt-box p-6">
          <h3 className="text-lg font-semibold text-zinc-950">
            {selected.name} – Details
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Branche</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {selected.industry ?? "—"}
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
                {formatEur(selected.budget)}
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
