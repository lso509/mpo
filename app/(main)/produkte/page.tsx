"use client";

import { NeuesProduktButton } from "@/app/components/NeuesProduktButton";
import { createClient } from "@/lib/supabase/client";
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

function categoryLabel(category: string): string {
  if (!category) return category;
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

const KANAL_OPTIONS = ["Plakat", "Screen", "Online", "Kino", "Print", "Sonstige"];
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
  const [filterKategorien, setFilterKategorien] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerlage, setFilterVerlage] = useState<string[]>([]);
  const [filterKanal, setFilterKanal] = useState<string[]>([]);
  const [filterZielEignung, setFilterZielEignung] = useState<string[]>([]);
  const [filterLaufzeit, setFilterLaufzeit] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [productModal, setProductModal] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [taskVorlagen, setTaskVorlagen] = useState<TaskVorlage[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<ProduktTaskConfig[]>([]);
  const [aenderungshistorie, setAenderungshistorie] = useState<{ id: string; created_at: string; changed_by: string | null; change_description: string }[]>([]);
  const [sortByCategory, setSortByCategory] = useState<"alphabetisch" | "neueste">("alphabetisch");
  const [fuzzyMatchThreshold, setFuzzyMatchThreshold] = useState(DEFAULT_FUZZY_THRESHOLD);
  const [similarProductsDialog, setSimilarProductsDialog] = useState<{
    similar: { product: Product; score: number }[];
    onConfirmCreate: () => void;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Beim Öffnen des Modals geladene Task-Konfiguration (zum Erkennen von Änderungen beim Speichern) */
  const initialSelectedTasksRef = useRef<ProduktTaskConfig[]>([]);

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

  useEffect(() => {
    const supabase = createClient();
    supabase.from("task_vorlagen").select("id, category, title, description").order("category").order("title").then(({ data }) => {
      if (data) setTaskVorlagen(data as TaskVorlage[]);
    });
  }, []);

  useEffect(() => {
    if (productModal == null || productModal === "new") {
      setSelectedTasks([]);
      setAenderungshistorie([]);
      initialSelectedTasksRef.current = [];
      return;
    }
    const supabase = createClient();
    supabase
      .from("produkt_task_vorlagen")
      .select("task_vorlage_id, tage, richtung, referenz")
      .eq("produkt_id", productModal)
      .then(({ data }) => {
        const rows = data ?? [];
        const configs: ProduktTaskConfig[] = rows.map((r) => ({
          task_vorlage_id: r.task_vorlage_id as string,
          tage: Number(r.tage ?? 0),
          richtung: (r.richtung === "nach" || r.richtung === "am gleichen Tag" ? r.richtung : "vor") as Richtung,
          referenz: (REFERENZ_OPTIONS.includes(r.referenz as Referenz) ? r.referenz : "Enddatum") as Referenz,
        }));
        setSelectedTasks(configs);
        initialSelectedTasksRef.current = configs;
      });
    supabase
      .from("produkt_aenderungshistorie")
      .select("id, created_at, changed_by, change_description")
      .eq("produkt_id", productModal)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setAenderungshistorie((data ?? []) as { id: string; created_at: string; changed_by: string | null; change_description: string }[]);
      });
  }, [productModal]);

  const openModal = (id: string | "new") => {
    if (id === "new") {
      setEditingProduct({ ...emptyProduct });
    } else {
      const p = products.find((x) => x.id === id);
      setEditingProduct(p ? { ...p } : { ...emptyProduct });
    }
    setProductModal(id);
  };

  const closeModal = () => {
    setProductModal(null);
    setEditingProduct(null);
  };

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setEditingProduct((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const saveProduktTaskVorlagen = async (produktId: string) => {
    const supabase = createClient();
    await supabase.from("produkt_task_vorlagen").delete().eq("produkt_id", produktId);
    if (selectedTasks.length > 0) {
      await supabase.from("produkt_task_vorlagen").insert(
        selectedTasks.map((t) => ({
          produkt_id: produktId,
          task_vorlage_id: t.task_vorlage_id,
          tage: t.tage,
          richtung: t.richtung,
          referenz: t.referenz,
        }))
      );
    }
  };

  const handleSave = async (asNewVariant: boolean, overwrite: boolean) => {
    if (!editingProduct) return;
    setSaving(true);
    const supabase = createClient();
    const row = productToRow(editingProduct);

    if (productModal === "new" || asNewVariant) {
      // Fuzzy-Check: ähnliche Produkte?
      const existing = products.filter((p) => !p.archived);
      const similar = findSimilarProducts(editingProduct, existing, fuzzyMatchThreshold);
      if (similar.length > 0) {
        setSimilarProductsDialog({
          similar,
          onConfirmCreate: () => {
            setSimilarProductsDialog(null);
            setSaving(true);
            supabase.from("produkte").insert(row).select("id").single().then(({ data: inserted, error: err }) => {
              if (err) setError(err.message);
              else if (inserted?.id) {
                saveProduktTaskVorlagen(inserted.id).then(() => {
                  supabase.from("produkte").select("*").then(({ data }) => {
                    if (data) setProducts(data.map(mapRow));
                    closeModal();
                  });
                });
              }
              setSaving(false);
            });
          },
        });
        setSaving(false);
        return;
      }
      // Keine ähnlichen: direkt einfügen
      const { data: inserted, error: err } = await supabase.from("produkte").insert(row).select("id").single();
      if (err) setError(err.message);
      else if (inserted?.id) {
        await saveProduktTaskVorlagen(inserted.id);
        const { data } = await supabase.from("produkte").select("*");
        if (data) setProducts(data.map(mapRow));
        closeModal();
      }
    } else if (typeof productModal === "string" && overwrite) {
      // "Ersetzen & Archivieren": aktuelle Version archivieren, dann neue Version anlegen
      await supabase.from("produkte").update({ archived: true }).eq("id", productModal);
      const { data: inserted, error: err } = await supabase.from("produkte").insert(row).select("id").single();
      if (err) setError(err.message);
      else if (inserted?.id) {
        await saveProduktTaskVorlagen(inserted.id);
        const { data } = await supabase.from("produkte").select("*");
        if (data) setProducts(data.map(mapRow));
        closeModal();
      }
    } else if (typeof productModal === "string") {
      // "Speichern": vorhandenes Produkt mit Änderungen überschreiben + Änderungshistorie
      const { data: currentRow } = await supabase.from("produkte").select("*").eq("id", productModal).single();
      const historyEntries: { change_description: string }[] = [];

      if (currentRow) {
        const fieldEntries = buildChangelogEntries(currentRow as Record<string, unknown>, row as Record<string, unknown>);
        historyEntries.push(...fieldEntries);
      }

      // Task-Vorlagen geändert?
      const initialIds = initialSelectedTasksRef.current.map((t) => t.task_vorlage_id).sort();
      const currentIds = selectedTasks.map((t) => t.task_vorlage_id).sort();
      const initialStr = JSON.stringify(initialSelectedTasksRef.current.map((t) => ({ ...t })).sort((a, b) => a.task_vorlage_id.localeCompare(b.task_vorlage_id)));
      const currentStr = JSON.stringify([...selectedTasks].sort((a, b) => a.task_vorlage_id.localeCompare(b.task_vorlage_id)));
      const tasksEqual = initialStr === currentStr;
      if (!tasksEqual) {
        historyEntries.push({
          change_description: `Automatische Tasks: von ${initialIds.length} auf ${currentIds.length} Vorlagen`,
        });
      }

      if (historyEntries.length > 0) {
        const { error: histErr } = await supabase.from("produkt_aenderungshistorie").insert(
          historyEntries.map((e) => ({ produkt_id: productModal, changed_by: null, change_description: e.change_description }))
        );
        if (histErr) setError(`Änderungshistorie: ${histErr.message}`);
      }

      const { error: err } = await supabase.from("produkte").update(row).eq("id", productModal);
      if (err) setError(err.message);
      else {
        await saveProduktTaskVorlagen(productModal);
        const { data } = await supabase.from("produkte").select("*");
        if (data) setProducts(data.map(mapRow));
        closeModal();
      }
    }
    setSaving(false);
  };

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
    setEditingProduct({ ...p, id: undefined });
    setProductModal("new");
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
    if (filterZielEignung.length > 0 && (p.zielEignung == null || !filterZielEignung.includes(p.zielEignung)))
      return false;
    if (filterLaufzeit.length > 0 && (p.laufzeitProEinheit == null || !filterLaufzeit.includes(p.laufzeitProEinheit)))
      return false;
    const budgetVal = p.mindestbudget ?? p.preisNettoChf ?? null;
    if (budgetMin !== "") {
      const min = Number(budgetMin);
      if (!Number.isNaN(min) && (budgetVal == null || budgetVal < min)) return false;
    }
    if (budgetMax !== "") {
      const max = Number(budgetMax);
      if (!Number.isNaN(max) && (budgetVal == null || budgetVal > max)) return false;
    }
    return true;
  });

  const filteredProducts = filteredByMulti;

  const categoriesWithProducts = Array.from(
    new Set(filteredProducts.map((p) => p.category))
  ).sort();

  const uniqueVerlage = uniqueSorted(visibleProducts.map((p) => p.verlag));
  const uniqueKanal = uniqueSorted(visibleProducts.map((p) => p.kanal));
  const uniqueZielEignung = uniqueSorted(visibleProducts.map((p) => p.zielEignung));
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
    <div className="flex gap-6 bg-zinc-100 dark:bg-zinc-900 p-6">
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
                  className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#3f3f46_40%)]"
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
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`verlag-${v}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {v}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueKanal.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Kanal</p>
            <ul className="space-y-1.5">
              {uniqueKanal.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`kanal-${k}`}
                    checked={filterKanal.includes(k)}
                    onChange={() => toggleFilter(setFilterKanal, k)}
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#3f3f46_40%)]"
                  />
                  <label htmlFor={`kanal-${k}`} className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    {k}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#3f3f46_40%)]"
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
                    className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#3f3f46_40%)]"
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
          <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Budget (CHF)</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="budget-min" className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400 w-8">Min</label>
              <input
                id="budget-min"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="w-full rounded border border-zinc-200 dark:border-zinc-600 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="budget-max" className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400 w-8">Max</label>
              <input
                id="budget-max"
                type="number"
                min={0}
                step={1}
                placeholder="∞"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-full rounded border border-zinc-200 dark:border-zinc-600 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${showArchived ? "bg-zinc-200 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100" : "bg-zinc-700 dark:bg-zinc-600 text-white hover:bg-zinc-600 dark:hover:bg-zinc-500"}`}
          >
            {showArchived ? "Zurück zum Katalog" : "Archiv"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelImport}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Excel importieren
          </button>
          <button
            type="button"
            onClick={handleExcelExport}
            className="text-sm text-zinc-500 dark:text-zinc-400 underline hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Excel herunterladen
          </button>
          {importStatus && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{importStatus}</p>
          )}
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
                className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="alphabetisch">Alphabetisch</option>
                <option value="neueste">Neueste zuerst</option>
              </select>
            </label>
            <input
              type="search"
              placeholder="Produktkatalog durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            <NeuesProduktButton onClick={() => openModal("new")} />
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
                  <section key={cat} className="rounded-lg border-t-4 border-violet-500 bg-white dark:bg-zinc-800 p-5">
                    <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                      {categoryLabel(cat)}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {items.map((p) => (
                        <article
                          key={p.id}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 min-w-0">
                              {displayName(p)}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openModal(p.id)}
                                className="rounded-lg border border-zinc-200 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                title="Bearbeiten"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId((prev) => (prev === p.id ? null : p.id));
                                  }}
                                  className="rounded-lg border border-zinc-200 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
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
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Produkt wirklich löschen?</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {productModal != null && editingProduct != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="shrink-0 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 text-xl font-semibold text-zinc-950 dark:text-zinc-100">
              {productModal === "new" ? "Neues Produkt" : "Produkt bearbeiten"}
            </h3>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(false, false);
              }}
            >
              <div className="flex-1 overflow-y-auto p-6">
                {/* 1. Basis-Infos */}
                <section className="mb-6">
                  <h4 className="mb-3 rounded-lg border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Basis-Infos
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-700">Produktvariante Titel</label>
                      <input
                        type="text"
                        value={editingProduct.produktvarianteTitel ?? ""}
                        onChange={(e) => setField("produktvarianteTitel", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. Liewo 1/4 Seite, Liewo 1/2 Seite</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Kategorie</label>
                      <select
                        value={editingProduct.category ?? ""}
                        onChange={(e) => setField("category", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{categoryLabel(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Verlag</label>
                      <input
                        type="text"
                        value={editingProduct.verlag ?? ""}
                        onChange={(e) => setField("verlag", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Kanal (Werbeform)</label>
                      <select
                        value={editingProduct.kanal ?? ""}
                        onChange={(e) => setField("kanal", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {KANAL_OPTIONS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Produktgruppe</label>
                      <input
                        type="text"
                        value={editingProduct.produktgruppe ?? ""}
                        onChange={(e) => setField("produktgruppe", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-700">Beispiel (Platzhalter für Bild)</label>
                      <textarea
                        value={editingProduct.beispielBild ?? ""}
                        onChange={(e) => setField("beispielBild", e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">Platzhalter für zukünftige Bildfunktion. Diese Funktion ist derzeit deaktiviert.</p>
                    </div>
                  </div>
                </section>

                {/* 2. Placement & Kreativ-Specs */}
                <section className="mb-6">
                  <h4 className="mb-3 rounded-lg border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Placement &amp; Kreativ-Specs
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-700">Platzierung</label>
                      <textarea
                        value={editingProduct.platzierung ?? ""}
                        onChange={(e) => setField("platzierung", e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Position</label>
                      <input
                        type="text"
                        value={editingProduct.position ?? ""}
                        onChange={(e) => setField("position", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. Above the Fold – Homepage</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Ziel-Eignung</label>
                      <select
                        value={editingProduct.zielEignung ?? ""}
                        onChange={(e) => setField("zielEignung", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {ZIEL_EIGNUNG_OPTIONS.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-700">Zusatzinformationen für diese Produktvariante</label>
                      <textarea
                        value={editingProduct.zusatzinformationen ?? ""}
                        onChange={(e) => setField("zusatzinformationen", e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. Werberadius: Liechtenstein</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Farbraum</label>
                      <select
                        value={editingProduct.creativeFarbe === "RGB" || editingProduct.creativeFarbe === "CMYK" ? editingProduct.creativeFarbe : ""}
                        onChange={(e) => setField("creativeFarbe", e.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        <option value="RGB">RGB</option>
                        <option value="CMYK">CMYK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Dateityp</label>
                      <input
                        type="text"
                        value={editingProduct.creativeDateityp ?? ""}
                        onChange={(e) => setField("creativeDateityp", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. PDF</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Grösse</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <input
                          type="text"
                          value={editingProduct.creativeGroesse ?? ""}
                          onChange={(e) => setField("creativeGroesse", e.target.value)}
                          className="min-w-0 flex-1 rounded-l-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                        <select
                          value={editingProduct.creativeGroesseEinheit ?? "px"}
                          onChange={(e) => setField("creativeGroesseEinheit", e.target.value as "px" | "mm" | "cm")}
                          className="rounded-r-lg border-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-600 focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="px">px</option>
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">z.B. 728 x 90 (px) oder 210 x 297 (mm)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Typ</label>
                      <input
                        type="text"
                        value={editingProduct.creativeTyp ?? ""}
                        onChange={(e) => setField("creativeTyp", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. Statischer Banner oder Animiert</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Creative Deadline</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <span className="flex items-center rounded-l-lg bg-zinc-100 pl-3 pr-2 text-zinc-500" aria-hidden>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                        </span>
                        <input
                          type="date"
                          value={editingProduct.creativeDeadlineDate ?? ""}
                          onChange={(e) => setField("creativeDeadlineDate", e.target.value || null)}
                          className="min-w-0 flex-1 rounded-r-lg border-0 py-2 pr-3 pl-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Preise & Budget */}
                <section className="mb-6">
                  <h4 className="mb-3 rounded-lg border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Preise &amp; Budget
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Währung</label>
                      <select
                        value={editingProduct.waehrung ?? "CHF"}
                        onChange={(e) => setField("waehrung", e.target.value as "CHF" | "EUR")}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        <option value="CHF">CHF</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Laufzeit pro Einheit</label>
                      <select
                        value={editingProduct.laufzeitProEinheit ?? ""}
                        onChange={(e) => setField("laufzeitProEinheit", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      >
                        {LAUFZEIT_OPTIONS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Preis Brutto pro Einheit</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={editingProduct.preisBruttoChf ?? ""}
                          onChange={(e) =>
                            setField("preisBruttoChf", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="min-w-0 flex-1 rounded-l-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="flex items-center rounded-r-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">{editingProduct.waehrung ?? "CHF"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Preis Netto pro Einheit</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={editingProduct.preisNettoChf ?? ""}
                          onChange={(e) =>
                            setField("preisNettoChf", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="min-w-0 flex-1 rounded-l-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="flex items-center rounded-r-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">{editingProduct.waehrung ?? "CHF"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Preis Agenturservice pro Einheit</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={editingProduct.preisAgenturservice ?? ""}
                          onChange={(e) =>
                            setField("preisAgenturservice", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="min-w-0 flex-1 rounded-l-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="flex items-center rounded-r-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">{editingProduct.waehrung ?? "CHF"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Mindestbudget</label>
                      <div className="mt-1 flex rounded-lg border border-zinc-200">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={editingProduct.mindestbudget ?? ""}
                          onChange={(e) =>
                            setField("mindestbudget", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="min-w-0 flex-1 rounded-l-lg border-0 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="flex items-center rounded-r-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">{editingProduct.waehrung ?? "CHF"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">Empfohlenes Medienbudget (optional)</label>
                      <input
                        type="text"
                        value={editingProduct.empfohlenesMedienbudget ?? ""}
                        onChange={(e) => setField("empfohlenesMedienbudget", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-700">Buchungsvoraussetzung</label>
                      <textarea
                        value={editingProduct.buchungsvoraussetzung ?? ""}
                        onChange={(e) => setField("buchungsvoraussetzung", e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-zinc-600">z.B. Meta Business Manager Setup</p>
                    </div>
                  </div>
                </section>

                {/* 4. Automatisierung */}
                <section className="mb-6">
                  <h4 className="mb-3 rounded-lg border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Automatisierung
                  </h4>
                  <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
                    Tasks, die beim Hinzufügen dieses Produkts zu einem Mediaplan automatisch erstellt werden. Verwaltung: Einstellungen → Task-Vorlagen.
                  </p>

                  <div className="space-y-4">
                    {Array.from(new Set(taskVorlagen.map((t) => t.category))).map((cat) => {
                      const items = taskVorlagen.filter((t) => t.category === cat);
                      return (
                        <div key={cat}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {cat}
                          </p>
                          <div className="flex flex-col gap-1">
                            {items.map((t) => {
                              const cfg = selectedTasks.find((c) => c.task_vorlage_id === t.id);
                              const selected = cfg != null;
                              const isGleicherTag = cfg?.richtung === "am gleichen Tag";
                              const tagTage = cfg ? (cfg.tage === 1 ? "Tag" : "Tage") : "Tage";
                              const inputClass = isGleicherTag
                                ? "cursor-not-allowed border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500"
                                : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";
                              return (
                                <div key={t.id} className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTasks((prev) => {
                                        if (prev.some((c) => c.task_vorlage_id === t.id)) {
                                          return prev.filter((c) => c.task_vorlage_id !== t.id);
                                        }
                                        const def = getDefaultTaskConfig(t.title);
                                        return [...prev, { task_vorlage_id: t.id, ...def }];
                                      });
                                    }}
                                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                                      selected
                                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/40 text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/30"
                                        : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    <span className="font-medium">{t.title}</span>
                                    {t.description && (
                                      <span className="mt-0.5 block text-xs opacity-90">{t.description}</span>
                                    )}
                                  </button>
                                  {selected && cfg && (
                                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50 pl-4 pr-3 py-2">
                                      <span className="text-zinc-600 dark:text-zinc-400">[</span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={cfg.tage}
                                        disabled={isGleicherTag}
                                        onChange={(e) => {
                                          const v = parseInt(e.target.value, 10);
                                          setSelectedTasks((prev) =>
                                            prev.map((x) =>
                                              x.task_vorlage_id === cfg.task_vorlage_id ? { ...x, tage: Number.isNaN(v) ? 0 : Math.max(0, v) } : x
                                            )
                                          );
                                        }}
                                        className={`w-14 rounded border px-2 py-1 text-sm ${inputClass}`}
                                        aria-label="Tage"
                                      />
                                      <span className="text-zinc-600 dark:text-zinc-400">]</span>
                                      <span className="text-zinc-600 dark:text-zinc-400">{tagTage}</span>
                                      <span className="text-zinc-600 dark:text-zinc-400">[</span>
                                      <select
                                        value={cfg.richtung}
                                        onChange={(e) =>
                                          setSelectedTasks((prev) =>
                                            prev.map((x) =>
                                              x.task_vorlage_id === cfg.task_vorlage_id ? { ...x, richtung: e.target.value as Richtung } : x
                                            )
                                          )
                                        }
                                        className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100"
                                        aria-label="Richtung"
                                      >
                                        {RICHTUNG_OPTIONS.map((r) => (
                                          <option key={r} value={r}>{RICHTUNG_LABEL[r]}</option>
                                        ))}
                                      </select>
                                      <span className="text-zinc-600 dark:text-zinc-400">]</span>
                                      <span className="text-zinc-600 dark:text-zinc-400">[</span>
                                      <select
                                        value={cfg.referenz}
                                        onChange={(e) =>
                                          setSelectedTasks((prev) =>
                                            prev.map((x) =>
                                              x.task_vorlage_id === cfg.task_vorlage_id ? { ...x, referenz: e.target.value as Referenz } : x
                                            )
                                          )
                                        }
                                        className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100"
                                        aria-label="Referenz"
                                      >
                                        {REFERENZ_OPTIONS.map((r) => (
                                          <option key={r} value={r}>{r}</option>
                                        ))}
                                      </select>
                                      <span className="text-zinc-600 dark:text-zinc-400">]</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {productModal === "new" && (
                  <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3">
                    <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                      <span>Warnung bei Ähnlichkeit ab:</span>
                      <select
                        value={fuzzyMatchThreshold}
                        onChange={(e) => setFuzzyMatchThreshold(Number(e.target.value))}
                        className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                      >
                        {FUZZY_MATCH_THRESHOLDS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-1 text-xs text-zinc-600">
                      Beim Speichern wird geprüft, ob ähnliche Produkte existieren. Je niedriger der Wert, desto mehr Treffer.
                    </p>
                  </section>
                )}

                {productModal !== "new" && (
                  <section className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <h4 className="mb-3 text-sm font-semibold text-zinc-700">
                      Änderungshistorie
                    </h4>
                  {aenderungshistorie.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Noch keine Änderungen erfasst.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {aenderungshistorie.map((e) => {
                        const at = e.created_at
                          ? new Date(e.created_at).toLocaleString("de-CH", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";
                        return (
                          <li
                            key={e.id}
                            className="rounded-lg border border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
                          >
                            <span className="font-medium">{e.change_description}</span>
                            <span className="mx-2 text-zinc-400">·</span>
                            <span className="text-zinc-500">am {at}</span>
                            {e.changed_by && (
                              <>
                                <span className="mx-2 text-zinc-400">·</span>
                                <span className="text-zinc-500">{e.changed_by}</span>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  </section>
                )}
              </div>
              <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Abbrechen
                  </button>
                  {productModal !== "new" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSave(true, false)}
                        disabled={saving}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        Variante erstellen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(false, true)}
                        disabled={saving}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        Ersetzen & Archivieren
                      </button>
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {productModal === "new" ? "Neues Produkt speichern" : "Speichern"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Ähnliche Produkte gefunden */}
      {similarProductsDialog != null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSimilarProductsDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Ähnliche Produkte gefunden
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Es gibt bereits {similarProductsDialog.similar.length} Produkt
              {similarProductsDialog.similar.length === 1 ? "" : "e"}, die dem neuen sehr ähneln.
              Trotzdem neu anlegen oder ein bestehendes verwenden?
            </p>
            <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {similarProductsDialog.similar.map(({ product, score }) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProductModal(product.id);
                      setEditingProduct({ ...product });
                      setSimilarProductsDialog(null);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-200 dark:hover:border-violet-600"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {product.produktvarianteTitel ?? product.category ?? product.id}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
                      {Math.round(score * 100)}% ähnlich
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSimilarProductsDialog(null)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => similarProductsDialog.onConfirmCreate()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Trotzdem neu anlegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
