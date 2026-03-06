"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import { MediaplanPDFButton } from "@/components/MediaplanPDFButton";
import type { AenderungshistorieEntry, CatalogProduct, MediaplanRow, PositionRow } from "@/lib/mediaplan/types";
import { beraterInitials, formatChf, formatDateRange, freigabeStatus } from "@/lib/mediaplan/utils";
import { useMediaplanData } from "@/hooks/useMediaplanData";
import { Aenderungshistorie } from "@/components/shared/Aenderungshistorie";
import { MediaplanBudgetOverview } from "@/components/mediaplan/MediaplanBudgetOverview";
import { MediaplanPageHeader } from "@/components/mediaplan/MediaplanPageHeader";
import { GanttChart } from "@/components/mediaplan/GanttChart";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AgencyUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

/** Farbe für Prozessschritt 1–10: Verlauf von Hellrot (1) bis Hellgrün (10) */
/** Verlauf Schritt 1 (Hellrot) → 10 (Hellgrün) in Projektfarben: Akzent-Koral + Grün (green-100). */
function prozessSchrittFarbe(stepIndex1Based: number): { bg: string; bgDark: string } {
  const t = Math.max(0, Math.min(1, (stepIndex1Based - 1) / 9));
  // Light: Hellrot = Aufhellung der Akzentfarbe #FF6554 → #ffddd8; Hellgrün = green-100 #dcfce7
  const r = Math.round(255 - 35 * t);
  const g = Math.round(221 + 31 * t);
  const b = Math.round(216 + 15 * t);
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  // Dark: dunkle Töne passend zu --haupt-box-bg #27272a
  const rDark = Math.round(74 - 48 * t);
  const gDark = Math.round(40 + 6 * t);
  const bDark = Math.round(37 - 6 * t);
  const hexDark = `#${rDark.toString(16).padStart(2, "0")}${gDark.toString(16).padStart(2, "0")}${bDark.toString(16).padStart(2, "0")}`;
  return { bg: hex, bgDark: hexDark };
}

const PROZESS_SCHRITTE: { key: string; label: string }[] = [
  { key: "1", label: "Freigabestatus" },
  { key: "2", label: "Creatives vorhanden" },
  { key: "3", label: "Kampagnenbriefing" },
  { key: "4", label: "Einbuchung bei Verlag" },
  { key: "5", label: "Vorausrechnung" },
  { key: "6", label: "Creatives geschickt" },
  { key: "7", label: "Kampagnensetup" },
  { key: "8", label: "Online Reporting" },
  { key: "9", label: "Reporting geschickt" },
  { key: "10", label: "Eingangsrechnung" },
];

type ProductRow = {
  id: string;
  produktvariante_titel: string | null;
  name: string | null;
  platzierung: string | null;
  zusatzinformationen: string | null;
  ziel_eignung: string | null;
  preis_brutto_chf: number | null;
  preis_netto_chf: number | null;
  category: string | null;
};

const COMMENTS = [
  { author: "Sarah Müller", date: "21.02.2026, 14:30", text: "Kunde hat die Budgeterhöhung für Q2 bestätigt." },
  { author: "Thomas Weber", date: "20.02.2026, 10:15", text: "Video-Creatives sind vom Kunden freigegeben worden." },
];

function formatDateInput(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type KundendetailsPayload = {
  kampagnenname?: string | null;
  ziel?: string | null;
  creative_verantwortung?: string | null;
  agentur?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  creative_deadline?: string | null;
  menge_volumen?: string | null;
  anzahl_einheiten?: number | null;
  werberadius?: string | null;
  zielgruppeninformationen?: string | null;
  zusatzinformationen_kunde?: string | null;
  brutto?: number | null;
  discount_text?: string | null;
  rabatt_prozent?: number | null;
  rabatt_agentur_prozent?: number | null;
  agenturgebuehr?: number | null;
  kundenpreis?: number | null;
};

function PositionListItem({
  pos,
  plan,
  product,
  formatChf,
  formatDateRange,
  formatDateInput,
  selected,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onUpdateDates,
  onUpdateDetails,
  onUpdateProzessStatus,
}: {
  pos: PositionRow;
  plan: MediaplanRow | null;
  product: CatalogProduct | null;
  selected: boolean;
  onToggleSelect: () => void;
  formatChf: (n: number | null) => string;
  formatDateRange: (start: string | null, end: string | null) => string;
  formatDateInput: (v: string | null) => string;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateDates: (d: { start_date?: string | null; end_date?: string | null; creative_deadline?: string | null }) => void;
  onUpdateDetails: (payload: KundendetailsPayload) => void | Promise<void>;
  onUpdateProzessStatus: (payload: Record<string, string>) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [editDetails, setEditDetails] = useState(false);
  const [prozessCollapsed, setProzessCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localProzessStatus, setLocalProzessStatus] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    kampagnenname: pos.kampagnenname ?? plan?.campaign ?? "",
    ziel: pos.ziel ?? pos.tag ?? "",
    creative_verantwortung: pos.creative_verantwortung ?? "",
    agentur: pos.agentur ?? "",
    start_date: formatDateInput(pos.start_date),
    end_date: formatDateInput(pos.end_date),
    creative_deadline: formatDateInput(pos.creative_deadline),
    menge_volumen: pos.menge_volumen ?? "",
    anzahl_einheiten: pos.anzahl_einheiten != null ? String(pos.anzahl_einheiten) : "",
    werberadius: pos.werberadius ?? "",
    zielgruppeninformationen: pos.zielgruppeninformationen ?? "",
    zusatzinformationen_kunde: pos.zusatzinformationen_kunde ?? pos.description ?? "",
    brutto: pos.brutto != null ? String(pos.brutto) : "",
    discount_text: pos.discount_text ?? "",
    rabatt_prozent: pos.rabatt_prozent != null ? String(pos.rabatt_prozent) : "",
    rabatt_agentur_prozent: pos.rabatt_agentur_prozent != null ? String(pos.rabatt_agentur_prozent) : "",
    agenturgebuehr: pos.agenturgebuehr != null ? String(pos.agenturgebuehr) : "",
    kundenpreis: pos.kundenpreis != null ? String(pos.kundenpreis) : "",
  });

  useEffect(() => {
    setForm({
      kampagnenname: pos.kampagnenname ?? plan?.campaign ?? "",
      ziel: pos.ziel ?? pos.tag ?? "",
      creative_verantwortung: pos.creative_verantwortung ?? "",
      agentur: pos.agentur ?? "",
      start_date: formatDateInput(pos.start_date),
      end_date: formatDateInput(pos.end_date),
      creative_deadline: formatDateInput(pos.creative_deadline),
      menge_volumen: pos.menge_volumen ?? "",
      anzahl_einheiten: pos.anzahl_einheiten != null ? String(pos.anzahl_einheiten) : "",
      werberadius: pos.werberadius ?? "",
      zielgruppeninformationen: pos.zielgruppeninformationen ?? "",
      zusatzinformationen_kunde: pos.zusatzinformationen_kunde ?? pos.description ?? "",
      brutto: pos.brutto != null ? String(pos.brutto) : "",
      discount_text: pos.discount_text ?? "",
      rabatt_prozent: pos.rabatt_prozent != null ? String(pos.rabatt_prozent) : "",
      rabatt_agentur_prozent: pos.rabatt_agentur_prozent != null ? String(pos.rabatt_agentur_prozent) : "",
      agenturgebuehr: pos.agenturgebuehr != null ? String(pos.agenturgebuehr) : "",
      kundenpreis: pos.kundenpreis != null ? String(pos.kundenpreis) : "",
    });
  }, [pos.id, pos.kampagnenname, pos.ziel, pos.creative_verantwortung, pos.agentur, pos.start_date, pos.end_date, pos.creative_deadline, pos.menge_volumen, pos.anzahl_einheiten, pos.werberadius, pos.zielgruppeninformationen, pos.zusatzinformationen_kunde, pos.description, pos.brutto, pos.discount_text, pos.rabatt_prozent, pos.rabatt_agentur_prozent, pos.agenturgebuehr, pos.kundenpreis, plan?.campaign, pos.tag, formatDateInput]);

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const prozessStatusFromPos: Record<string, string> =
    typeof pos.prozess_status === "object" && pos.prozess_status !== null
      ? Object.fromEntries(
          Object.entries(pos.prozess_status).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string"
          )
        )
      : {};

  useEffect(() => {
    setLocalProzessStatus(prozessStatusFromPos);
  }, [pos.id, JSON.stringify(prozessStatusFromPos)]);

  const prozessStatus = localProzessStatus;
  const nextProzessStatus = (stepKey: string, current: string) => {
    const order =
      stepKey === "1"
        ? (["Offen", "Freigegeben", "Erledigt", "N/A"] as const)
        : (["Offen", "Erledigt", "N/A"] as const);
    const idx = (order as readonly string[]).indexOf(current);
    if (idx === -1) return order[0];
    return order[(idx + 1) % order.length];
  };
  const getProzessStatus = (stepKey: string) => prozessStatus[stepKey] || "Offen";
  const aktuellerOffenerSchritt = PROZESS_SCHRITTE.find((s) => getProzessStatus(s.key) === "Offen");
  const prozessDoneCount = PROZESS_SCHRITTE.filter(
    (s) =>
      getProzessStatus(s.key) === "Erledigt" || getProzessStatus(s.key) === "Freigegeben"
  ).length;

  const handleProzessStepClick = (stepKey: string) => {
    const current = getProzessStatus(stepKey);
    const next = nextProzessStatus(stepKey, current);
    const payload: Record<string, string> = { ...prozessStatus, [stepKey]: next };
    setLocalProzessStatus(payload);
    if (typeof onUpdateProzessStatus === "function") {
      const result = onUpdateProzessStatus(payload);
      if (result != null && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch(() => {});
      }
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    const num = (v: string) => {
      if (v === "") return null;
      const n = Number(v.replace(/\s/g, "").replace(/'/g, "").replace(",", "."));
      return Number.isNaN(n) ? null : n;
    };
    await onUpdateDetails({
      kampagnenname: form.kampagnenname || null,
      ziel: form.ziel || null,
      creative_verantwortung: form.creative_verantwortung || null,
      agentur: form.agentur || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      creative_deadline: form.creative_deadline || null,
      menge_volumen: form.menge_volumen || null,
      anzahl_einheiten: num(form.anzahl_einheiten),
      werberadius: form.werberadius || null,
      zielgruppeninformationen: form.zielgruppeninformationen || null,
      zusatzinformationen_kunde: form.zusatzinformationen_kunde || null,
      brutto: num(form.brutto),
      discount_text: form.discount_text || null,
      rabatt_prozent: num(form.rabatt_prozent),
      rabatt_agentur_prozent: num(form.rabatt_agentur_prozent),
      agenturgebuehr: num(form.agenturgebuehr),
      kundenpreis: num(form.kundenpreis),
    });
    setSaving(false);
    setEditDetails(false);
  };

  return (
    <li className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
      {/* Aufklappbare Kopfzeile */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setMenuOpen(false);
          setMenuPosition(null);
          setExpanded((e) => !e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setMenuOpen(false);
            setMenuPosition(null);
            setExpanded((x) => !x);
          }
        }}
        className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
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
          />
          <div className="min-w-0">
            <p className="font-medium text-zinc-950 dark:text-zinc-100">{pos.title}</p>
            {pos.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{pos.description}</p>
            )}
            {pos.tag && (
              <span className="mt-1 inline-block rounded bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-200">
                {pos.tag}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-nowrap">
          {aktuellerOffenerSchritt && (() => {
            const stepNum = Number(aktuellerOffenerSchritt.key) || 1;
            const { bg, bgDark } = prozessSchrittFarbe(stepNum);
            return (
              <span
                className="rounded px-2 py-0.5 bg-[var(--offen-bg)] dark:bg-[var(--offen-bg-dark)] text-zinc-800 dark:text-zinc-200"
                style={{ "--offen-bg": bg, "--offen-bg-dark": bgDark } as React.CSSProperties}
              >
                Offen: {aktuellerOffenerSchritt.label}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right text-sm">
            {pos.brutto != null && <p className="text-zinc-500 dark:text-zinc-400">Brutto {formatChf(pos.brutto)}</p>}
            {pos.discount_text && <p className="text-zinc-500 dark:text-zinc-400">{pos.discount_text}</p>}
            <p className="font-semibold text-zinc-950 dark:text-zinc-100">
              Kundenpreis {formatChf(pos.kundenpreis)}
            </p>
          </div>
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const open = !menuOpen;
                setMenuOpen(open);
                if (open && menuButtonRef.current) {
                  const rect = menuButtonRef.current.getBoundingClientRect();
                  setMenuPosition({ top: rect.bottom + 4, left: rect.right - 160 });
                } else {
                  setMenuPosition(null);
                }
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
            {menuOpen && menuPosition &&
              createPortal(
                <div
                  className="fixed z-[100] min-w-[160px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 py-1 shadow-lg"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMenuPosition(null);
                      onDuplicate();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    Duplizieren
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMenuPosition(null);
                      onDelete();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Löschen
                  </button>
                </div>,
                document.body
              )}
          </div>
          <span
            className={`shrink-0 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* Aufgeklappter Inhalt: Prozessstatus, dann Katalog, dann Kundendetails */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          {/* Prozessstatus (über den Produktinfos) */}
          <div
            className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Prozessstatus
                </h4>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {prozessDoneCount}/{PROZESS_SCHRITTE.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProzessCollapsed((c) => !c)}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {prozessCollapsed ? "Aufklappen" : "Einklappen"}
              </button>
            </div>
            {!prozessCollapsed && (
              <>
                <ul className="space-y-1.5 text-sm">
                  {PROZESS_SCHRITTE.map(({ key, label }) => {
                    const status = getProzessStatus(key);
                    const isDone = status === "Erledigt" || status === "Freigegeben";
                    const isNa = status === "N/A";
                    const { bg, bgDark } = prozessSchrittFarbe(Number(key) || 1);
                    return (
                      <li
                        key={key}
                        onClick={() => handleProzessStepClick(key)}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:opacity-90 bg-[var(--step-bg)] dark:bg-[var(--step-bg-dark)]"
                        style={
                          {
                            "--step-bg": bg,
                            "--step-bg-dark": bgDark,
                          } as React.CSSProperties
                        }
                      >
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {key}. {label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                              isDone
                                ? "bg-zinc-900 dark:bg-zinc-100"
                                : isNa
                                  ? "bg-zinc-300 dark:bg-zinc-600"
                                  : "bg-zinc-300 dark:bg-zinc-600"
                            }`}
                            title={status}
                          />
                          <span className="min-w-[4.5rem] text-right text-xs text-zinc-600 dark:text-zinc-400">
                            {status}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Klicke auf einen Status: Offen → Erledigt → N/A
                </p>
              </>
            )}
          </div>

          {/* Produktinformationen aus Katalog (weisser Bereich) */}
          <div className="bg-white dark:bg-zinc-900/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Produktinformationen aus Katalog
              </h4>
              {product?.beispiel_bild && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Produktbild anzeigen
                </button>
              )}
            </div>
            {product ? (
              <div className="grid gap-6 sm:grid-cols-3 text-sm">
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Produkt</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Kategorie: </dt><dd className="inline">{product.category ?? product.kategorie ?? "—"}</dd></div>
                    <div><dt className="inline">Verlag: </dt><dd className="inline">{product.verlag ?? "—"}</dd></div>
                    <div><dt className="inline">Kanal: </dt><dd className="inline">{product.kanal ?? "—"}</dd></div>
                    <div><dt className="inline">Produktgruppe: </dt><dd className="inline">{product.produktgruppe ?? "—"}</dd></div>
                    <div><dt className="inline">Ziel Eignung: </dt><dd className="inline">{product.ziel_eignung ?? "—"}</dd></div>
                    <div><dt className="inline">Zusatzinformationen: </dt><dd className="inline">{product.zusatzinformationen ?? "—"}</dd></div>
                  </dl>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Spezifikationen</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Platzierung: </dt><dd className="inline">{product.platzierung ?? "—"}</dd></div>
                    <div><dt className="inline">Position: </dt><dd className="inline">{product.position ?? "—"}</dd></div>
                    <div><dt className="inline">Farbe: </dt><dd className="inline">{product.creative_farbe ?? "—"}</dd></div>
                    <div><dt className="inline">Typ: </dt><dd className="inline">{product.creative_typ ?? "—"}</dd></div>
                    <div><dt className="inline">Format & Grösse: </dt><dd className="inline">{product.creative_groesse ?? product.size ?? "—"}{product.creative_groesse_einheit ? ` ${product.creative_groesse_einheit}` : ""}</dd></div>
                    <div><dt className="inline">Dateityp: </dt><dd className="inline">{product.creative_dateityp ?? "—"}</dd></div>
                  </dl>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Standard-Konditionen</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Preis Brutto (CHF) pro Einheit: </dt><dd className="inline">{formatChf(product.preis_brutto_chf)}</dd></div>
                    <div><dt className="inline">Preis Netto (CHF) pro Einheit: </dt><dd className="inline">{formatChf(product.preis_netto_chf)}</dd></div>
                    <div><dt className="inline">Preis Agenturservice: </dt><dd className="inline">{product.preis_agenturservice != null ? formatChf(product.preis_agenturservice) : "—"}</dd></div>
                    <div><dt className="inline">Laufzeit pro Einheit: </dt><dd className="inline">{product.laufzeit_pro_einheit ?? "—"}</dd></div>
                    <div><dt className="inline">Empfohlenes Medienbudget: </dt><dd className="inline">{product.empfohlenes_medienbudget ?? "—"}</dd></div>
                    <div><dt className="inline">Buchungsvoraussetzung: </dt><dd className="inline">{product.buchungsvoraussetzung ?? "—"}</dd></div>
                    <div><dt className="inline">Creative Deadline: </dt><dd className="inline">{product.creative_deadline_tage != null ? `${product.creative_deadline_tage} Tage vorher` : product.creative_deadline_date ? formatDateRange(product.creative_deadline_date, null) : "—"}</dd></div>
                  </dl>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Kein Produkt aus dem Katalog verknüpft. Diese Position wurde manuell angelegt.</p>
            )}
          </div>

          {/* Kundenspezifische Produkt-Details: Anzeige oder Formular */}
          <div
            className="bg-zinc-100 dark:bg-zinc-800/80 p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Kundenspezifische Produkt-Details
              </h4>
              {!editDetails ? (
                <button
                  type="button"
                  onClick={() => setEditDetails(true)}
                  className="shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Bearbeiten
                </button>
              ) : null}
            </div>

            {!editDetails ? (
              /* Anzeige */
              <div className="grid gap-6 sm:grid-cols-3 text-sm">
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-200">Kampagne</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Kampagnenname: </dt><dd className="inline">{pos.kampagnenname ?? plan?.campaign ?? "—"}</dd></div>
                    <div><dt className="inline">Ziel: </dt><dd className="inline">{pos.ziel ?? pos.tag ?? "—"}</dd></div>
                    <div><dt className="inline">Creative-Verantwortung: </dt><dd className="inline">{pos.creative_verantwortung ?? "—"}</dd></div>
                    <div><dt className="inline">Agentur: </dt><dd className="inline">{pos.agentur ?? "—"}</dd></div>
                    <div><dt className="inline">Creative Deadline: </dt><dd className="inline">{pos.creative_deadline ? formatDateRange(pos.creative_deadline, null) : "—"}</dd></div>
                  </dl>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-200">Laufzeit</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Startdatum: </dt><dd className="inline">{pos.start_date ? formatDateRange(pos.start_date, null) : "—"}</dd></div>
                    <div><dt className="inline">Enddatum: </dt><dd className="inline">{pos.end_date ? formatDateRange(pos.end_date, null) : "—"}</dd></div>
                    <div><dt className="inline">Menge/Volumen: </dt><dd className="inline">{pos.menge_volumen ?? "—"}</dd></div>
                    <div><dt className="inline">Anzahl Einheiten: </dt><dd className="inline">{pos.anzahl_einheiten ?? "—"}</dd></div>
                    <div><dt className="inline">Werberadius: </dt><dd className="inline">{pos.werberadius ?? "—"}</dd></div>
                    <div><dt className="inline">Zielgruppeninformationen: </dt><dd className="inline">{pos.zielgruppeninformationen ?? "—"}</dd></div>
                    <div><dt className="inline">Zusatzinformationen: </dt><dd className="inline">{pos.zusatzinformationen_kunde ?? pos.description ?? "—"}</dd></div>
                  </dl>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-200">Vereinbartes Budget</h5>
                  <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div><dt className="inline">Preis Brutto (pro Einheit): </dt><dd className="inline">{formatChf(pos.brutto)}</dd></div>
                    <div><dt className="inline">Rabatt auf Verlagspreis: </dt><dd className="inline">{pos.rabatt_prozent != null ? `${pos.rabatt_prozent}%` : "—"}{pos.discount_text ? ` (${pos.discount_text})` : ""}</dd></div>
                    <div><dt className="inline">Rabatt auf Agenturgebühr: </dt><dd className="inline">{pos.rabatt_agentur_prozent != null ? `${pos.rabatt_agentur_prozent}%` : "—"}</dd></div>
                    <div><dt className="inline">Agenturgebühr: </dt><dd className="inline">{pos.agenturgebuehr != null ? formatChf(pos.agenturgebuehr) : "—"}</dd></div>
                    <div className="pt-1 font-semibold text-zinc-900 dark:text-zinc-100">Kundenpreis Gesamt: {formatChf(pos.kundenpreis)}</div>
                  </dl>
                </div>
              </div>
            ) : (
              /* Formular */
              <form
                onSubmit={(e) => { e.preventDefault(); handleSaveDetails(); }}
              >
                <div className="grid gap-6 sm:grid-cols-3 text-sm">
                  <div className="space-y-3">
                    <h5 className="font-medium text-zinc-700 dark:text-zinc-200">Kampagne</h5>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Kampagnenname</span>
                      <input type="text" value={form.kampagnenname} onChange={(e) => update("kampagnenname", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. Frühlingsaktion - Welle 1" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Ziel</span>
                      <input type="text" value={form.ziel} onChange={(e) => update("ziel", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. Sichtbarkeit" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Creative-Verantwortung</span>
                      <input type="text" value={form.creative_verantwortung} onChange={(e) => update("creative_verantwortung", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Agentur</span>
                      <input type="text" value={form.agentur} onChange={(e) => update("agentur", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Creative Deadline</span>
                      <input type="date" value={form.creative_deadline} onChange={(e) => update("creative_deadline", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-medium text-zinc-700 dark:text-zinc-200">Laufzeit</h5>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Startdatum</span>
                      <input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Enddatum</span>
                      <input type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Menge/Volumen</span>
                      <input type="text" value={form.menge_volumen} onChange={(e) => update("menge_volumen", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. 2.500 CPM" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Anzahl Einheiten</span>
                      <input type="text" inputMode="numeric" value={form.anzahl_einheiten} onChange={(e) => update("anzahl_einheiten", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. 2500" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Werberadius</span>
                      <input type="text" value={form.werberadius} onChange={(e) => update("werberadius", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. FL" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Zielgruppeninformationen</span>
                      <input type="text" value={form.zielgruppeninformationen} onChange={(e) => update("zielgruppeninformationen", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z.B. 25-45 Jahre" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Zusatzinformationen</span>
                      <input type="text" value={form.zusatzinformationen_kunde} onChange={(e) => update("zusatzinformationen_kunde", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-medium text-zinc-700 dark:text-zinc-200">Vereinbartes Budget</h5>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Preis Brutto (pro Einheit) CHF</span>
                      <input type="text" inputMode="decimal" value={form.brutto} onChange={(e) => update("brutto", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="0" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Rabatt auf Verlagspreis %</span>
                      <input type="text" inputMode="decimal" value={form.rabatt_prozent} onChange={(e) => update("rabatt_prozent", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="0" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Rabatt-Text (z.B. -10%)</span>
                      <input type="text" value={form.discount_text} onChange={(e) => update("discount_text", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Rabatt auf Agenturgebühr %</span>
                      <input type="text" inputMode="decimal" value={form.rabatt_agentur_prozent} onChange={(e) => update("rabatt_agentur_prozent", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="0" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Agenturgebühr CHF</span>
                      <input type="text" inputMode="decimal" value={form.agenturgebuehr} onChange={(e) => update("agenturgebuehr", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-medium">Kundenpreis Gesamt CHF</span>
                      <input type="text" inputMode="decimal" value={form.kundenpreis} onChange={(e) => update("kundenpreis", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100 font-medium" />
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDetails(false)}
                    className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a] disabled:opacity-60"
                  >
                    {saving ? "Speichern…" : "Speichern"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function MediaplanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
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
  } = useMediaplanData(planId ?? "");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [editPlanInfo, setEditPlanInfo] = useState(false);
  const [editKundenberater, setEditKundenberater] = useState(false);
  const [planForm, setPlanForm] = useState({
    client: "",
    status: "Entwurf",
    campaign: "",
    date_range_start: "",
    date_range_end: "",
    kunde_adresse: "",
    kunde_email: "",
    kunde_telefon: "",
    berater_name: "",
    berater_position: "",
    berater_email: "",
    berater_telefon: "",
    berater_mobil: "",
    kunde_ap_name: "",
    kunde_ap_position: "",
    kunde_ap_email: "",
    kunde_ap_telefon: "",
    kunde_ap_mobil: "",
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const { user, role, loading: userLoading } = useUser();
  const [agencyUsers, setAgencyUsers] = useState<AgencyUser[]>([]);
  const [statusConfirm, setStatusConfirm] = useState<"Aktiv" | "Entwurf" | null>(null);
  const [deleteConfirmPositionIds, setDeleteConfirmPositionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!plan) return;
    const fmt = (d: string | null) => {
      if (!d) return "";
      const x = new Date(d);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    };
    setPlanForm({
      client: plan.kunde_name ?? plan.client ?? "",
      status: plan.status ?? "Entwurf",
      campaign: plan.campaign ?? "",
      date_range_start: fmt(plan.date_range_start),
      date_range_end: fmt(plan.date_range_end),
      kunde_adresse: plan.kunde_adresse ?? "",
      kunde_email: plan.kunde_email ?? "",
      kunde_telefon: plan.kunde_telefon ?? "",
      berater_name: plan.berater_name ?? "",
      berater_position: plan.berater_position ?? "",
      berater_email: plan.berater_email ?? "",
      berater_telefon: plan.berater_telefon ?? "",
      berater_mobil: plan.berater_mobil ?? "",
      kunde_ap_name: plan.kunde_ap_name ?? "",
      kunde_ap_position: plan.kunde_ap_position ?? "",
      kunde_ap_email: plan.kunde_ap_email ?? "",
      kunde_ap_telefon: plan.kunde_ap_telefon ?? "",
      kunde_ap_mobil: plan.kunde_ap_mobil ?? "",
    });
  }, [plan?.id, plan?.client, plan?.kunde_name, plan?.status, plan?.campaign, plan?.date_range_start, plan?.date_range_end, plan?.kunde_adresse, plan?.kunde_email, plan?.kunde_telefon, plan?.kunde_ap_name, plan?.kunde_ap_position, plan?.kunde_ap_email, plan?.kunde_ap_telefon, plan?.kunde_ap_mobil, plan?.berater_name, plan?.berater_position, plan?.berater_email, plan?.berater_telefon, plan?.berater_mobil]);

  const updatePlan = useCallback(
    async () => {
      if (!planId || !plan) return;
      setSavingPlan(true);
      const supabase = createClient();
      const { error: err } = await supabase
        .from("mediaplaene")
        .update({
          client: planForm.client || null,
          status: planForm.status || null,
          campaign: planForm.campaign || null,
          date_range_start: planForm.date_range_start || null,
          date_range_end: planForm.date_range_end || null,
          kunde_adresse: planForm.kunde_adresse || null,
          kunde_email: planForm.kunde_email || null,
          kunde_telefon: planForm.kunde_telefon || null,
          berater_name: planForm.berater_name || null,
          berater_position: null,
          berater_email: planForm.berater_email || null,
          berater_telefon: planForm.berater_telefon || null,
          berater_mobil: null,
          kunde_ap_name: planForm.kunde_ap_name || null,
          kunde_ap_position: planForm.kunde_ap_position || null,
          kunde_ap_email: planForm.kunde_ap_email || null,
          kunde_ap_telefon: planForm.kunde_ap_telefon || null,
          kunde_ap_mobil: planForm.kunde_ap_mobil || null,
        })
        .eq("id", planId);
      setSavingPlan(false);
      if (err) setError(err.message);
      else await loadPlan();
      setEditPlanInfo(false);
      setEditKundenberater(false);
    },
    [planId, plan, planForm, loadPlan]
  );

  const openStatusConfirm = useCallback(() => {
    if (!plan) return;
    const nextStatus = plan.status === "Aktiv" ? "Entwurf" : "Aktiv";
    setStatusConfirm(nextStatus);
  }, [plan?.status]);

  const confirmStatusChange = useCallback(async () => {
    if (!planId || !plan || !statusConfirm) return;
    const supabase = createClient();
    await supabase.from("mediaplaene").update({ status: statusConfirm }).eq("id", planId);
    setPlanForm((f) => ({ ...f, status: statusConfirm }));
    setStatusConfirm(null);
    await loadPlan();
  }, [planId, plan, statusConfirm, loadPlan]);

  const isAgency = (role?.toLowerCase?.() ?? "") === "agency";

  // Agentur-User für Kundenberater-Auswahl per RPC laden (umgeht reserviertes Spaltenwort "role")
  useEffect(() => {
    if (!isAgency) {
      setAgencyUsers([]);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("get_agency_profiles")
      .then(({ data, error }) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[get_agency_profiles]", { error: error?.message ?? null, count: Array.isArray(data) ? data.length : 0, data });
        }
        if (error) console.warn("Agentur-User für Kundenberater:", error.message);
        const list = Array.isArray(data) ? data : [];
        setAgencyUsers(list as AgencyUser[]);
      });
  }, [isAgency]);

  const openAddProduct = useCallback(async () => {
    setAddProductOpen(true);
    setProductSearch("");
    const supabase = createClient();
    const { data } = await supabase
      .from("produkte")
      .select("id, produktvariante_titel, name, platzierung, zusatzinformationen, ziel_eignung, preis_brutto_chf, preis_netto_chf, category")
      .eq("archived", false)
      .order("category")
      .limit(200);
    setProducts((data ?? []) as ProductRow[]);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        (p.produktvariante_titel ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.platzierung ?? "").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const addProductAsPosition = useCallback(
    async (prod: ProductRow) => {
      if (!planId) return;
      setAdding(true);
      const supabase = createClient();
      const title = prod.produktvariante_titel ?? prod.name ?? "Produkt";
      const description = prod.platzierung ?? prod.zusatzinformationen ?? null;
      const { error: err } = await supabase.from("mediaplan_positionen").insert({
        mediaplan_id: planId,
        produkt_id: prod.id,
        title,
        description,
        tag: prod.ziel_eignung ?? null,
        brutto: prod.preis_brutto_chf ?? null,
        discount_text: null,
        kundenpreis: prod.preis_netto_chf ?? null,
        status_tags: ["Offen"],
        sort_order: positions.length,
        start_date: null,
        end_date: null,
        creative_deadline: null,
      });
      setAdding(false);
      if (err) {
        setError(err.message);
        return;
      }
      await loadPositions();
      setAddProductOpen(false);
    },
    [planId, positions.length, loadPositions]
  );

  const updatePositionDates = useCallback(
    async (positionId: string, dates: { start_date?: string | null; end_date?: string | null; creative_deadline?: string | null }) => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("mediaplan_positionen")
        .update(dates)
        .eq("id", positionId);
      if (err) setError(err.message);
      else await loadPositions();
    },
    [loadPositions]
  );

  const updatePositionDetails = useCallback(
    async (positionId: string, payload: KundendetailsPayload) => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("mediaplan_positionen")
        .update(payload)
        .eq("id", positionId);
      if (err) setError(err.message);
      else await loadPositions();
    },
    [loadPositions]
  );

  const updatePositionProzessStatus = useCallback(
    async (positionId: string, prozess_status: Record<string, string>) => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("mediaplan_positionen")
        .update({ prozess_status })
        .eq("id", positionId);
      if (err) setError(err.message);
      else await loadPositions();
    },
    [loadPositions]
  );

  const deletePosition = useCallback(
    async (positionId: string) => {
      const supabase = createClient();
      const { error: err } = await supabase.from("mediaplan_positionen").delete().eq("id", positionId);
      if (err) setError(err.message);
      else await loadPositions();
    },
    [loadPositions]
  );

  const openDeleteConfirm = useCallback((ids: string[]) => {
    setDeleteConfirmPositionIds(ids);
  }, []);

  const confirmDeletePositions = useCallback(async () => {
    const ids = [...deleteConfirmPositionIds];
    setDeleteConfirmPositionIds([]);
    setSelectedPositionIds((prev) => prev.filter((id) => !ids.includes(id)));
    const supabase = createClient();
    for (const id of ids) {
      await supabase.from("mediaplan_positionen").delete().eq("id", id);
    }
    await loadPositions();
  }, [deleteConfirmPositionIds, loadPositions]);

  const duplicatePosition = useCallback(
    async (positionId: string) => {
      const pos = positions.find((p) => p.id === positionId);
      if (!pos || !planId) return;
      const supabase = createClient();
      const maxOrder = Math.max(0, ...positions.map((p) => p.sort_order ?? 0));
      const { error: err } = await supabase.from("mediaplan_positionen").insert({
        mediaplan_id: planId,
        produkt_id: pos.produkt_id,
        title: pos.title ? `${pos.title} (Kopie)` : "Kopie",
        description: pos.description,
        tag: pos.tag,
        brutto: pos.brutto,
        discount_text: pos.discount_text,
        kundenpreis: pos.kundenpreis,
        status_tags: pos.status_tags ?? [],
        sort_order: maxOrder + 1,
        start_date: pos.start_date,
        end_date: pos.end_date,
        creative_deadline: pos.creative_deadline,
        kampagnenname: pos.kampagnenname,
        ziel: pos.ziel,
        creative_verantwortung: pos.creative_verantwortung,
        agentur: pos.agentur,
        menge_volumen: pos.menge_volumen,
        anzahl_einheiten: pos.anzahl_einheiten,
        werberadius: pos.werberadius,
        zielgruppeninformationen: pos.zielgruppeninformationen,
        zusatzinformationen_kunde: pos.zusatzinformationen_kunde,
        rabatt_prozent: pos.rabatt_prozent,
        rabatt_agentur_prozent: pos.rabatt_agentur_prozent,
        agenturgebuehr: pos.agenturgebuehr,
        prozess_status: pos.prozess_status ?? {},
      });
      if (err) setError(err.message);
      else await loadPositions();
    },
    [planId, positions, loadPositions]
  );

  /** Agentur Marge: Summe Agenturgebühren und Umsatz (nur freigegebene Positionen) */
  const agenturMarge = useMemo(() => {
    let sumAgenturgebuehr = 0;
    let sumUmsatz = 0;
    for (const p of positions) {
      if (freigabeStatus(p) !== "Freigegeben") continue;
      sumAgenturgebuehr += p.agenturgebuehr ?? 0;
      sumUmsatz += p.kundenpreis ?? 0;
    }
    const margeProzent = sumUmsatz > 0 ? (sumAgenturgebuehr / sumUmsatz) * 100 : 0;
    return { sumAgenturgebuehr, sumUmsatz, margeProzent };
  }, [positions]);

  const pdfPayload = useMemo(() => {
    if (!plan) return null;
    const ap = [plan.kunde_ap_name, plan.kunde_ap_position].filter(Boolean).join(", ");
    // Kundenberater nur anzeigen, wenn am Plan hinterlegt (kein Fallback auf eingeloggten User)
    const beraterName = editPlanInfo ? (planForm.berater_name ?? plan.berater_name ?? "") : (plan.berater_name ?? "");
    const beraterEmail = editPlanInfo ? (planForm.berater_email ?? plan.berater_email ?? "") : (plan.berater_email ?? "");
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
            telefon: (editPlanInfo ? planForm.berater_telefon : plan.berater_telefon) ?? plan.berater_mobil ?? undefined,
          }
        : undefined,
      positionen: positions.map((p) => ({
        produkt: p.title || "–",
        verlag: (p.produkt_id ? catalogProductMap[p.produkt_id]?.verlag : null) ?? "–",
        zeitraum: [p.start_date, p.end_date].filter(Boolean).join(" – ") || "–",
        laufzeit: p.menge_volumen ?? "–",
        nettoChf: p.kundenpreis ?? 0,
        bruttoChf: p.brutto ?? 0,
        startDate: p.start_date ?? undefined,
        endDate: p.end_date ?? undefined,
      })),
      erstelltAm: new Date().toLocaleDateString("de-CH"),
    };
  }, [plan, positions, catalogProductMap, editPlanInfo, planForm.berater_name, planForm.berater_email, planForm.berater_telefon]);

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
      <MediaplanPageHeader plan={plan} onStatusClick={openStatusConfirm} />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <Link
          href={`/mediaplaene/${planId}/kundenansicht`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
        >
          zur Kundenansicht wechseln
        </Link>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a]"
        >
          Creative Übersicht senden ({positions.length})
        </button>
        <MediaplanPDFButton
          payload={pdfPayload}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-60"
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-600 pb-2">
            <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Kunden Infos</h4>
            {!editPlanInfo ? (
              <button
                type="button"
                onClick={() => setEditPlanInfo(true)}
                className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                title="Bearbeiten"
                aria-label="Bearbeiten"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditPlanInfo(false); setEditKundenberater(false); }} className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">Abbrechen</button>
                <button type="button" onClick={() => updatePlan()} disabled={savingPlan} className="rounded-full bg-[#FF6554] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-60">{savingPlan ? "Speichern…" : "Speichern"}</button>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {!editPlanInfo ? (
              <>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-zinc-500 dark:text-zinc-400">Unternehmen</dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{plan.kunde_name ?? plan.client ?? "—"}</dd></div>
                  <div><dt className="text-zinc-500 dark:text-zinc-400">Adresse</dt><dd className="whitespace-pre-line font-medium text-zinc-900 dark:text-zinc-100">{plan.kunde_adresse ?? "—"}</dd></div>
                  <div><dt className="text-zinc-500 dark:text-zinc-400">Hauptnummer</dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{plan.kunde_telefon ?? "—"}</dd></div>
                </dl>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Ansprechpartner</dt>
                    <dd className="mt-1 whitespace-pre-line font-medium text-zinc-900 dark:text-zinc-100">
                      {[plan.kunde_ap_name, plan.kunde_ap_position, plan.kunde_ap_email, plan.kunde_ap_telefon ?? plan.kunde_ap_mobil].filter(Boolean).join("\n") || "—"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Kampagne</span>
                    <input type="text" value={planForm.campaign} onChange={(e) => setPlanForm((f) => ({ ...f, campaign: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Kampagnenname" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Startdatum</span>
                    <input type="date" value={planForm.date_range_start} onChange={(e) => setPlanForm((f) => ({ ...f, date_range_start: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Enddatum</span>
                    <input type="date" value={planForm.date_range_end} onChange={(e) => setPlanForm((f) => ({ ...f, date_range_end: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Unternehmen</span>
                    <input type="text" value={planForm.client} onChange={(e) => setPlanForm((f) => ({ ...f, client: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z. B. Salt Mobile AG" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Adresse</span>
                    <textarea value={planForm.kunde_adresse} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_adresse: e.target.value }))} rows={3} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Strasse, PLZ Ort, Land" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">Hauptnummer</span>
                    <input type="text" value={planForm.kunde_telefon} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_telefon: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="+41 800 700 700" />
                  </label>
                </div>
                <div className="space-y-3 text-sm">
                  <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ansprechpartner</span>
                  <input type="text" value={planForm.kunde_ap_name} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_ap_name: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Name" aria-label="Ansprechpartner Name" />
                  <input type="text" value={planForm.kunde_ap_position} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_ap_position: e.target.value }))} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Position" aria-label="Position" />
                  <input type="email" value={planForm.kunde_ap_email} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_ap_email: e.target.value }))} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="E-Mail" aria-label="E-Mail" />
                  <input type="text" value={planForm.kunde_ap_telefon} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_ap_telefon: e.target.value }))} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Telefon" aria-label="Telefon" />
                  <input type="text" value={planForm.kunde_ap_mobil} onChange={(e) => setPlanForm((f) => ({ ...f, kunde_ap_mobil: e.target.value }))} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Mobil" aria-label="Mobil" />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-600 pb-2">
            <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Kundenberater</h4>
            {!editPlanInfo && !editKundenberater && isAgency && (
              <button
                type="button"
                onClick={() => setEditKundenberater(true)}
                className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                title="Bearbeiten"
                aria-label="Kundenberater bearbeiten"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
          </div>
          {!editPlanInfo && !editKundenberater ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-600">
                {(() => {
                  const beraterAvatarUrl = agencyUsers.find((u) => u.email === plan.berater_email || u.full_name === plan.berater_name)?.avatar_url;
                  if (beraterAvatarUrl) {
                    return (
                      <img
                        src={beraterAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                  return (
                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {plan.berater_name || plan.berater_email ? beraterInitials(plan.berater_email ?? plan.berater_name ?? undefined) : "—"}
                    </span>
                  );
                })()}
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {plan.berater_name ?? "—"}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {plan.berater_email ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Kundenberater aus App-Usern wählen</span>
                <select
                  value={agencyUsers.find((u) => u.email === planForm.berater_email || u.full_name === planForm.berater_name)?.id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const user = agencyUsers.find((u) => u.id === id);
                    if (user) {
                      setPlanForm((f) => ({
                        ...f,
                        berater_name: user.full_name ?? "",
                        berater_email: user.email ?? "",
                      }));
                    } else {
                      setPlanForm((f) => ({ ...f, berater_name: "", berater_email: "" }));
                    }
                  }}
                  className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">— Keiner / manuell eingeben</option>
                  {agencyUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email || u.id}
                      {u.email && u.full_name ? ` (${u.email})` : u.email ? ` – ${u.email}` : ""}
                    </option>
                  ))}
                </select>
                {agencyUsers.length === 0 && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Keine Agentur-User geladen. In der Konsole (F12) prüfen, ob die RPC get_agency_profiles einen Fehler meldet.
                  </p>
                )}
              </label>
              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Name</span>
                <input type="text" value={planForm.berater_name} onChange={(e) => setPlanForm((f) => ({ ...f, berater_name: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z. B. Sarah Müller" />
              </label>
              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">E-Mail</span>
                <input type="email" value={planForm.berater_email} onChange={(e) => setPlanForm((f) => ({ ...f, berater_email: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="sarah.mueller@agency.ch" />
              </label>
              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Telefon</span>
                <input type="text" value={planForm.berater_telefon} onChange={(e) => setPlanForm((f) => ({ ...f, berater_telefon: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="+41 44 123 45 67" />
              </label>
              {editKundenberater && !editPlanInfo && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanForm((f) => ({
                        ...f,
                        berater_name: plan.berater_name ?? "",
                        berater_email: plan.berater_email ?? "",
                        berater_telefon: plan.berater_telefon ?? "",
                      }));
                      setEditKundenberater(false);
                    }}
                    className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await updatePlan();
                      setEditKundenberater(false);
                    }}
                    disabled={savingPlan}
                    className="rounded-full bg-[#FF6554] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-60"
                  >
                    {savingPlan ? "Speichern…" : "Speichern"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="content-radius haupt-box space-y-4 border border-zinc-200 dark:border-zinc-700 p-4 shadow-none sm:p-5">
      <div className="pl-4 sm:pl-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Zeitplan – Übersicht</h2>
        <section className="-ml-4 sm:-ml-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <GanttChart plan={plan} positions={positions} interactive />
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Bestätigte Positionen ({positions.length})
          </h2>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={positions.length > 0 && selectedPositionIds.length === positions.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPositionIds(positions.map((p) => p.id));
                  } else {
                    setSelectedPositionIds([]);
                  }
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
                  onClick={() => openDeleteConfirm(selectedPositionIds)}
                  className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Löschen ({selectedPositionIds.length})
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    for (const id of selectedPositionIds) {
                      await duplicatePosition(id);
                    }
                    setSelectedPositionIds([]);
                  }}
                  className="rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Duplizieren ({selectedPositionIds.length})
                </button>
              </>
            )}
          </div>
        </div>
        <ul className="mt-4 space-y-4">
          {positions.map((pos) => (
            <PositionListItem
              key={pos.id}
              pos={pos}
              plan={plan}
              product={pos.produkt_id ? catalogProductMap[pos.produkt_id] ?? null : null}
              selected={selectedPositionIds.includes(pos.id)}
              onToggleSelect={() =>
                setSelectedPositionIds((prev) =>
                  prev.includes(pos.id) ? prev.filter((id) => id !== pos.id) : [...prev, pos.id]
                )
              }
              formatChf={formatChf}
              formatDateRange={formatDateRange}
              formatDateInput={formatDateInput}
              onDelete={() => openDeleteConfirm([pos.id])}
              onDuplicate={() => duplicatePosition(pos.id)}
              onUpdateDates={(dates) => updatePositionDates(pos.id, dates)}
              onUpdateDetails={(payload) => updatePositionDetails(pos.id, payload)}
              onUpdateProzessStatus={(payload) => updatePositionProzessStatus(pos.id, payload)}
            />
          ))}
        </ul>
        <button
          type="button"
          onClick={openAddProduct}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-600 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-[#FF6554]/40 hover:bg-[#FF6554]/15 hover:text-[#FF6554]"
        >
          + Position aus Produktkatalog hinzufügen
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaplanBudgetOverview
            bestaetigtSumme={bestaetigtSumme}
            ausstehendSumme={ausstehendSumme}
            gesamtEinmalig={gesamtEinmalig}
            totalRabatt={totalRabatt}
          />
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4">
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Agentur Marge</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600 dark:text-zinc-400">Summe Agenturgebühren</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-100 shrink-0">{formatChf(agenturMarge.sumAgenturgebuehr)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600 dark:text-zinc-400">Umsatz (freigegebene Positionen)</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">{formatChf(agenturMarge.sumUmsatz)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-zinc-200 dark:border-zinc-600 pt-2">
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">Marge in %</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-100 shrink-0">{agenturMarge.margeProzent.toFixed(1)} %</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Berechnung basiert auf freigegebenen Positionen.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <h3 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Notizen &amp; Kommentare zum Mediaplan ({COMMENTS.length})
        </h3>
        <ul className="space-y-4">
          {COMMENTS.map((c, i) => (
            <li key={i} className="border-l-2 border-[#FF6554]/40 pl-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.author}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.date}</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Notiz zum Mediaplan hinzufügen..."
            className="flex-1 rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          <button
            type="button"
            className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300"
            disabled
          >
            Senden
          </button>
        </div>
      </section>

        <Aenderungshistorie entries={aenderungshistorie} />
      </div>

      {/* Modal: Produkt aus Katalog wählen */}
      {addProductOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !adding && setAddProductOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              Position aus Produktkatalog hinzufügen
            </h3>
            <input
              type="search"
              placeholder="Produkt suchen (Name, Kategorie, Platzierung…)"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mt-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
            />
            <ul className="mt-4 max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 && (
                <li className="py-4 text-center text-sm text-zinc-500">
                  {products.length === 0 ? "Keine Produkte geladen." : "Keine Treffer."}
                </li>
              )}
              {filteredProducts.map((prod) => {
                const title = prod.produktvariante_titel ?? prod.name ?? "Produkt";
                return (
                  <li
                    key={prod.id}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 p-3 hover:bg-[#FF6554]/10"
                    onClick={() => addProductAsPosition(prod)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{title}</p>
                      <p className="text-xs text-zinc-500">
                        {prod.category ?? "—"} · {formatChf(prod.preis_netto_chf)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-[#FF6554]">+ Hinzufügen</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !adding && setAddProductOpen(false)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}

      {statusConfirm != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="content-radius w-full max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {statusConfirm === "Aktiv"
                ? "Kampagne aktivieren bestätigen?"
                : "Kampagne wieder auf Entwurf stellen bestätigen?"}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmPositionIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="content-radius w-full max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {deleteConfirmPositionIds.length === 1
                ? "Position wirklich löschen?"
                : `${deleteConfirmPositionIds.length} Positionen wirklich löschen?`}
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPositionIds([])}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmDeletePositions}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
