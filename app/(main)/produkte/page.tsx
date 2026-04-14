"use client";

import { NeuesProduktButton } from "@/app/components/NeuesProduktButton";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel as libCategoryLabel } from "@/lib/produkte";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const CATEGORIES = [
  "Aussenwerbung",
  "KINO",
  "ÖV",
  "PRINT",
  "ONLINE",
  "HANDLING",
  "SERVICES",
  "CUSTOM",
];

const categoryLabel = libCategoryLabel;
const ZIEL_EIGNUNG_OPTIONS = ["Sichtbarkeit", "Traffic", "Conversion", "Sonstige"];
const LAUFZEIT_OPTIONS = ["1 Woche", "2 Wochen", "1 Monat", "3 Monate", "6 Monate", "1 Jahr"];

export type Product = {
  id: string;
  archived?: boolean;
  created_at?: string;
  category: string;
  verlag: string | null;
  kanal: string | null;
  produktgruppe: string | null;
  produktvarianteTitel: string | null;
  beispielBild: string | null;
  platzierung: string | null;
  position: string | null;
  zusatzinformationen: string | null;
  zielEignung: string | null;
  /** RGB oder CMYK */
  creativeFarbe: string | null;
  creativeDateityp: string | null;
  creativeGroesse: string | null;
  /** Einheit für Grösse: px, mm, cm */
  creativeGroesseEinheit: "px" | "mm" | "cm" | null;
  /** Währung für Preise */
  waehrung: "CHF" | "EUR" | null;
  creativeTyp: string | null;
  creativeDeadlineTage: number | null;
  creativeDeadlineDate: string | null;
  laufzeitProEinheit: string | null;
  preisBruttoChf: number | null;
  preisNettoChf: number | null;
  preisAgenturservice: number | null;
  mindestbudget: number | null;
  empfohlenesMedienbudget: string | null;
  buchungsvoraussetzung: string | null;
  /** Automatisierungen (Task-Vorlagen) für dieses Produkt aktiv */
  automatisierungAktiv?: boolean;
};

export type TaskVorlage = {
  id: string;
  category: string;
  title: string;
  description: string | null;
};

export const RICHTUNG_OPTIONS = ["vor", "nach", "am gleichen Tag"] as const;
export const REFERENZ_OPTIONS = ["Startdatum", "Enddatum", "Creative Deadline"] as const;
export type Richtung = (typeof RICHTUNG_OPTIONS)[number];
export type Referenz = (typeof REFERENZ_OPTIONS)[number];
/** Anzeige im Satz: "am gleichen Tag" → "am gleichen Tag wie" */
export const RICHTUNG_LABEL: Record<Richtung, string> = { vor: "vor", nach: "nach", "am gleichen Tag": "am gleichen Tag wie" };

export type ProduktTaskConfig = {
  task_vorlage_id: string;
  tage: number;
  richtung: Richtung;
  referenz: Referenz;
};

/** Standardwerte pro Task-Titel (bei Auswahl im Produkt-Modal) */
const TASK_AUTOMATION_DEFAULTS: Record<string, { tage: number; richtung: Richtung; referenz: Referenz }> = {
  "Rechnung erstellen": { tage: 1, richtung: "nach", referenz: "Enddatum" },
  "Creative Briefing erstellen": { tage: 14, richtung: "vor", referenz: "Startdatum" },
  "Plakatdruck in Auftrag geben": { tage: 10, richtung: "vor", referenz: "Startdatum" },
  "Creative Deadline": { tage: 0, richtung: "am gleichen Tag", referenz: "Creative Deadline" },
  "Kundenfreigabe einholen": { tage: 5, richtung: "vor", referenz: "Startdatum" },
  "Kampagnen-Ende prüfen": { tage: 0, richtung: "am gleichen Tag", referenz: "Enddatum" },
  "Kampagnen-Start prüfen": { tage: 0, richtung: "am gleichen Tag", referenz: "Startdatum" },
  "Materialien an Publisher senden": { tage: 7, richtung: "vor", referenz: "Startdatum" },
  "Media-Buchung vornehmen": { tage: 30, richtung: "vor", referenz: "Startdatum" },
  "Final Report erstellen": { tage: 1, richtung: "nach", referenz: "Enddatum" },
  "Zwischenbericht erstellen": { tage: 21, richtung: "vor", referenz: "Enddatum" },
};

function getDefaultTaskConfig(title: string): { tage: number; richtung: Richtung; referenz: Referenz } {
  return TASK_AUTOMATION_DEFAULTS[title] ?? { tage: 0, richtung: "vor", referenz: "Enddatum" };
}

function mapRow(row: Record<string, unknown>): Product {
  const category = row.category ?? row.kategorie ?? "";
  const name = row.produktvariante_titel ?? row.name ?? "";
  return {
    id: String(row.id),
    archived: Boolean(row.archived),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    category: String(category),
    verlag: row.verlag != null ? String(row.verlag) : null,
    kanal: row.kanal != null ? String(row.kanal) : null,
    produktgruppe: row.produktgruppe != null ? String(row.produktgruppe) : null,
    produktvarianteTitel: name ? String(name) : null,
    beispielBild: row.beispiel_bild != null ? String(row.beispiel_bild) : null,
    platzierung: row.platzierung != null ? String(row.platzierung) : null,
    position: row.position != null ? String(row.position) : null,
    zusatzinformationen: row.zusatzinformationen != null ? String(row.zusatzinformationen) : null,
    zielEignung: row.ziel_eignung != null ? String(row.ziel_eignung) : null,
    creativeFarbe: row.creative_farbe != null ? String(row.creative_farbe) : null,
    creativeDateityp: row.creative_dateityp != null ? String(row.creative_dateityp) : null,
    creativeGroesse: row.creative_groesse != null ? String(row.creative_groesse) : (row.size != null ? String(row.size) : null),
    creativeGroesseEinheit: (row.creative_groesse_einheit === "mm" || row.creative_groesse_einheit === "cm") ? row.creative_groesse_einheit : "px",
    waehrung: row.waehrung === "EUR" ? "EUR" : "CHF",
    creativeTyp: row.creative_typ != null ? String(row.creative_typ) : null,
    creativeDeadlineTage: row.creative_deadline_tage != null ? Number(row.creative_deadline_tage) : null,
    creativeDeadlineDate: row.creative_deadline_date != null ? String(row.creative_deadline_date) : null,
    laufzeitProEinheit: row.laufzeit_pro_einheit != null ? String(row.laufzeit_pro_einheit) : (row.duration != null ? String(row.duration) : null),
    preisBruttoChf: row.preis_brutto_chf != null ? Number(row.preis_brutto_chf) : null,
    preisNettoChf: row.preis_netto_chf != null ? Number(row.preis_netto_chf) : (row.net_price != null ? Number(row.net_price) : null),
    preisAgenturservice: row.preis_agenturservice != null ? Number(row.preis_agenturservice) : null,
    mindestbudget: row.mindestbudget != null ? Number(row.mindestbudget) : (row.min_budget != null ? Number(row.min_budget) : null),
    empfohlenesMedienbudget: row.empfohlenes_medienbudget != null ? String(row.empfohlenes_medienbudget) : null,
    buchungsvoraussetzung: row.buchungsvoraussetzung != null ? String(row.buchungsvoraussetzung) : null,
    automatisierungAktiv: row.automatisierung_aktiv !== false,
  };
}

const EXCEL_HEADERS = [
  "ID",
  "Kategorie",
  "Verlag",
  "Kanal",
  "Produktgruppe",
  "Produktname",
  "Platzierung",
  "Position",
  "Preis Netto CHF",
  "Mindestbudget",
  "Laufzeit",
  "Creative Grösse",
  "Ziel-Eignung",
  "Preis Brutto CHF",
  "Preis Agenturservice",
  "Empfohlenes Medienbudget",
  "Buchungsvoraussetzung",
  "Zusatzinformationen",
  "Creative Farbe",
  "Creative Dateityp",
  "Creative Typ",
  "Creative Deadline Tage",
  "Beispiel Bild",
] as const;

function productToExcelRow(p: Product): Record<string, string | number | null> {
  return {
    "ID": p.id ?? "",
    "Kategorie": p.category ?? "",
    "Verlag": p.verlag ?? "",
    "Kanal": p.kanal ?? "",
    "Produktgruppe": p.produktgruppe ?? "",
    "Produktname": p.produktvarianteTitel ?? "",
    "Platzierung": p.platzierung ?? "",
    "Position": p.position ?? "",
    "Preis Netto CHF": p.preisNettoChf ?? "",
    "Mindestbudget": p.mindestbudget ?? "",
    "Laufzeit": p.laufzeitProEinheit ?? "",
    "Creative Grösse": p.creativeGroesse ?? "",
    "Ziel-Eignung": p.zielEignung ?? "",
    "Preis Brutto CHF": p.preisBruttoChf ?? "",
    "Preis Agenturservice": p.preisAgenturservice ?? "",
    "Empfohlenes Medienbudget": p.empfohlenesMedienbudget ?? "",
    "Buchungsvoraussetzung": p.buchungsvoraussetzung ?? "",
    "Zusatzinformationen": p.zusatzinformationen ?? "",
    "Creative Farbe": p.creativeFarbe ?? "",
    "Creative Dateityp": p.creativeDateityp ?? "",
    "Creative Typ": p.creativeTyp ?? "",
    "Creative Deadline Tage": p.creativeDeadlineTage ?? "",
    "Beispiel Bild": p.beispielBild ?? "",
  };
}

function excelRowToProduct(row: Record<string, unknown>): Partial<Product> {
  const get = (key: string) => {
    const v = row[key];
    if (v == null || v === "") return null;
    return v;
  };
  const num = (key: string) => {
    const v = get(key);
    if (v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  const idVal = get("ID");
  return {
    id: idVal != null ? String(idVal) : undefined,
    category: (get("Kategorie") as string) ?? CATEGORIES[0],
    verlag: get("Verlag") as string | null,
    kanal: get("Kanal") as string | null,
    produktgruppe: get("Produktgruppe") as string | null,
    produktvarianteTitel: get("Produktname") as string | null,
    platzierung: get("Platzierung") as string | null,
    position: get("Position") as string | null,
    preisNettoChf: num("Preis Netto CHF"),
    mindestbudget: num("Mindestbudget"),
    laufzeitProEinheit: get("Laufzeit") as string | null,
    creativeGroesse: get("Creative Grösse") as string | null,
    zielEignung: get("Ziel-Eignung") as string | null,
    preisBruttoChf: num("Preis Brutto CHF"),
    preisAgenturservice: num("Preis Agenturservice"),
    empfohlenesMedienbudget: get("Empfohlenes Medienbudget") as string | null,
    buchungsvoraussetzung: get("Buchungsvoraussetzung") as string | null,
    zusatzinformationen: get("Zusatzinformationen") as string | null,
    creativeFarbe: get("Creative Farbe") as string | null,
    creativeDateityp: get("Creative Dateityp") as string | null,
    creativeTyp: get("Creative Typ") as string | null,
    creativeDeadlineTage: num("Creative Deadline Tage") ?? null,
    beispielBild: get("Beispiel Bild") as string | null,
  };
}

/** Mappt Product auf alle Spalten der vollständigen produkte-Tabelle (004). */
function productToRow(p: Partial<Product>): Record<string, unknown> {
  return {
    archived: p.archived ?? false,
    category: p.category ?? null,
    kategorie: p.category ?? null,
    verlag: p.verlag ?? null,
    kanal: p.kanal ?? null,
    produktgruppe: p.produktgruppe ?? null,
    produktvariante_titel: p.produktvarianteTitel ?? null,
    name: p.produktvarianteTitel ?? null,
    beispiel_bild: p.beispielBild ?? null,
    platzierung: p.platzierung ?? null,
    position: p.position ?? null,
    zusatzinformationen: p.zusatzinformationen ?? null,
    ziel_eignung: p.zielEignung ?? null,
    creative_farbe: p.creativeFarbe ?? null,
    creative_dateityp: p.creativeDateityp ?? null,
    creative_groesse: p.creativeGroesse ?? null,
    creative_groesse_einheit: p.creativeGroesseEinheit ?? "px",
    waehrung: p.waehrung ?? "CHF",
    creative_typ: p.creativeTyp ?? null,
    creative_deadline_tage: p.creativeDeadlineTage ?? null,
    creative_deadline_date: p.creativeDeadlineDate ?? null,
    laufzeit_pro_einheit: p.laufzeitProEinheit ?? null,
    preis_brutto_chf: p.preisBruttoChf ?? null,
    preis_netto_chf: p.preisNettoChf ?? null,
    preis_agenturservice: p.preisAgenturservice ?? null,
    mindestbudget: p.mindestbudget ?? null,
    empfohlenes_medienbudget: p.empfohlenesMedienbudget ?? null,
    buchungsvoraussetzung: p.buchungsvoraussetzung ?? null,
    automatisierung_aktiv: p.automatisierungAktiv !== false,
    spec: p.platzierung ?? null,
    placement: p.platzierung ?? null,
    size: p.creativeGroesse ?? null,
    duration: p.laufzeitProEinheit ?? null,
    net_price: p.preisNettoChf != null ? String(p.preisNettoChf) : null,
    net_total: p.preisNettoChf != null ? String(p.preisNettoChf) : null,
    min_budget: p.mindestbudget != null ? String(p.mindestbudget) : null,
  };
}

/** Spalten für Änderungshistorie (ein Key pro Anzeigename) */
const CHANGELOG_FIELDS: Record<string, string> = {
  category: "Kategorie",
  produktvariante_titel: "Produktname",
  verlag: "Verlag",
  kanal: "Kanal",
  platzierung: "Platzierung",
  position: "Position",
  ziel_eignung: "Ziel-Eignung",
  creative_groesse: "Creative Grösse",
  laufzeit_pro_einheit: "Laufzeit",
  preis_brutto_chf: "Preis Brutto CHF",
  preis_netto_chf: "Preis Netto CHF",
  preis_agenturservice: "Preis Agenturservice",
  mindestbudget: "Mindestbudget",
  creative_deadline_date: "Creative Deadline (Datum)",
  creative_deadline_tage: "Creative Deadline (Tage)",
  zusatzinformationen: "Zusatzinformationen",
  buchungsvoraussetzung: "Buchungsvoraussetzung",
  empfohlenes_medienbudget: "Empfohlenes Medienbudget",
};

const NUMERIC_CHANGELOG_KEYS = new Set([
  "preis_brutto_chf", "preis_netto_chf", "preis_agenturservice", "mindestbudget", "creative_deadline_tage",
]);

function normalizeForCompare(key: string, val: unknown): string {
  if (val == null || val === "") return "";
  if (NUMERIC_CHANGELOG_KEYS.has(key)) {
    const n = Number(val);
    return Number.isNaN(n) ? String(val).trim() : String(n);
  }
  return String(val).trim();
}

function buildChangelogEntries(
  oldRow: Record<string, unknown>,
  newRow: Record<string, unknown>
): { change_description: string }[] {
  const entries: { change_description: string }[] = [];
  for (const [key, label] of Object.entries(CHANGELOG_FIELDS)) {
    const oldNorm = normalizeForCompare(key, oldRow[key]);
    const newNorm = normalizeForCompare(key, newRow[key]);
    if (oldNorm !== newNorm) {
      const oldDisplay = oldNorm || "—";
      const newDisplay = newNorm || "—";
      entries.push({
        change_description: `${label}: von ${oldDisplay} auf ${newDisplay}`,
      });
    }
  }
  return entries;
}

const emptyProduct: Partial<Product> = {
  category: CATEGORIES[0],
  verlag: null,
  kanal: null,
  produktgruppe: null,
  produktvarianteTitel: null,
  beispielBild: null,
  platzierung: null,
  position: null,
  zusatzinformationen: null,
  zielEignung: null,
  creativeFarbe: null,
  creativeDateityp: null,
  creativeGroesse: null,
  creativeGroesseEinheit: "px",
  waehrung: "CHF",
  creativeTyp: null,
  creativeDeadlineTage: null,
  creativeDeadlineDate: null,
  laufzeitProEinheit: LAUFZEIT_OPTIONS[0],
  preisBruttoChf: null,
  preisNettoChf: null,
  preisAgenturservice: null,
  mindestbudget: null,
  empfohlenesMedienbudget: null,
  buchungsvoraussetzung: null,
  automatisierungAktiv: true,
};

function matchesSearch(p: Product, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const fields = [
    p.category,
    p.produktvarianteTitel,
    p.verlag,
    p.kanal,
    p.platzierung,
    p.produktgruppe,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return fields.some((f) => f.includes(lower));
}

function uniqueSorted(arr: (string | null)[]): string[] {
  return Array.from(new Set(arr.filter((x): x is string => x != null && x !== ""))).sort();
}

function splitMultiValue(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Levenshtein-Distanz (Anzahl Einfügen/Löschen/Ersetzen) */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[][] = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[bn][an];
}

/** Ähnlichkeit zweier Strings 0 (keine) bis 1 (identisch). */
function stringSimilarity(a: string, b: string): number {
  const sa = (a || "").trim().toLowerCase();
  const sb = (b || "").trim().toLowerCase();
  if (sa === sb) return 1;
  if (!sa || !sb) return 0;
  const maxLen = Math.max(sa.length, sb.length);
  const dist = levenshtein(sa, sb);
  return 1 - dist / maxLen;
}

/** Mögliche Schwellenwerte für Fuzzy-Match-Warnung (0–1). */
const FUZZY_MATCH_THRESHOLDS = [
  { value: 0.5, label: "50% (auch mittelähnliche)" },
  { value: 0.6, label: "60% (empfohlen)" },
  { value: 0.7, label: "70% (ähnlich)" },
  { value: 0.8, label: "80% (sehr ähnlich)" },
  { value: 0.9, label: "90% (fast identisch)" },
] as const;

const DEFAULT_FUZZY_THRESHOLD = 0.6;

/** Findet bestehende Produkte, die dem Kandidaten ähneln (Score >= threshold). */
function findSimilarProducts(
  candidate: Partial<Product>,
  existing: Product[],
  threshold: number
): { product: Product; score: number }[] {
  const nameA = (candidate.produktvarianteTitel ?? candidate.category ?? "").trim();
  const categoryA = (candidate.category ?? "").trim().toLowerCase();
  if (!nameA && !categoryA) return [];

  const withScores = existing
    .map((p) => {
      const nameB = (p.produktvarianteTitel ?? p.category ?? "").trim();
      const categoryB = (p.category ?? "").trim().toLowerCase();
      const nameSim = stringSimilarity(nameA, nameB);
      const sameCategory = categoryA && categoryB && categoryA === categoryB;
      const score = Math.min(1, nameSim * 0.85 + (sameCategory ? 0.15 : 0));
      return { product: p, score };
    })
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return withScores.slice(0, 10);
}

export default function ProduktePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showArchived = searchParams.get("tab") === "archiv";
  const searchQuery = searchParams.get("q") ?? "";

  const [filterKategorien, setFilterKategorien] = useState<string[]>([]);
  const [filterVerlage, setFilterVerlage] = useState<string[]>([]);
  const [filterKanal, setFilterKanal] = useState<string[]>([]);
  const [filterZielEignung, setFilterZielEignung] = useState<string[]>([]);
  const [filterLaufzeit, setFilterLaufzeit] = useState<string[]>([]);
  const BUDGET_MIN = 0;
  const BUDGET_MAX = 10000;
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortByCategory, setSortByCategory] = useState<"alphabetisch" | "neueste">("alphabetisch");
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFilter = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("produkte")
        .select("*")
        .order("category", { ascending: true })
        .order("id", { ascending: true });
      if (err) {
        setError(err.message);
        setProducts([]);
      } else {
        setProducts((data ?? []).map(mapRow));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleExcelExport = () => {
    const list = showArchived ? products.filter((p) => p.archived) : products.filter((p) => !p.archived);
    const rows = list.map(productToExcelRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produktkatalog");
    XLSX.writeFile(wb, `Produktkatalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
      if (rows.length === 0) {
        setImportStatus("Die Datei enthält keine Daten.");
        e.target.value = "";
        return;
      }
      const supabase = createClient();
      let inserted = 0;
      let updated = 0;
      let failed = 0;
      for (const row of rows) {
        const partial = excelRowToProduct(row);
        if (!partial.produktvarianteTitel && !partial.category) continue;
        const dbRow = productToRow(partial);
        if (partial.id) {
          const { error: err } = await supabase
            .from("produkte")
            .update(dbRow)
            .eq("id", partial.id);
          if (err) failed++;
          else updated++;
        } else {
          const { error: err } = await supabase.from("produkte").insert(dbRow);
          if (err) failed++;
          else inserted++;
        }
      }
      const { data: fresh } = await supabase.from("produkte").select("*").order("category", { ascending: true }).order("id", { ascending: true });
      if (fresh) setProducts(fresh.map(mapRow));
      const parts = [];
      if (updated) parts.push(`${updated} aktualisiert`);
      if (inserted) parts.push(`${inserted} neu angelegt`);
      if (failed) parts.push(`${failed} fehlgeschlagen`);
      setImportStatus(parts.length ? parts.join(", ") + "." : "Keine Zeilen verarbeitet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
    e.target.value = "";
  };

  const refetchProducts = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("produkte").select("*").order("category", { ascending: true }).order("id", { ascending: true });
    if (data) setProducts(data.map(mapRow));
  };

  const handleArchivieren = async (id: string) => {
    setOpenMenuId(null);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("produkte").update({ archived: true }).eq("id", id);
    if (err) {
      setError(`Archivieren fehlgeschlagen: ${err.message}`);
      return;
    }
    await refetchProducts();
  };

  const handleWiederherstellen = async (id: string) => {
    setOpenMenuId(null);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("produkte").update({ archived: false }).eq("id", id);
    if (err) {
      setError(`Wiederherstellen fehlgeschlagen: ${err.message}`);
      return;
    }
    await refetchProducts();
  };

  const handleDuplizieren = (p: Product) => {
    setOpenMenuId(null);
    router.push(`/produkte/neu?duplicate=${p.id}`);
  };

  const handleLöschen = (id: string) => {
    setOpenMenuId(null);
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const supabase = createClient();
    await supabase.from("produkte").delete().eq("id", deleteConfirmId);
    setDeleteConfirmId(null);
    await refetchProducts();
  };

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    const t = setTimeout(() => {
      window.addEventListener("click", close);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("click", close);
    };
  }, [openMenuId]);

  const visibleProducts = showArchived
    ? products.filter((p) => p.archived)
    : products.filter((p) => !p.archived);

  const filteredByCategory =
    filterKategorien.length === 0
      ? visibleProducts
      : visibleProducts.filter((p) => filterKategorien.includes(p.category));

  const filteredBySearch = filteredByCategory.filter((p) =>
    matchesSearch(p, searchQuery)
  );

  const filteredByMulti = filteredBySearch.filter((p) => {
    if (filterVerlage.length > 0 && (p.verlag == null || !filterVerlage.includes(p.verlag)))
      return false;
    if (filterKanal.length > 0 && (p.kanal == null || !filterKanal.includes(p.kanal)))
      return false;
    if (filterZielEignung.length > 0) {
      const values = splitMultiValue(p.zielEignung);
      if (!values.some((v) => filterZielEignung.includes(v))) return false;
    }
    if (filterLaufzeit.length > 0 && (p.laufzeitProEinheit == null || !filterLaufzeit.includes(p.laufzeitProEinheit)))
      return false;
    const budgetVal = p.mindestbudget ?? p.preisNettoChf ?? null;
    if (budgetMin > BUDGET_MIN || budgetMax < BUDGET_MAX) {
      if (budgetVal != null && (budgetVal < budgetMin || budgetVal > budgetMax)) return false;
    }
    return true;
  });

  const filteredProducts = filteredByMulti;

  const categoriesWithProducts = Array.from(
    new Set(filteredProducts.map((p) => p.category))
  ).sort();

  const uniqueVerlage = uniqueSorted(visibleProducts.map((p) => p.verlag));
  const uniqueKanal = uniqueSorted(visibleProducts.map((p) => p.kanal));
  const uniqueZielEignung = uniqueSorted(
    visibleProducts.flatMap((p) => splitMultiValue(p.zielEignung))
  );
  const uniqueLaufzeit = uniqueSorted(visibleProducts.map((p) => p.laufzeitProEinheit));

  const displayName = (p: Product) =>
    p.produktvarianteTitel ?? p.category ?? p.id;
  const displaySize = (p: Product) => p.creativeGroesse ?? "—";
  const displayDuration = (p: Product) => p.laufzeitProEinheit ?? "—";
  const displayNet = (p: Product) =>
    p.preisNettoChf != null ? `CHF ${p.preisNettoChf}` : "—";
  const displayMinBudget = (p: Product) =>
    p.mindestbudget != null ? `CHF ${p.mindestbudget}` : "—";

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64 shrink-0 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Filter</h3>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Kategorie</p>
          <ul className="space-y-1.5">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`kategorie-${c}`}
                  checked={filterKategorien.includes(c)}
                  onChange={() => toggleFilter(setFilterKategorien, c)}
                  className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                />
                  <label htmlFor={`kategorie-${c}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {categoryLabel(c)}
                  </label>
              </li>
            ))}
          </ul>
        </div>

        {uniqueVerlage.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Verlag</p>
            <ul className="space-y-1.5">
              {uniqueVerlage.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`verlag-${v}`}
                    checked={filterVerlage.includes(v)}
                    onChange={() => toggleFilter(setFilterVerlage, v)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`verlag-${v}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {v}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Kanal</p>
          {uniqueKanal.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Keine Kanäle verfügbar.</p>
          ) : (
            <ul className="space-y-1.5">
              {uniqueKanal.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`kanal-${k}`}
                    checked={filterKanal.includes(k)}
                    onChange={() => toggleFilter(setFilterKanal, k)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`kanal-${k}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {k}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {uniqueZielEignung.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Ziel-Eignung</p>
            <ul className="space-y-1.5">
              {uniqueZielEignung.map((z) => (
                <li key={z} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`ziel-${z}`}
                    checked={filterZielEignung.includes(z)}
                    onChange={() => toggleFilter(setFilterZielEignung, z)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`ziel-${z}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {z}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueLaufzeit.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Laufzeit</p>
            <ul className="space-y-1.5">
              {uniqueLaufzeit.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`laufzeit-${l}`}
                    checked={filterLaufzeit.includes(l)}
                    onChange={() => toggleFilter(setFilterLaufzeit, l)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`laufzeit-${l}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {l}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Budget</p>
          <div className="budget-slider relative h-6 w-full px-1">
            <div className="absolute left-0 right-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700" aria-hidden />
            <div
              className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#FF6554] dark:bg-[#ff8877]"
              style={{
                left: `${(budgetMin / BUDGET_MAX) * 100}%`,
                width: `${((budgetMax - budgetMin) / BUDGET_MAX) * 100}%`,
              }}
              aria-hidden
            />
              <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={100}
                value={budgetMin}
              onChange={(e) => {
                const v = Math.round(Number(e.target.value) / 100) * 100;
                setBudgetMin(Math.min(v, budgetMax));
              }}
              className="absolute inset-0 h-full w-full cursor-pointer"
              aria-label="Budget Minimum"
            />
              <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={100}
                value={budgetMax}
              onChange={(e) => {
                const v = Math.round(Number(e.target.value) / 100) * 100;
                setBudgetMax(Math.max(v, budgetMin));
              }}
              className="absolute inset-0 h-full w-full cursor-pointer"
              aria-label="Budget Maximum"
              />
            </div>
          <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            CHF {budgetMin.toLocaleString("de-CH")} – CHF {budgetMax === BUDGET_MAX ? "10'000+" : budgetMax.toLocaleString("de-CH")}
          </p>
        </div>

      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              {showArchived ? "Archiv" : "Produktkatalog"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {loading
                ? "Laden…"
                : `${filteredProducts.length} von ${visibleProducts.length} Produkten`}
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>Sortierung:</span>
              <select
                value={sortByCategory}
                onChange={(e) => setSortByCategory(e.target.value as "alphabetisch" | "neueste")}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="alphabetisch">Alphabetisch</option>
                <option value="neueste">Neueste zuerst</option>
              </select>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelImport}
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setExcelMenuOpen((prev) => !prev)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h2" />
                  <path d="M8 17h2" />
                  <path d="M14 13h2" />
                  <path d="M14 17h2" />
                </svg>
                <span>Import / Export</span>
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {excelMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setExcelMenuOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Excel importieren
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelMenuOpen(false);
                        handleExcelExport();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Excel exportieren
                    </button>
                  </div>
                </>
              )}
            </div>
            <NeuesProduktButton onClick={() => router.push("/produkte/neu")} />
            {importStatus && (
              <span className="text-xs text-zinc-600 dark:text-zinc-400">{importStatus}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-800 dark:text-red-200">
            <p>Fehler beim Laden: {error}</p>
            <p className="mt-2 text-red-700 dark:text-red-300">
              Falls die Tabelle noch nicht alle Spalten hat: Im Supabase Dashboard
              (SQL Editor) die Migration ausführen:{" "}
              <code className="rounded bg-red-100 dark:bg-red-900/50 px-1">
                supabase/migrations/008_produkte_groesse_einheit_waehrung.sql
              </code>
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Produkte werden geladen…</p>
        ) : (
          <div className="mt-6 space-y-6">
            {categoriesWithProducts.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400">
                {visibleProducts.length === 0
                  ? showArchived
                    ? "Keine archivierten Produkte."
                    : "Keine Produkte vorhanden. Über «Neues Produkt» anlegen."
                  : "Keine Produkte in der gewählten Kategorie."}
              </p>
            ) : (
              categoriesWithProducts.map((cat) => {
                const filtered = filteredProducts.filter((p) => p.category === cat);
                const items =
                  sortByCategory === "neueste"
                    ? [...filtered].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                    : [...filtered].sort((a, b) => (displayName(a) || "").localeCompare(displayName(b) || "", "de"));
                if (items.length === 0) return null;
                return (
                  <section key={cat} className="haupt-box dark:bg-zinc-800 p-5">
                    <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                      {categoryLabel(cat)}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {items.map((p) => (
                        <article
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Produkt bearbeiten: ${displayName(p)}`}
                          onClick={() => router.push(`/produkte/${p.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/produkte/${p.id}`);
                            }
                          }}
                          className="content-radius border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/80"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 min-w-0">
                              {displayName(p)}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId((prev) => (prev === p.id ? null : p.id));
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
                                {openMenuId === p.id && (
                                  <div
                                    className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 py-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {p.archived ? (
                                      <button
                                        type="button"
                                        onClick={() => handleWiederherstellen(p.id)}
                                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                      >
                                        Produkt wiederherstellen
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleArchivieren(p.id)}
                                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                      >
                                        Produkt archivieren
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDuplizieren(p)}
                                      className="block w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                    >
                                      Duplizieren
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleLöschen(p.id)}
                                      className="block w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    >
                                      Löschen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Verlag: {p.verlag ?? "—"} · Kanal: {p.kanal ?? "—"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Platzierung: {p.platzierung ?? "—"}
                          </p>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <dt className="text-zinc-500 dark:text-zinc-400">Grösse</dt>
                              <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                                {displaySize(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500 dark:text-zinc-400">Laufzeit</dt>
                              <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                                {displayDuration(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500 dark:text-zinc-400">Preis Netto</dt>
                              <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                                {displayNet(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500 dark:text-zinc-400">Mindestbudget</dt>
                              <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                                {displayMinBudget(p)}
                              </dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}
      </div>

      {deleteConfirmId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="content-radius w-full max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Produkt wirklich löschen?</p>
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

