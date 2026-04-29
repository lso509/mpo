"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import { MediaplanPDFButton } from "@/components/MediaplanPDFButton";
import type { AenderungshistorieEntry, CatalogProduct, MediaplanRow, PositionRow } from "@/lib/mediaplan/types";
import { formatChf, formatDateRange, freigabeStatus } from "@/lib/mediaplan/utils";
import { useMediaplanData } from "@/hooks/useMediaplanData";
import { Aenderungshistorie } from "@/components/shared/Aenderungshistorie";
import { MediaplanBudgetOverview } from "@/components/mediaplan/MediaplanBudgetOverview";
import { MediaplanPageHeader } from "@/components/mediaplan/MediaplanPageHeader";
import { GanttChart } from "@/components/mediaplan/GanttChart";
import { MediaplanKundenInfo } from "@/components/mediaplan/MediaplanKundenInfo";
import { MediaplanKundenberater } from "@/components/mediaplan/MediaplanKundenberater";
import { PositionCatalogInfo } from "@/components/mediaplan/PositionCatalogInfo";
import { CollapsibleChevron } from "@/components/shared/CollapsibleChevron";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

function normalizePositionCategory(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function PositionCardKunde({
  pos,
  product,
  selected,
  onToggleSelect,
  onFreigabe,
  onAblehnung,
  formatChf,
  formatDateRange,
}: {
  pos: PositionRow;
  product: CatalogProduct | null;
  selected: boolean;
  onToggleSelect: () => void;
  onFreigabe: () => void;
  onAblehnung: () => void;
  formatChf: (n: number | null) => ReactNode;
  formatDateRange: (start: string | null, end: string | null) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = freigabeStatus(pos);

  return (
    <li className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((x) => !x);
        }}
        className="flex cursor-pointer flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 shrink-0 rounded border-0 border-none bg-zinc-100 shadow-none outline-none appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#f4f4f5_40%)]"
            aria-label="Position auswählen"
          />
          <div className="min-w-0">
            <p className="font-medium text-zinc-950 dark:text-zinc-100">{pos.title}</p>
            {pos.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{pos.description}</p>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Laufzeit: {formatDateRange(pos.start_date, pos.end_date)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {status === "Freigegeben" && (
            <span className="rounded bg-green-100 dark:bg-green-950/50 px-2 py-0.5 text-sm font-medium text-green-800 dark:text-green-200">
              Freigegeben
            </span>
          )}
          {status === "Abgelehnt" && (
            <span className="rounded bg-red-100 dark:bg-red-950/50 px-2 py-0.5 text-sm font-medium text-red-800 dark:text-red-200">
              Abgelehnt
            </span>
          )}
          {status === "Offen" && (
            <span className="rounded bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-sm font-medium text-amber-800 dark:text-amber-200">
              Offen
            </span>
          )}
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFreigabe(); }}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              title={status === "Freigegeben" ? "Erneut klicken: Status auf Offen zurücksetzen" : "Position freigeben"}
            >
              Freigeben
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAblehnung(); }}
              className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
              title={status === "Abgelehnt" ? "Erneut klicken: Status auf Offen zurücksetzen" : "Position ablehnen"}
            >
              Ablehnen
            </button>
          </div>
        </div>
        <div className="text-right text-sm shrink-0">
          {pos.brutto != null && <p className="text-zinc-500 dark:text-zinc-400">Brutto {formatChf(pos.brutto)}</p>}
          <p className="font-semibold text-zinc-950 dark:text-zinc-100">Kundenpreis {formatChf(pos.kundenpreis)}</p>
        </div>
        <CollapsibleChevron open={expanded} />
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <PositionCatalogInfo product={product} position={pos} view="customer" />
        </div>
      )}
    </li>
  );
}

export default function MediaplanKundenansichtPage() {
  const params = useParams();
  const planId = typeof params.id === "string" ? params.id : "";
  const {
    plan,
    positions,
    catalogProductMap,
    aenderungshistorie,
    loading,
    error,
    setError,
    loadPlan,
    loadPositions,
    loadAenderungshistorie,
    totalKundenpreis,
    bestaetigtSumme,
    ausstehendSumme,
    totalRabatt,
    gesamtEinmalig,
    freigabeStatus,
  } = useMediaplanData(planId);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [collapsedCampaignGroups, setCollapsedCampaignGroups] = useState<Record<string, boolean>>({});
  const { user } = useUser();
  const [editKundenInfo, setEditKundenInfo] = useState(false);
  const [savingKundenInfo, setSavingKundenInfo] = useState(false);
  const [kundenForm, setKundenForm] = useState({
    client: "",
    kunde_adresse: "",
    kunde_email: "",
    kunde_telefon: "",
    kunde_ap_name: "",
    kunde_ap_position: "",
    kunde_ap_email: "",
    kunde_ap_telefon: "",
    kunde_ap_mobil: "",
  });

  useEffect(() => {
    if (!plan) return;
    setKundenForm({
      client: plan.kunde_name ?? plan.client ?? "",
      kunde_adresse: plan.kunde_adresse ?? "",
      kunde_email: plan.kunde_email ?? "",
      kunde_telefon: plan.kunde_telefon ?? "",
      kunde_ap_name: plan.kunde_ap_name ?? "",
      kunde_ap_position: plan.kunde_ap_position ?? "",
      kunde_ap_email: plan.kunde_ap_email ?? "",
      kunde_ap_telefon: plan.kunde_ap_telefon ?? "",
      kunde_ap_mobil: plan.kunde_ap_mobil ?? "",
    });
  }, [plan?.id, plan?.kunde_name, plan?.client, plan?.kunde_adresse, plan?.kunde_email, plan?.kunde_telefon, plan?.kunde_ap_name, plan?.kunde_ap_position, plan?.kunde_ap_email, plan?.kunde_ap_telefon, plan?.kunde_ap_mobil]);

  const updatePlanKundenInfo = useCallback(async () => {
    if (!planId) return;
    setSavingKundenInfo(true);
    const supabase = createClient();
    const changedBy = user?.user_metadata?.full_name ?? user?.email ?? null;
    const { error: err } = await supabase
      .from("mediaplaene")
      .update({
        client: kundenForm.client || null,
        kunde_adresse: kundenForm.kunde_adresse || null,
        kunde_email: kundenForm.kunde_email || null,
        kunde_telefon: kundenForm.kunde_telefon || null,
        kunde_ap_name: kundenForm.kunde_ap_name || null,
        kunde_ap_position: kundenForm.kunde_ap_position || null,
        kunde_ap_email: kundenForm.kunde_ap_email || null,
        kunde_ap_telefon: kundenForm.kunde_ap_telefon || null,
        kunde_ap_mobil: kundenForm.kunde_ap_mobil || null,
      })
      .eq("id", planId);
    if (err) {
      setSavingKundenInfo(false);
      setError(err.message);
      return;
    }
    await supabase.from("mediaplan_aenderungshistorie").insert({
      mediaplan_id: planId,
      changed_by: changedBy,
      change_description: "Kundeninformationen aktualisiert",
    });
    await loadPlan();
    await loadAenderungshistorie();
    setSavingKundenInfo(false);
    setEditKundenInfo(false);
  }, [planId, kundenForm, user, loadPlan, loadAenderungshistorie]);

  const setFreigabeForPositions = useCallback(
    async (positionIds: string[], action: "freigabe" | "ablehnung") => {
      if (!planId) return;
      const supabase = createClient();
      const changedBy = user?.user_metadata?.full_name ?? user?.email ?? null;
      const actionLabel = action === "freigabe" ? "freigegeben" : "abgelehnt";
      for (const id of positionIds) {
        const pos = positions.find((p) => p.id === id);
        const currentStatus = freigabeStatus(pos ?? { prozess_status: {} } as PositionRow);
        const current = (pos?.prozess_status && typeof pos.prozess_status === "object" ? pos.prozess_status : {}) as Record<string, string>;
        let newStatus: string;
        if (action === "freigabe") {
          newStatus = currentStatus === "Freigegeben" ? "Offen" : "Freigegeben";
        } else {
          newStatus = currentStatus === "Abgelehnt" ? "Offen" : "Abgelehnt";
        }
        const updated = { ...current, "1": newStatus };
        await supabase.from("mediaplan_positionen").update({ prozess_status: updated }).eq("id", id);
        const title = pos?.title ?? "Position";
        await supabase.from("mediaplan_aenderungshistorie").insert({
          mediaplan_id: planId,
          changed_by: changedBy,
          change_description: `Position „${title}" ${actionLabel}`,
        });
      }
      await loadPositions();
      await loadAenderungshistorie();
      setSelectedPositionIds((prev) => prev.filter((id) => !positionIds.includes(id)));
    },
    [planId, positions, user, loadPositions, loadAenderungshistorie]
  );

  const setFreigabe = useCallback(
    (positionId: string) => setFreigabeForPositions([positionId], "freigabe"),
    [setFreigabeForPositions]
  );
  const setAblehnung = useCallback(
    (positionId: string) => setFreigabeForPositions([positionId], "ablehnung"),
    [setFreigabeForPositions]
  );
  const bulkFreigabe = useCallback(() => {
    if (selectedPositionIds.length === 0) return;
    setFreigabeForPositions(selectedPositionIds, "freigabe");
  }, [selectedPositionIds, setFreigabeForPositions]);
  const bulkAblehnung = useCallback(() => {
    if (selectedPositionIds.length === 0) return;
    setFreigabeForPositions(selectedPositionIds, "ablehnung");
  }, [selectedPositionIds, setFreigabeForPositions]);

  const budgetByGoal = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    for (const p of positions) {
      if (freigabeStatus(p) !== "Freigegeben") continue;
      const goal = (p.tag || p.ziel || "Sonstige").trim() || "Sonstige";
      if (!map[goal]) map[goal] = { sum: 0, count: 0 };
      map[goal].sum += p.kundenpreis ?? 0;
      map[goal].count += 1;
    }
    return Object.entries(map)
      .map(([ziel, { sum, count }]) => ({ ziel, sum, count }))
      .sort((a, b) => b.sum - a.sum);
  }, [positions]);

  const maxBudgetGoal = Math.max(1, ...budgetByGoal.map((g) => g.sum));

  const positionsByCategory = useMemo(() => {
    const groups = new Map<string, PositionRow[]>();
    for (const pos of positions) {
      const key = normalizePositionCategory(pos.position_kategorie) ?? "Ohne Kampagne";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(pos);
    }
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === "Ohne Kampagne") return 1;
      if (b === "Ohne Kampagne") return -1;
      return a.localeCompare(b, "de-CH", { sensitivity: "base" });
    });
    return sortedKeys.map((name) => ({ name, positions: groups.get(name) ?? [] }));
  }, [positions]);

  const sortedPositionsForTimeline = useMemo(
    () => positionsByCategory.flatMap((group) => group.positions),
    [positionsByCategory]
  );

  const positionenZurFreigabeCount = useMemo(
    () => positions.filter((p) => freigabeStatus(p) === "Offen").length,
    [positions]
  );

  const pdfPayload = useMemo(() => {
    if (!plan) return null;
    const ap = [plan.kunde_ap_name, plan.kunde_ap_position].filter(Boolean).join(", ");
    // Kundenberater nur anzeigen, wenn am Plan hinterlegt
    const beraterName = plan.berater_name ?? "";
    const beraterEmail = plan.berater_email ?? "";
    const hasBerater = !!(beraterName || beraterEmail);
    return {
      kunde: {
        name: plan.kunde_name ?? plan.client ?? "",
        ansprechpartner: ap || "–",
      },
      kampagne: {
        name: plan.campaign ?? "",
        vonDatum: plan.date_range_start ?? "",
        bisDatum: plan.date_range_end ?? "",
      },
      kundenberater: hasBerater
        ? {
            name: beraterName,
            position: plan.berater_position ?? undefined,
            email: beraterEmail || undefined,
            telefon: plan.berater_telefon ?? plan.berater_mobil ?? undefined,
          }
        : undefined,
      positionen: positions.map((p) => ({
        produkt: p.title || "–",
        verlag: (p.produkt_id ? catalogProductMap[p.produkt_id]?.verlag : null) ?? "–",
        zeitraum: [p.start_date, p.end_date].filter(Boolean).join(" – ") || "–",
        laufzeit: ("menge_volumen" in p ? (p as { menge_volumen?: string | null }).menge_volumen : null) ?? "–",
        nettoChf: p.kundenpreis ?? 0,
        bruttoChf: p.brutto ?? 0,
        startDate: p.start_date ?? undefined,
        endDate: p.end_date ?? undefined,
      })),
      erstelltAm: new Date().toLocaleDateString("de-CH"),
    };
  }, [plan, positions, catalogProductMap]);

  if (loading && !plan) {
    return (
      <div className="content-radius haupt-box flex min-h-[200px] items-center justify-center p-8">
        <p className="text-zinc-500 dark:text-zinc-400">Mediaplan wird geladen…</p>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <>
        <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          Fehler: {error}
        </div>
        <Link href="/mediaplaene" className="text-sm text-[#FF6554] hover:underline">
          ← Zurück zu Mediapläne
        </Link>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <p className="mb-4 text-zinc-500 dark:text-zinc-400">Mediaplan nicht gefunden.</p>
        <Link href="/mediaplaene" className="text-sm text-[#FF6554] hover:underline">
          ← Zurück zu Mediapläne
        </Link>
      </>
    );
  }

  return (
    <>
      <MediaplanPageHeader plan={plan} titlePrefix="Kundenansicht – " />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <MediaplanPDFButton
          payload={pdfPayload}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-60"
        />
      </div>

      {positionenZurFreigabeCount > 0 && (
        <div className="content-radius mb-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden>
              <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
            </svg>
            Neue Positionen zur Freigabe ({positionenZurFreigabeCount})
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            {positionenZurFreigabeCount === 1
              ? "Es wurde 1 neue Position zu diesem Mediaplan hinzugefügt. Bitte prüfen Sie diese und erteilen Sie Ihre Freigabe."
              : `Es wurden ${positionenZurFreigabeCount} neue Positionen zu diesem Mediaplan hinzugefügt. Bitte prüfen Sie diese und erteilen Sie Ihre Freigabe.`}
          </p>
        </div>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <MediaplanKundenInfo
          plan={plan}
          mode="kunde"
          editing={editKundenInfo}
          form={kundenForm}
          onStartEdit={() => setEditKundenInfo(true)}
          onSave={() => updatePlanKundenInfo()}
          onCancel={() => setEditKundenInfo(false)}
          onFormChange={(field, value) => setKundenForm((f) => ({ ...f, [field]: value }))}
          saving={savingKundenInfo}
        />
        <MediaplanKundenberater plan={plan} readOnly />
      </div>

      <div className="content-radius haupt-box space-y-4 border border-zinc-200 dark:border-zinc-700 p-4 shadow-none sm:p-5">
        <div className="pl-4 sm:pl-5">
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Zeitplan – Übersicht
          </h2>
          <section className="-ml-4 sm:-ml-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
            <GanttChart plan={plan} positions={sortedPositionsForTimeline} />
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
              Positionen ({positions.length})
            </h2>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={positions.length > 0 && selectedPositionIds.length === positions.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedPositionIds(positions.map((p) => p.id));
                    else setSelectedPositionIds([]);
                  }}
                  className="h-4 w-4 rounded border-0 border-none bg-zinc-100 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#f4f4f5_40%)]"
                  aria-label="Alle auswählen"
                />
                <span>Alle auswählen</span>
              </label>
              {selectedPositionIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={bulkFreigabe}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Freigeben ({selectedPositionIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={bulkAblehnung}
                    className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Ablehnen ({selectedPositionIds.length})
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {positionsByCategory.map((group) => (
              <div key={group.name}>
                <button
                  type="button"
                  className="mb-1.5 inline-flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200"
                  onClick={() =>
                    setCollapsedCampaignGroups((prev) => ({
                      ...prev,
                      [group.name]: !prev[group.name],
                    }))
                  }
                >
                  <div className="inline-flex min-w-0 items-center gap-2">
                    <span className="truncate">{group.name} ({group.positions.length})</span>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      · Summe {formatChf(group.positions.reduce((sum, p) => sum + (p.kundenpreis ?? 0), 0))}
                    </span>
                  </div>
                  <CollapsibleChevron open={!collapsedCampaignGroups[group.name]} />
                </button>
                {!collapsedCampaignGroups[group.name] && (
                  <ul className="space-y-1.5">
                    {group.positions.map((pos) => (
                      <PositionCardKunde
                        key={pos.id}
                        pos={pos}
                        product={pos.produkt_id ? catalogProductMap[pos.produkt_id] ?? null : null}
                        selected={selectedPositionIds.includes(pos.id)}
                        onToggleSelect={() =>
                          setSelectedPositionIds((prev) =>
                            prev.includes(pos.id) ? prev.filter((id) => id !== pos.id) : [...prev, pos.id]
                          )
                        }
                        onFreigabe={() => setFreigabe(pos.id)}
                        onAblehnung={() => setAblehnung(pos.id)}
                        formatChf={formatChf}
                        formatDateRange={formatDateRange}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaplanBudgetOverview
              bestaetigtSumme={bestaetigtSumme}
              ausstehendSumme={ausstehendSumme}
              gesamtEinmalig={gesamtEinmalig}
              totalRabatt={totalRabatt}
              summeAllePositionen={totalKundenpreis}
              maxBudgetChf={plan?.max_budget_chf ?? null}
            />
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4">
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Budget nach Ziel</h3>
              <div className="mt-3 space-y-4">
                {budgetByGoal.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine Positionen mit Ziel zugeordnet.</p>
                ) : (
                  budgetByGoal.map(({ ziel, sum, count }) => {
                    const pct = gesamtEinmalig > 0 ? (sum / gesamtEinmalig) * 100 : 0;
                    const barPct = (sum / maxBudgetGoal) * 100;
                    return (
                      <div key={ziel}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {ziel} ({count} {count === 1 ? "Position" : "Positionen"})
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {formatChf(sum)} · {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-zinc-700 dark:bg-zinc-400"
                            style={{ width: `${Math.min(100, barPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <Aenderungshistorie entries={aenderungshistorie} />
      </div>
    </>
  );
}
