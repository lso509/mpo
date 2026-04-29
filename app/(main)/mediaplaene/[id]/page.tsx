"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import { MediaplanPDFButton } from "@/components/MediaplanPDFButton";
import type {
  AenderungshistorieEntry,
  CatalogProduct,
  MediaplanDetailFormState,
  MediaplanRow,
  PositionRow,
} from "@/lib/mediaplan/types";
import { formatChf, formatDateRange, freigabeStatus, parseOptionalChfInput } from "@/lib/mediaplan/utils";
import { parseZielEignung, ZIEL_OPTIONS } from "@/lib/produkte";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  agentur_marge_prozent: number | null;
  werbeabgabe_at: boolean | null;
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

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getIsoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - jan4Day + 1);
  const result = new Date(mondayWeek1);
  result.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return result;
}

function getIsoWeekInfo(date: Date): { year: number; week: number } {
  const target = new Date(date);
  const day = target.getDay() || 7;
  target.setDate(target.getDate() + 4 - day);
  const year = target.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year, week };
}

function buildCalendarWeeks(month: Date): Date[][] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayIndex);
  return Array.from({ length: 6 }, (_, rowIndex) =>
    Array.from({ length: 7 }, (_, colIndex) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + rowIndex * 7 + colIndex);
      return day;
    })
  );
}

function WeekAwareDateInput({
  value,
  onChange,
  onSelectWeek,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectWeek?: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseIsoDate(value);
  const [viewMonth, setViewMonth] = useState<Date>(() => selectedDate ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = selectedDate ?? new Date();
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const weeks = useMemo(() => buildCalendarWeeks(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  const monthOptions = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ] as const;
  const yearOptions = useMemo(() => {
    const base = viewMonth.getFullYear();
    return Array.from({ length: 11 }, (_, index) => base - 5 + index);
  }, [viewMonth]);
  const selectedIso = selectedDate ? toIsoDate(selectedDate) : "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-0.5 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-left text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {value || "Datum wählen"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-[330px] rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Vorheriger Monat"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              <select
                value={viewMonth.getMonth()}
                onChange={(e) =>
                  setViewMonth((prev) => new Date(prev.getFullYear(), Number(e.target.value), 1))
                }
                className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label="Monat auswählen"
                title={monthLabel}
              >
                {monthOptions.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={viewMonth.getFullYear()}
                onChange={(e) =>
                  setViewMonth((prev) => new Date(Number(e.target.value), prev.getMonth(), 1))
                }
                className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label="Jahr auswählen"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Nächster Monat"
            >
              ›
            </button>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-zinc-500 dark:text-zinc-400">
                <th className="px-1 py-1 text-left font-medium">KW</th>
                <th className="px-1 py-1 text-center font-medium">M</th>
                <th className="px-1 py-1 text-center font-medium">D</th>
                <th className="px-1 py-1 text-center font-medium">M</th>
                <th className="px-1 py-1 text-center font-medium">D</th>
                <th className="px-1 py-1 text-center font-medium">F</th>
                <th className="px-1 py-1 text-center font-medium">S</th>
                <th className="px-1 py-1 text-center font-medium">S</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => {
                const monday = week[0];
                const weekInfo = getIsoWeekInfo(monday);
                const weekStart = toIsoDate(monday);
                const weekEndDate = new Date(monday);
                weekEndDate.setDate(monday.getDate() + 6);
                const weekEnd = toIsoDate(weekEndDate);
                return (
                  <tr key={weekStart}>
                    <td className="px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectWeek) onSelectWeek(weekStart, weekEnd);
                          else onChange(weekStart);
                          setOpen(false);
                        }}
                        className="rounded px-1 py-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title={`KW ${String(weekInfo.week).padStart(2, "0")} wählen`}
                      >
                        {String(weekInfo.week).padStart(2, "0")}
                      </button>
                    </td>
                    {week.map((day) => {
                      const iso = toIsoDate(day);
                      const inMonth = day.getMonth() === viewMonth.getMonth();
                      const isSelected = selectedIso === iso;
                      return (
                        <td key={iso} className="px-0.5 py-0.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onChange(iso);
                              setOpen(false);
                            }}
                            className={`h-7 w-7 rounded-full text-xs ${
                              isSelected
                                ? "bg-[#FF6554] text-white"
                                : inMonth
                                  ? "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                  : "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const today = toIsoDate(new Date());
                onChange(today);
                setOpen(false);
              }}
              className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDecimalInput(v: string): number | null {
  if (v === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(/'/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizePositionCategory(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

type KundendetailsPayload = {
  title?: string;
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
  position_kategorie?: string | null;
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
  onRenameTitle,
}: {
  pos: PositionRow;
  plan: MediaplanRow | null;
  product: CatalogProduct | null;
  selected: boolean;
  onToggleSelect: () => void;
  formatChf: (n: number | null) => ReactNode;
  formatDateRange: (start: string | null, end: string | null) => string;
  formatDateInput: (v: string | null) => string;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateDates: (d: { start_date?: string | null; end_date?: string | null; creative_deadline?: string | null }) => void;
  onUpdateDetails: (payload: KundendetailsPayload) => void | Promise<void>;
  onUpdateProzessStatus: (payload: Record<string, string>) => void | Promise<void>;
  onRenameTitle: (title: string) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [editDetails, setEditDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(pos.title);
  const [localProzessStatus, setLocalProzessStatus] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    kampagnenname: pos.kampagnenname ?? plan?.campaign ?? "",
    ziel: parseZielEignung(pos.ziel ?? pos.tag) || "",
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
      ziel: parseZielEignung(pos.ziel ?? pos.tag) || "",
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

  const bruttoInput = parseDecimalInput(form.brutto);
  const berechnungsbasisBrutto = bruttoInput ?? 0;
  const rabattVerlagProzent = Math.max(0, parseDecimalInput(form.rabatt_prozent) ?? 0);
  const agenturgebuehrInput = parseDecimalInput(form.agenturgebuehr);
  const agenturgebuehrBasis = Math.max(0, agenturgebuehrInput ?? 0);
  const rabattAgenturProzent = Math.max(0, parseDecimalInput(form.rabatt_agentur_prozent) ?? 0);
  const bruttoNachRabatt = roundCurrency(
    berechnungsbasisBrutto * (1 - Math.min(rabattVerlagProzent, 100) / 100)
  );
  const agenturgebuehrNachRabatt = roundCurrency(
    agenturgebuehrBasis * (1 - Math.min(rabattAgenturProzent, 100) / 100)
  );
  const hasPreisBasis = bruttoInput != null || agenturgebuehrInput != null;
  const berechneterKundenpreis = hasPreisBasis
    ? roundCurrency(bruttoNachRabatt + agenturgebuehrNachRabatt)
    : null;

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
    const order = ["Offen", "Erledigt", "N/A"] as const;
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
  const prozessActiveCount = PROZESS_SCHRITTE.filter(
    (s) => getProzessStatus(s.key) !== "N/A"
  ).length;
  const prozessPercent =
    prozessActiveCount === 0
      ? 100
      : Math.round((prozessDoneCount / prozessActiveCount) * 100);

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
    const rabattProzentValue = parseDecimalInput(form.rabatt_prozent);
    const rabattTextAuto =
      rabattProzentValue != null && rabattProzentValue > 0
        ? `-${roundCurrency(rabattProzentValue)}%`
        : null;
    await onUpdateDetails({
      kampagnenname: form.kampagnenname || null,
      ziel: parseZielEignung(form.ziel) || null,
      creative_verantwortung: form.creative_verantwortung || null,
      agentur: form.agentur || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      creative_deadline: form.creative_deadline || null,
      menge_volumen: form.menge_volumen || null,
      anzahl_einheiten: parseDecimalInput(form.anzahl_einheiten),
      werberadius: form.werberadius || null,
      zielgruppeninformationen: form.zielgruppeninformationen || null,
      zusatzinformationen_kunde: form.zusatzinformationen_kunde || null,
      brutto: parseDecimalInput(form.brutto),
      discount_text: form.discount_text || rabattTextAuto,
      rabatt_prozent: rabattProzentValue,
      rabatt_agentur_prozent: parseDecimalInput(form.rabatt_agentur_prozent),
      agenturgebuehr: parseDecimalInput(form.agenturgebuehr),
      kundenpreis: berechneterKundenpreis,
    });
    setSaving(false);
    setEditDetails(false);
  };

  return (
    <li className="group content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
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
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <>
                  <input
                    type="text"
                    value={titleDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const next = titleDraft.trim();
                      if (!next) return;
                      await onRenameTitle(next);
                      setEditingTitle(false);
                    }}
                    className="rounded-full bg-[#FF6554] px-2 py-1 text-xs font-medium text-white"
                  >
                    OK
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium text-zinc-950 dark:text-zinc-100">{pos.title}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTitleDraft(pos.title);
                      setEditingTitle(true);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500 hover:text-[#FF6554]"
                    title="Titel bearbeiten"
                    aria-label="Titel bearbeiten"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Laufzeit: {formatDateRange(pos.start_date, pos.end_date)}
            </p>
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
          <CollapsibleChevron open={expanded} />
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
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Prozessstatus
                  </h4>
                  <span className="text-sm">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">{prozessDoneCount}</span>
                    <span className="font-normal text-zinc-500 dark:text-zinc-400">
                      /{prozessActiveCount === 0 ? PROZESS_SCHRITTE.length : prozessActiveCount}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <>
                <div className="mt-1">
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute top-5 h-px bg-zinc-300 dark:bg-zinc-600"
                      style={{
                        left: `calc(50% / ${PROZESS_SCHRITTE.length})`,
                        right: `calc(50% / ${PROZESS_SCHRITTE.length})`,
                      }}
                    />
                    <div className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${PROZESS_SCHRITTE.length}, minmax(0, 1fr))` }}>
                      {PROZESS_SCHRITTE.map(({ key, label }, idx) => {
                        const status = getProzessStatus(key);
                        const isDone = status === "Erledigt" || status === "Freigegeben";
                        const isNa = status === "N/A";
                        const pointClass = isDone
                          ? "bg-emerald-500 ring-emerald-200 dark:ring-emerald-900/50"
                          : isNa
                            ? "bg-zinc-400 dark:bg-zinc-500 ring-zinc-200 dark:ring-zinc-700"
                            : "bg-[#FF6554] ring-rose-200 dark:ring-rose-900/50";
                        const statusClass = isDone
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isNa
                            ? "text-zinc-600 dark:text-zinc-300"
                            : "text-[#FF6554]";
                        return (
                          <div key={key} className="flex flex-col items-center text-center">
                            <button
                              type="button"
                              onClick={() => handleProzessStepClick(key)}
                              className={`relative z-10 mt-2 h-6 w-6 rounded-full ring-4 transition-transform hover:scale-105 ${pointClass}`}
                              title={`${idx + 1}. ${label} (${status})`}
                              aria-label={`${idx + 1}. ${label}: ${status}`}
                            />
                            <p className="mt-2 text-[11px] font-medium leading-tight text-zinc-700 dark:text-zinc-200">
                              {label}
                            </p>
                            <p className={`mt-0.5 text-[10px] font-semibold ${statusClass}`}>
                              {status}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            </>
          </div>

          <PositionCatalogInfo product={product} position={pos} />

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
                    <div><dt className="inline">Ziel: </dt><dd className="inline">{parseZielEignung(pos.ziel ?? pos.tag) || "—"}</dd></div>
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
                      <select
                        value={parseZielEignung(form.ziel) || ""}
                        onChange={(e) => update("ziel", e.target.value)}
                        className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="">—</option>
                        {ZIEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
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
                      <WeekAwareDateInput
                        value={form.start_date}
                        onChange={(next) => update("start_date", next)}
                        onSelectWeek={(start, end) =>
                          setForm((prev) => ({
                            ...prev,
                            start_date: start,
                            end_date: end,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">Enddatum</span>
                      <WeekAwareDateInput
                        value={form.end_date}
                        onChange={(next) => update("end_date", next)}
                        onSelectWeek={(start, end) =>
                          setForm((prev) => ({
                            ...prev,
                            start_date: start,
                            end_date: end,
                          }))
                        }
                      />
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
                      <input
                        type="text"
                        inputMode="decimal"
                        value={berechneterKundenpreis == null ? "" : String(berechneterKundenpreis)}
                        readOnly
                        className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50 px-2 py-1.5 text-zinc-900 dark:text-zinc-100 font-medium"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Berechnung: Brutto nach Rabatt + Agenturgebühr nach Rabatt
                      </p>
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
  const withAtAdLevy = (amount: number | null, enabled: boolean): number | null => {
    if (amount == null) return null;
    if (!enabled) return amount;
    return Math.round(amount * 1.05 * 100) / 100;
  };

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
  const [targetCategoryForAdd, setTargetCategoryForAdd] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [bulkCategoryValue, setBulkCategoryValue] = useState("");
  const [newCategoryDraft, setNewCategoryDraft] = useState("");
  const [showCreateCampaignInput, setShowCreateCampaignInput] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [collapsedCampaignGroups, setCollapsedCampaignGroups] = useState<Record<string, boolean>>({});
  const [editingCampaignGroup, setEditingCampaignGroup] = useState<string | null>(null);
  const [campaignGroupDraft, setCampaignGroupDraft] = useState("");
  const [customCategoryOptions, setCustomCategoryOptions] = useState<string[]>([]);
  const [editPlanInfo, setEditPlanInfo] = useState(false);
  const [editKundenberater, setEditKundenberater] = useState(false);
  const [planForm, setPlanForm] = useState<MediaplanDetailFormState>({
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
    max_budget_chf: "",
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const { user, role, loading: userLoading } = useUser();
  const [agencyUsers, setAgencyUsers] = useState<AgencyUser[]>([]);
  const [statusConfirm, setStatusConfirm] = useState<"Aktiv" | "Entwurf" | null>(null);
  const [deleteConfirmPositionIds, setDeleteConfirmPositionIds] = useState<string[]>([]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        [
          ...positions
            .map((p) => normalizePositionCategory(p.position_kategorie))
            .filter((v): v is string => v != null),
          ...customCategoryOptions,
        ]
      )
    );
    return unique.sort((a, b) => a.localeCompare(b, "de-CH", { sensitivity: "base" }));
  }, [positions, customCategoryOptions]);

  const positionsByCategory = useMemo(() => {
    const groups = new Map<string, PositionRow[]>();
    for (const pos of positions) {
      const key = normalizePositionCategory(pos.position_kategorie) ?? "Ohne Kampagne";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(pos);
    }
    for (const custom of customCategoryOptions) {
      if (!groups.has(custom)) groups.set(custom, []);
    }
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === "Ohne Kampagne") return 1;
      if (b === "Ohne Kampagne") return -1;
      return a.localeCompare(b, "de-CH", { sensitivity: "base" });
    });
    return sortedKeys.map((name) => ({ name, positions: groups.get(name) ?? [] }));
  }, [positions, customCategoryOptions]);

  const sortedPositionsForTimeline = useMemo(
    () => positionsByCategory.flatMap((group) => group.positions),
    [positionsByCategory]
  );

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
      max_budget_chf: plan.max_budget_chf != null ? String(plan.max_budget_chf) : "",
    });
  }, [plan?.id, plan?.client, plan?.kunde_name, plan?.status, plan?.campaign, plan?.date_range_start, plan?.date_range_end, plan?.max_budget_chf, plan?.kunde_adresse, plan?.kunde_email, plan?.kunde_telefon, plan?.kunde_ap_name, plan?.kunde_ap_position, plan?.kunde_ap_email, plan?.kunde_ap_telefon, plan?.kunde_ap_mobil, plan?.berater_name, plan?.berater_position, plan?.berater_email, plan?.berater_telefon, plan?.berater_mobil]);

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
          max_budget_chf: parseOptionalChfInput(planForm.max_budget_chf ?? ""),
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

  const openAddProduct = useCallback(async (prefillCategory: string | null = null) => {
    setTargetCategoryForAdd(prefillCategory);
    setAddProductOpen(true);
    setProductSearch("");
    const supabase = createClient();
    const { data } = await supabase
      .from("produkte")
      .select("id, produktvariante_titel, name, platzierung, zusatzinformationen, ziel_eignung, preis_brutto_chf, preis_netto_chf, agentur_marge_prozent, werbeabgabe_at, category")
      .eq("archived", false)
      .order("category")
      .limit(200);
    setProducts((data ?? []) as ProductRow[]);
  }, []);

  const filteredProducts = useMemo(() => {
    let base = products;
    if (targetCategoryForAdd && targetCategoryForAdd !== "Ohne Kampagne") {
      base = base.filter((p) => p.category === targetCategoryForAdd);
    }
    if (!productSearch.trim()) return base;
    const q = productSearch.toLowerCase();
    return base.filter(
      (p) =>
        (p.produktvariante_titel ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.platzierung ?? "").toLowerCase().includes(q)
    );
  }, [products, productSearch, targetCategoryForAdd]);

  const addProductAsPosition = useCallback(
    async (prod: ProductRow, targetCategory: string | null = null) => {
      if (!planId) return;
      setAdding(true);
      const supabase = createClient();
      const title = prod.produktvariante_titel ?? prod.name ?? "Produkt";
      const description = prod.platzierung ?? prod.zusatzinformationen ?? null;
      const hasAtAdLevy = prod.werbeabgabe_at === true;
      const { error: err } = await supabase.from("mediaplan_positionen").insert({
        mediaplan_id: planId,
        produkt_id: prod.id,
        title,
        description,
        tag: prod.ziel_eignung ?? null,
        brutto: withAtAdLevy(prod.preis_brutto_chf ?? null, hasAtAdLevy),
        discount_text: null,
        kundenpreis: withAtAdLevy(prod.preis_netto_chf ?? null, hasAtAdLevy),
        rabatt_agentur_prozent: prod.agentur_marge_prozent ?? null,
        position_kategorie:
          targetCategory && targetCategory !== "Ohne Kampagne"
            ? targetCategory
            : null,
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
      setTargetCategoryForAdd(null);
    },
    [planId, positions.length, loadPositions, targetCategoryForAdd]
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

  const assignCategoryToSelection = useCallback(async () => {
    if (selectedPositionIds.length === 0) return;
    const category = normalizePositionCategory(bulkCategoryValue);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("mediaplan_positionen")
      .update({ position_kategorie: category })
      .in("id", selectedPositionIds);
    if (err) {
      setError(err.message);
      return;
    }
    setBulkCategoryValue("");
    await loadPositions();
  }, [selectedPositionIds, bulkCategoryValue, loadPositions]);

  const renameCampaignGroup = useCallback(
    async (oldName: string, nextName: string) => {
      const normalizedNext = normalizePositionCategory(nextName);
      if (!normalizedNext || normalizedNext === oldName || !planId) return;
      const supabase = createClient();
      const { error: err } = await supabase
        .from("mediaplan_positionen")
        .update({ position_kategorie: normalizedNext })
        .eq("mediaplan_id", planId)
        .eq("position_kategorie", oldName);
      if (err) {
        setError(err.message);
        return;
      }
      setCustomCategoryOptions((prev) =>
        Array.from(
          new Set(
            prev.map((entry) => (entry === oldName ? normalizedNext : entry))
          )
        )
      );
      await loadPositions();
    },
    [planId, loadPositions]
  );

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
        position_kategorie: pos.position_kategorie ?? null,
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
        <MediaplanKundenInfo
          plan={plan}
          mode="full"
          editing={editPlanInfo}
          form={planForm}
          onStartEdit={() => setEditPlanInfo(true)}
          onSave={() => updatePlan()}
          onCancel={() => { setEditPlanInfo(false); setEditKundenberater(false); }}
          onFormChange={(field, value) => setPlanForm((f) => ({ ...f, [field]: value }))}
          saving={savingPlan}
        />
        <MediaplanKundenberater
          plan={plan}
          editing={editKundenberater}
          form={planForm}
          onStartEdit={isAgency ? () => setEditKundenberater(true) : undefined}
          onSave={async () => { await updatePlan(); setEditKundenberater(false); }}
          onCancel={() => {
            setPlanForm((f) => ({
              ...f,
              berater_name: plan.berater_name ?? "",
              berater_email: plan.berater_email ?? "",
              berater_telefon: plan.berater_telefon ?? "",
            }));
            setEditKundenberater(false);
          }}
          onFormChange={(field, value) => setPlanForm((f) => ({ ...f, [field]: value }))}
          agencyUsers={agencyUsers}
          saving={savingPlan}
        />
      </div>

      <div className="content-radius haupt-box space-y-4 border border-zinc-200 dark:border-zinc-700 p-4 shadow-none sm:p-5">
      <div className="pl-4 sm:pl-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Zeitplan – Übersicht</h2>
        <section className="-ml-4 sm:-ml-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <GanttChart
            plan={plan}
            positions={sortedPositionsForTimeline}
            interactive
            onRenamePosition={(positionId, title) => updatePositionDetails(positionId, { title })}
            onRenameCampaign={renameCampaignGroup}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Bestätigte Positionen ({positions.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
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
                <select
                  value={bulkCategoryValue}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setBulkCategoryValue("__new__");
                      return;
                    }
                    setBulkCategoryValue(e.target.value);
                  }}
                  className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
                >
                  <option value="">Kampagne wählen…</option>
                  <option value="__new__">+ Neue Kampagne…</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {bulkCategoryValue === "__new__" && (
                  <>
                    <input
                      type="text"
                      value={newCategoryDraft}
                      onChange={(e) => setNewCategoryDraft(e.target.value)}
                      placeholder="Name der neuen Kampagne"
                      className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const normalized = normalizePositionCategory(newCategoryDraft);
                        if (!normalized) return;
                        setCustomCategoryOptions((prev) =>
                          prev.some((v) => v.localeCompare(normalized, "de-CH", { sensitivity: "base" }) === 0)
                            ? prev
                            : [...prev, normalized]
                        );
                        setBulkCategoryValue(normalized);
                        setNewCategoryDraft("");
                      }}
                      className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                      Übernehmen
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={assignCategoryToSelection}
                  className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  {normalizePositionCategory(bulkCategoryValue) == null
                    ? `Kampagne entfernen (${selectedPositionIds.length})`
                    : `Kampagne zuweisen (${selectedPositionIds.length})`}
                </button>
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
        <div className="mt-2 space-y-2">
          {positionsByCategory.map((group) => (
            <div key={group.name}>
              {editingCampaignGroup === group.name ? (
                <div className="mb-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={campaignGroupDraft}
                    onChange={(e) => setCampaignGroupDraft(e.target.value)}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await renameCampaignGroup(group.name, campaignGroupDraft);
                      setEditingCampaignGroup(null);
                    }}
                    className="rounded bg-[#FF6554] px-2 py-1 text-xs font-semibold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div
                  className="group mb-1.5 inline-flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer"
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
                    {group.name !== "Ohne Kampagne" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCampaignGroup(group.name);
                          setCampaignGroupDraft(group.name);
                        }}
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-[#FF6554]"
                        title="Kampagne umbenennen"
                        aria-label="Kampagne umbenennen"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center justify-center"
                  >
                    <CollapsibleChevron open={!collapsedCampaignGroups[group.name]} />
                  </button>
                </div>
              )}
              {!collapsedCampaignGroups[group.name] && (
                <>
                  <ul className="space-y-1.5">
                    {group.positions.map((pos) => (
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
                        onRenameTitle={(title) => updatePositionDetails(pos.id, { title })}
                      />
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => openAddProduct(group.name)}
                    className="mt-1 flex w-full items-center justify-center rounded-xl border-2 border-transparent py-0.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-dashed hover:border-zinc-200 dark:hover:border-zinc-600 hover:bg-[#FF6554]/15 hover:text-[#FF6554]"
                  >
                    + Position in Kampagne „{group.name}“ hinzufügen
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateCampaignInput(true);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-600 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-[#FF6554]/40 hover:bg-[#FF6554]/15 hover:text-[#FF6554]"
        >
          + Kampagne erstellen
        </button>
        {showCreateCampaignInput && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newCampaignTitle}
              onChange={(e) => setNewCampaignTitle(e.target.value)}
              placeholder="Titel der Kampagne"
              className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                const normalized = normalizePositionCategory(newCampaignTitle);
                if (!normalized) return;
                setCustomCategoryOptions((prev) =>
                  prev.some((v) => v.localeCompare(normalized, "de-CH", { sensitivity: "base" }) === 0)
                    ? prev
                    : [...prev, normalized]
                );
                setShowCreateCampaignInput(false);
                setNewCampaignTitle("");
                openAddProduct(normalized);
              }}
              className="rounded-full bg-[#FF6554] px-3 py-2 text-sm font-medium text-white hover:bg-[#e55a4a]"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateCampaignInput(false);
                setNewCampaignTitle("");
              }}
              className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              Abbrechen
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaplanBudgetOverview
            bestaetigtSumme={bestaetigtSumme}
            ausstehendSumme={ausstehendSumme}
            gesamtEinmalig={gesamtEinmalig}
            totalRabatt={totalRabatt}
            summeAllePositionen={totalKundenpreis}
            maxBudgetChf={plan.max_budget_chf ?? null}
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
            {targetCategoryForAdd && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Zielkampagne: {targetCategoryForAdd}
              </p>
            )}
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
                    onClick={() => addProductAsPosition(prod, targetCategoryForAdd)}
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
