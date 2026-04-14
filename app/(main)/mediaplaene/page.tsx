"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["Aktiv", "Entwurf", "Abgeschlossen"] as const;

type Mediaplan = {
  id: string;
  client: string;
  kunde_id: string | null;
  kunde_name: string | null;
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

function toggleFilter(
  setter: React.Dispatch<React.SetStateAction<string[]>>,
  value: string
) {
  setter((prev) =>
    prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
  );
}

export default function MediaplaenePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showArchived = searchParams.get("tab") === "archiv";
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [plans, setPlans] = useState<Mediaplan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { data: plansData, error: plansErr } = await supabase
      .from("mediaplaene")
      .select("id, client, kunde_id, status, campaign, date_range_start, date_range_end")
      .order("created_at", { ascending: false });

    if (plansErr) {
      setError(plansErr.message);
      setPlans([]);
      setLoading(false);
      return;
    }

    const planList = plansData ?? [];
    let kundenMap: Record<string, string> = {};
    if (planList.length > 0) {
      const kundeIds = [...new Set((planList.map((p) => (p as { kunde_id?: string }).kunde_id).filter(Boolean) as string[]))];
      if (kundeIds.length > 0) {
        const { data: kundenData } = await supabase.from("kunden").select("id, name").in("id", kundeIds);
        kundenMap = Object.fromEntries((kundenData ?? []).map((k) => [k.id, k.name]));
      }
    }
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
      planList.map((row) => {
        const r = row as { kunde_id?: string };
        return {
          id: row.id,
          client: row.client ?? "",
          kunde_id: r.kunde_id ?? null,
          kunde_name: r.kunde_id ? (kundenMap[r.kunde_id] ?? null) : null,
          status: row.status ?? "Entwurf",
          campaign: row.campaign ?? "",
          date_range_start: row.date_range_start ?? null,
          date_range_end: row.date_range_end ?? null,
          positionsCount: byPlan[row.id]?.count ?? 0,
          totalKundenpreis: byPlan[row.id]?.sum ?? 0,
        };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleArchivieren = useCallback(async (id: string) => {
    setOpenMenuId(null);
    const supabase = createClient();
    const { error: updErr } = await supabase.from("mediaplaene").update({ status: "Archiviert" }).eq("id", id);
    if (!updErr) await loadPlans();
  }, [loadPlans]);

  const handleWiederherstellen = useCallback(async (id: string) => {
    setOpenMenuId(null);
    const supabase = createClient();
    const { error: updErr } = await supabase.from("mediaplaene").update({ status: "Entwurf" }).eq("id", id);
    if (!updErr) await loadPlans();
  }, [loadPlans]);

  const handleDuplizieren = useCallback(async (plan: Mediaplan) => {
    setOpenMenuId(null);
    const supabase = createClient();
    const { data: newPlan, error: insErr } = await supabase
      .from("mediaplaene")
      .insert({
        client: plan.client,
        kunde_id: plan.kunde_id,
        status: "Entwurf",
        campaign: plan.campaign ? `Kopie: ${plan.campaign}` : "Kopie",
        date_range_start: plan.date_range_start,
        date_range_end: plan.date_range_end,
      })
      .select("id")
      .single();
    if (insErr || !newPlan) return;
    const { data: positions } = await supabase.from("mediaplan_positionen").select("*").eq("mediaplan_id", plan.id);
    if (positions?.length) {
      await supabase.from("mediaplan_positionen").insert(
        positions.map(({ id: _id, created_at: _ca, mediaplan_id, ...rest }) => ({ ...rest, mediaplan_id: newPlan.id }))
      );
    }
    await loadPlans();
    router.push(`/mediaplaene/${newPlan.id}`);
  }, [loadPlans, router]);

  const handleLöschen = useCallback((id: string) => {
    setOpenMenuId(null);
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return;
    const supabase = createClient();
    const { error: delErr } = await supabase.from("mediaplaene").delete().eq("id", deleteConfirmId);
    setDeleteConfirmId(null);
    if (!delErr) await loadPlans();
  }, [deleteConfirmId, loadPlans]);

  const visiblePlans = useMemo(() => {
    const byTab = showArchived
      ? plans.filter((p) => p.status === "Archiviert")
      : plans.filter((p) => p.status !== "Archiviert");
    const byStatus =
      showArchived || filterStatuses.length === 0
        ? byTab
        : byTab.filter((p) => filterStatuses.includes(p.status));
    if (!searchQuery) return byStatus;
    return byStatus.filter((p) => {
      const client = (p.client ?? "").toLowerCase();
      const campaign = (p.campaign ?? "").toLowerCase();
      const kunde = (p.kunde_name ?? "").toLowerCase();
      const status = (p.status ?? "").toLowerCase();
      return (
        client.includes(searchQuery) ||
        campaign.includes(searchQuery) ||
        kunde.includes(searchQuery) ||
        status.includes(searchQuery)
      );
    });
  }, [plans, showArchived, filterStatuses, searchQuery]);

  return (
    <div className="flex gap-6 p-6">
      {!showArchived && (
        <aside className="w-64 shrink-0 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Filter</h3>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Status</p>
            <ul className="space-y-1.5">
              {STATUS_OPTIONS.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`status-${s}`}
                    checked={filterStatuses.includes(s)}
                    onChange={() => toggleFilter(setFilterStatuses, s)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`status-${s}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {s}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              {showArchived ? "Archiv" : "Mediapläne"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {loading ? "Laden…" : `${visiblePlans.length} Mediapläne`}
            </p>
          </header>
          {!showArchived && (
            <Link
              href="/mediaplaene/neu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Neuer Mediaplan
            </Link>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
            Fehler beim Laden: {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-zinc-500 dark:text-zinc-400">Mediapläne werden geladen…</p>
        ) : (
          <div className="mt-6 space-y-4">
            {visiblePlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/mediaplaene/${plan.id}`}
                className="content-radius flex flex-col gap-4 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-5 sm:flex-row sm:items-center sm:justify-between block cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/80"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                      {plan.kunde_name ?? plan.client}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status === "Aktiv"
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {plan.campaign}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateRange(
                      plan.date_range_start,
                      plan.date_range_end
                    )}{" "}
                    · {plan.positionsCount} Positionen
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="text-right text-sm">
                    <p className="font-semibold text-zinc-950 dark:text-zinc-100">
                      Gesamtsumme {formatChf(plan.totalKundenpreis)}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400">Agentur-Marge —</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === plan.id ? null : plan.id));
                        }}
                        className="rounded-full border border-zinc-200 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                        title="Menü"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === plan.id && (
                        <div
                          className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {plan.status === "Archiviert" ? (
                            <button
                              type="button"
                              onClick={() => handleWiederherstellen(plan.id)}
                              className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            >
                              Mediaplan wiederherstellen
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleArchivieren(plan.id)}
                              className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            >
                              Mediaplan archivieren
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDuplizieren(plan)}
                            className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          >
                            Duplizieren
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLöschen(plan.id)}
                            className="block w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {visiblePlans.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400">
              {showArchived
                ? "Keine archivierten Mediapläne."
                : "Keine Mediapläne vorhanden. Über «Neuer Mediaplan» anlegen."}
            </p>
          )}
          </div>
        )}
      </div>

      {deleteConfirmId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="content-radius w-full max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Mediaplan wirklich löschen?</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
