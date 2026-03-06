/** Shared types, constants and helpers for Produkte (list + edit page). */

export const CATEGORIES = [
  "Aussenwerbung",
  "KINO",
  "ÖV",
  "PRINT",
  "ONLINE",
  "HANDLING",
  "SERVICES",
  "CUSTOM",
];

export function categoryLabel(category: string): string {
  if (!category) return category;
  if (category === "ÖV") return "ÖV";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export type ProduktDateiMeta = {
  name: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
};

/** Optionen für das Verlag-Dropdown (Lieferanten). Entspricht den Lieferanten aus Kunden → Lieferanten. */
export const VERLAG_OPTIONS = [
  "Amazon Advertising",
  "Goldbach Media",
  "Google Ads",
  "Ströer Media",
];

/** Optionen für das Kanal-Dropdown (Werbeform). */
export const KANAL_OPTIONS = [
  "Plakat",
  "LED Screen",
  "Buswerbung",
  "Online Bannerwerbung",
  "Google Suchanzeigen",
  "Online In-Read Werbung",
  "Print Inserat",
  "Sponsoring",
  "Screen-FL",
  "Screen-CH",
  "Screen-AT",
  "Plakate-AT",
  "Plakate-FL/CH",
  "Plakate-FL",
  "Plakate",
  "Kino-FL + CH",
  "Kino AT",
  "Kino FL",
  "Buswerbung-FL",
  "Print-FL",
  "Print-FL/CH",
  "Print-AT",
  "Online",
  "Handling",
];

/** Optionen für das Produktgruppe-Dropdown. */
export const PRODUKTGRUPPE_OPTIONS = [
  "Liewo",
  "Vaterland",
  "Wirtschaft Regional",
  "Screen-FL",
  "Screen-CH",
  "Screen-AT",
  "Plakate-AT",
  "Plakate-FL/CH",
  "Plakate-FL",
  "Plakate",
  "Kino-FL + CH",
  "Kino AT",
  "Kino FL",
  "Buswerbung-FL",
  "Print-FL",
  "Print-FL/CH",
  "Print-AT",
  "Online",
  "Handling",
];

/** Optionen für Use Case (Mehrfachauswahl). */
export const USE_CASE_OPTIONS = ["Event", "Employer Branding", "Recruiting"] as const;
export type UseCaseOption = (typeof USE_CASE_OPTIONS)[number];

export const ZIEL_EIGNUNG_OPTIONS = ["Sichtbarkeit", "Traffic", "Conversion", "Sonstige"];
export const LAUFZEIT_OPTIONS = ["1 Woche", "2 Wochen", "1 Monat", "3 Monate", "6 Monate", "1 Jahr"];

export type Product = {
  id: string;
  archived?: boolean;
  created_at?: string;
  category: string;
  verlag: string | null;
  kanal: string | null;
  produktgruppe: string | null;
  /** Use Cases (Mehrfachauswahl): z.B. ["Event", "Employer Branding"]. */
  useCase: string[];
  /** Freitext Produktbeschreibung. */
  produktbeschreibung: string | null;
  produktvarianteTitel: string | null;
  beispielBild: string | null;
  /** Öffentliche URL des Produktbilds (Supabase Storage). */
  bildUrl: string | null;
  /** Mediadatenblätter: [{ name, path, size, type, uploaded_at }]. */
  dateien: ProduktDateiMeta[];
  platzierung: string | null;
  position: string | null;
  zusatzinformationen: string | null;
  zielEignung: string | null;
  creativeFarbe: string | null;
  creativeDateityp: string | null;
  creativeGroesse: string | null;
  creativeGroesseEinheit: "px" | "mm" | "cm" | null;
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
export const RICHTUNG_LABEL: Record<Richtung, string> = {
  vor: "vor",
  nach: "nach",
  "am gleichen Tag": "am gleichen Tag wie",
};

export type ProduktTaskConfig = {
  task_vorlage_id: string;
  tage: number;
  richtung: Richtung;
  referenz: Referenz;
};

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

export function getDefaultTaskConfig(title: string): { tage: number; richtung: Richtung; referenz: Referenz } {
  return TASK_AUTOMATION_DEFAULTS[title] ?? { tage: 0, richtung: "vor", referenz: "Enddatum" };
}

export function mapRow(row: Record<string, unknown>): Product {
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
    useCase: Array.isArray(row.use_case)
      ? (row.use_case as string[]).filter((s): s is string => typeof s === "string")
      : [],
    produktbeschreibung: row.produktbeschreibung != null ? String(row.produktbeschreibung) : null,
    produktvarianteTitel: name ? String(name) : null,
    beispielBild: row.beispiel_bild != null ? String(row.beispiel_bild) : null,
    bildUrl: row.bild_url != null ? String(row.bild_url) : null,
    dateien: Array.isArray(row.dateien)
      ? (row.dateien as ProduktDateiMeta[])
      : (typeof row.dateien === "string" ? (JSON.parse(row.dateien || "[]") as ProduktDateiMeta[]) : []),
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

export function productToRow(p: Partial<Product>): Record<string, unknown> {
  return {
    archived: p.archived ?? false,
    category: p.category ?? null,
    kategorie: p.category ?? null,
    verlag: p.verlag ?? null,
    kanal: p.kanal ?? null,
    produktgruppe: p.produktgruppe ?? null,
    use_case: p.useCase ?? [],
    produktbeschreibung: p.produktbeschreibung ?? null,
    produktvariante_titel: p.produktvarianteTitel ?? null,
    name: p.produktvarianteTitel ?? null,
    beispiel_bild: p.beispielBild ?? null,
    bild_url: p.bildUrl ?? null,
    dateien: p.dateien ?? [],
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

export function buildChangelogEntries(
  oldRow: Record<string, unknown>,
  newRow: Record<string, unknown>
): { change_description: string }[] {
  const entries: { change_description: string }[] = [];
  for (const [key, label] of Object.entries(CHANGELOG_FIELDS)) {
    const oldNorm = normalizeForCompare(key, oldRow[key]);
    const newNorm = normalizeForCompare(key, newRow[key]);
    if (oldNorm !== newNorm) {
      entries.push({
        change_description: `${label}: von ${oldNorm || "—"} auf ${newNorm || "—"}`,
      });
    }
  }
  return entries;
}

export const emptyProduct: Partial<Product> = {
  category: CATEGORIES[0],
  verlag: null,
  kanal: null,
  produktgruppe: null,
  useCase: [],
  produktbeschreibung: null,
  produktvarianteTitel: null,
  beispielBild: null,
  bildUrl: null,
  dateien: [],
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

function stringSimilarity(a: string, b: string): number {
  const sa = (a || "").trim().toLowerCase();
  const sb = (b || "").trim().toLowerCase();
  if (sa === sb) return 1;
  if (!sa || !sb) return 0;
  const maxLen = Math.max(sa.length, sb.length);
  return 1 - levenshtein(sa, sb) / maxLen;
}

export const FUZZY_MATCH_THRESHOLDS = [
  { value: 0.5, label: "50% (auch mittelähnliche)" },
  { value: 0.6, label: "60% (empfohlen)" },
  { value: 0.7, label: "70% (ähnlich)" },
  { value: 0.8, label: "80% (sehr ähnlich)" },
  { value: 0.9, label: "90% (fast identisch)" },
] as const;

export const DEFAULT_FUZZY_THRESHOLD = 0.6;

export function findSimilarProducts(
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
