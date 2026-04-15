"use client";

import {
  aggregateStats,
  buildMetaExportRows,
  buildPlzExportRows,
  downloadPlzXlsx,
  downloadTextFile,
  rowsToCsv,
} from "@/lib/tools/mapPlanner/exportHelpers";
import type { MapZone } from "@/lib/tools/mapPlanner/types";
import { MAP_ZONES, ZONE_GROUPS, zonesInGroup } from "@/lib/tools/mapPlanner/zones";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Auswahl-Rand: App-Akzent (wie Karten-Highlights im Rest der App) */
const SELECT_COLOR = "#FF6554";

function circleStyle(zone: MapZone, selected: boolean, hovered: boolean): L.PathOptions {
  const fillOpacity = selected ? 0.7 : hovered ? 0.55 : 0.4;
  const weight = selected ? 3 : hovered ? 2.5 : 2;
  const color = selected ? SELECT_COLOR : zone.color;
  return {
    color,
    fillColor: zone.color,
    fillOpacity,
    weight,
    opacity: 1,
  };
}

export default function MapPlannerMapTool() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const mapElRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());

  const selectedZones = useMemo(
    () => MAP_ZONES.filter((z) => selectedIds.has(z.id)),
    [selectedIds]
  );

  const previewRows = useMemo(() => {
    const rows: { plz: string; municipality: string; canton: string }[] = [];
    for (const z of selectedZones) {
      for (const p of z.plzData) {
        rows.push({ plz: p.postal_code, municipality: p.municipality, canton: p.canton });
      }
    }
    return rows;
  }, [selectedZones]);

  const stats = useMemo(() => aggregateStats(selectedZones), [selectedZones]);

  const toggleZone = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const removeZone = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    const map = L.map(el, { scrollWheelZoom: true }).setView([47.45, 9.45], 9);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap-Mitwirkende",
      maxZoom: 19,
    }).addTo(map);

    const circles = new Map<string, L.Circle>();

    for (const zone of MAP_ZONES) {
      const circle = L.circle(zone.center, {
        radius: zone.radius,
        ...circleStyle(zone, false, false),
      }).addTo(map);

      circle.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        toggleZone(zone.id);
      });
      circle.on("mouseover", () => setHoveredId(zone.id));
      circle.on("mouseout", () => setHoveredId(null));

      circles.set(zone.id, circle);
    }
    circlesRef.current = circles;

    const bounds = L.featureGroup([...circles.values()]).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.12));
    }

    map.on("click", (e) => {
      const latlng = e.latlng;
      let best: { id: string; d: number } | null = null;
      for (const z of MAP_ZONES) {
        const center = L.latLng(z.center[0], z.center[1]);
        const d = latlng.distanceTo(center);
        if (d <= z.radius && (!best || d < best.d)) {
          best = { id: z.id, d };
        }
      }
      if (best) {
        setSelectedIds((prev) => {
          const n = new Set(prev);
          if (n.has(best!.id)) n.delete(best!.id);
          else n.add(best!.id);
          return n;
        });
      }
    });

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      circlesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Karte einmal mounten; Styles separat
  }, [toggleZone]);

  useEffect(() => {
    if (circlesRef.current.size === 0) return;
    circlesRef.current.forEach((circle, id) => {
      const zone = MAP_ZONES.find((z) => z.id === id);
      if (!zone) return;
      const selected = selectedIds.has(id);
      const hovered = hoveredId === id;
      circle.setStyle(circleStyle(zone, selected, hovered));
    });
  }, [selectedIds, hoveredId]);

  const handleExportPlzCsv = () => {
    if (selectedZones.length === 0) return;
    const rows = buildPlzExportRows(selectedZones);
    const headers = ["zone_name", "postal_code", "municipality", "canton", "country"];
    const csv = rowsToCsv(
      headers,
      rows.map((r) => ({
        zone_name: r.zone_name,
        postal_code: r.postal_code,
        municipality: r.municipality,
        canton: r.canton,
        country: r.country,
      }))
    );
    downloadTextFile("werbezonen-plz.csv", csv, "text/csv;charset=utf-8");
  };

  const handleExportExcel = () => {
    if (selectedZones.length === 0) return;
    downloadPlzXlsx("werbezonen.xlsx", buildPlzExportRows(selectedZones));
  };

  const handleExportMetaCsv = () => {
    if (selectedZones.length === 0) return;
    const rows = buildMetaExportRows(selectedZones);
    const headers = ["municipality", "postal_code", "canton", "country"];
    const csv = rowsToCsv(
      headers,
      rows.map((r) => ({
        municipality: r.municipality,
        postal_code: r.postal_code,
        canton: r.canton,
        country: r.country,
      }))
    );
    downloadTextFile("meta-orte.csv", csv, "text/csv;charset=utf-8");
  };

  const exportDisabled = selectedZones.length === 0;

  return (
    <div className="flex min-h-0 flex-col gap-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Map Planner</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Werbezonen wählen, auf der Karte anzeigen und als CSV oder Excel exportieren.
        </p>
      </header>

      <div className="flex min-h-[min(85vh,900px)] flex-1 flex-col gap-5 lg:flex-row lg:items-stretch">
        <aside className="content-radius haupt-box flex w-full shrink-0 flex-col gap-6 overflow-y-auto border border-zinc-200 p-4 shadow-sm dark:border-zinc-700 sm:p-5 lg:w-[320px]">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Werbezonen</h2>
            <div className="space-y-5">
              {ZONE_GROUPS.map((g, gi) => (
                <div
                  key={g.id}
                  className={gi > 0 ? "border-t border-zinc-200 pt-5 dark:border-zinc-600" : ""}
                >
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {g.label}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {zonesInGroup(g.id).map((z) => {
                      const on = selectedIds.has(z.id);
                      return (
                        <li key={z.id}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleZone(z.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                              on
                                ? "border-[#FF6554] bg-[var(--accent-muted)] text-zinc-900 shadow-sm dark:text-zinc-100"
                                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs leading-none ${
                                on
                                  ? "border-[#FF6554] bg-[#FF6554] text-white"
                                  : "border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-800"
                              }`}
                              aria-hidden
                            >
                              {on ? "✓" : ""}
                            </span>
                            <span className="min-w-0 flex-1">{z.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-zinc-200 pt-5 dark:border-zinc-600">
            <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Ausgewählte Zonen</h2>
            {selectedZones.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
                Keine Zone ausgewählt. Tippe auf die Karte oder wähle oben Zonen aus.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedZones.map((z) => (
                    <span
                      key={z.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6554]/35 bg-[var(--accent-muted)] px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-100"
                    >
                      {z.name}
                      <button
                        type="button"
                        className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-600 transition hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
                        aria-label={`${z.name} entfernen`}
                        onClick={() => removeZone(z.id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <dl className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-[var(--haupt-box-bg)] px-3 py-2.5 dark:border-zinc-600">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total PLZ</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {stats.totalPlz}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-[var(--haupt-box-bg)] px-3 py-2.5 dark:border-zinc-600">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Gemeinden</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {stats.totalGemeinden}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Postleitzahlen
                  </p>
                  <ul className="max-h-[200px] space-y-0.5 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-900/90">
                    {previewRows.map((r, i) => (
                      <li
                        key={`${r.plz}-${r.municipality}-${i}`}
                        className="flex justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-700 odd:bg-zinc-50/80 dark:text-zinc-300 dark:odd:bg-zinc-800/50"
                      >
                        <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{r.plz}</span>
                        <span className="min-w-0 flex-1 truncate">{r.municipality}</span>
                        <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">{r.canton}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>

          <section className="flex flex-col gap-2.5 border-t border-zinc-200 pt-5 dark:border-zinc-600">
            <button
              type="button"
              disabled={exportDisabled}
              onClick={handleExportPlzCsv}
              className="inline-flex items-center justify-center rounded-full bg-[#FF6554] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e55a4a] disabled:opacity-50"
            >
              PLZ CSV herunterladen
            </button>
            <button
              type="button"
              disabled={exportDisabled}
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            >
              Excel herunterladen
            </button>
            <button
              type="button"
              disabled={exportDisabled}
              onClick={handleExportMetaCsv}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            >
              Meta Orte CSV
            </button>
          </section>
        </aside>

        <div
          ref={mapElRef}
          className="content-radius min-h-[420px] flex-1 overflow-hidden border border-zinc-200 bg-[var(--haupt-box-bg)] shadow-sm dark:border-zinc-700 dark:bg-zinc-800/40 lg:min-h-0"
        />
      </div>
    </div>
  );
}
