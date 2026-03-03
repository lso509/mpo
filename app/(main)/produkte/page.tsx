"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  creativeFarbe: string | null;
  creativeDateityp: string | null;
  creativeGroesse: string | null;
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

function mapRow(row: Record<string, unknown>): Product {
  const category = row.category ?? row.kategorie ?? "";
  const name = row.produktvariante_titel ?? row.name ?? "";
  return {
    id: String(row.id),
    archived: Boolean(row.archived),
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
  const [selectedTaskVorlageIds, setSelectedTaskVorlageIds] = useState<string[]>([]);
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

  useEffect(() => {
    const supabase = createClient();
    supabase.from("task_vorlagen").select("id, category, title, description").order("category").order("title").then(({ data }) => {
      if (data) setTaskVorlagen(data as TaskVorlage[]);
    });
  }, []);

  useEffect(() => {
    if (productModal == null || productModal === "new") {
      setSelectedTaskVorlageIds([]);
      return;
    }
    const supabase = createClient();
    supabase.from("produkt_task_vorlagen").select("task_vorlage_id").eq("produkt_id", productModal).then(({ data }) => {
      setSelectedTaskVorlageIds((data ?? []).map((r) => r.task_vorlage_id));
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
    if (selectedTaskVorlageIds.length > 0) {
      await supabase.from("produkt_task_vorlagen").insert(
        selectedTaskVorlageIds.map((task_vorlage_id) => ({ produkt_id: produktId, task_vorlage_id }))
      );
    }
  };

  const handleSave = async (asNewVariant: boolean, overwrite: boolean) => {
    if (!editingProduct) return;
    setSaving(true);
    const supabase = createClient();
    const row = productToRow(editingProduct);

    if (productModal === "new" || asNewVariant) {
      // "Als neue Produktvariante speichern": Änderungen als neues Produkt speichern
      const { data: inserted, error: err } = await supabase.from("produkte").insert(row).select("id").single();
      if (err) setError(err.message);
      else if (inserted?.id) {
        await saveProduktTaskVorlagen(inserted.id);
        const { data } = await supabase.from("produkte").select("*");
        if (data) setProducts(data.map(mapRow));
        closeModal();
      }
    } else if (typeof productModal === "string" && overwrite) {
      // "Produkt überschreiben und alte Variante archivieren": aktuelle Version archivieren, dann neue Version anlegen
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
      // "Speichern": vorhandenes Produkt mit Änderungen überschreiben
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
    <div className="flex gap-6 bg-zinc-100 p-6">
      <aside className="w-64 shrink-0 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700">Filter</h3>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Kategorie</p>
          <ul className="space-y-1.5">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`kategorie-${c}`}
                  checked={filterKategorien.includes(c)}
                  onChange={() => toggleFilter(setFilterKategorien, c)}
                  className="h-4 w-4 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                />
                  <label htmlFor={`kategorie-${c}`} className="cursor-pointer text-sm text-zinc-700">
                    {categoryLabel(c)}
                  </label>
              </li>
            ))}
          </ul>
        </div>

        {uniqueVerlage.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Verlag</p>
            <ul className="space-y-1.5">
              {uniqueVerlage.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`verlag-${v}`}
                    checked={filterVerlage.includes(v)}
                    onChange={() => toggleFilter(setFilterVerlage, v)}
                    className="h-4 w-4 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                  />
                  <label htmlFor={`verlag-${v}`} className="cursor-pointer text-sm text-zinc-700">
                    {v}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueKanal.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Kanal</p>
            <ul className="space-y-1.5">
              {uniqueKanal.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`kanal-${k}`}
                    checked={filterKanal.includes(k)}
                    onChange={() => toggleFilter(setFilterKanal, k)}
                    className="h-4 w-4 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                  />
                  <label htmlFor={`kanal-${k}`} className="cursor-pointer text-sm text-zinc-700">
                    {k}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueZielEignung.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Ziel-Eignung</p>
            <ul className="space-y-1.5">
              {uniqueZielEignung.map((z) => (
                <li key={z} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`ziel-${z}`}
                    checked={filterZielEignung.includes(z)}
                    onChange={() => toggleFilter(setFilterZielEignung, z)}
                    className="h-4 w-4 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                  />
                  <label htmlFor={`ziel-${z}`} className="cursor-pointer text-sm text-zinc-700">
                    {z}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueLaufzeit.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Laufzeit</p>
            <ul className="space-y-1.5">
              {uniqueLaufzeit.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`laufzeit-${l}`}
                    checked={filterLaufzeit.includes(l)}
                    onChange={() => toggleFilter(setFilterLaufzeit, l)}
                    className="h-4 w-4 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                  />
                  <label htmlFor={`laufzeit-${l}`} className="cursor-pointer text-sm text-zinc-700">
                    {l}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Budget (CHF)</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="budget-min" className="shrink-0 text-xs text-zinc-500 w-8">Min</label>
              <input
                id="budget-min"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="budget-max" className="shrink-0 text-xs text-zinc-500 w-8">Max</label>
              <input
                id="budget-max"
                type="number"
                min={0}
                step={1}
                placeholder="∞"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${showArchived ? "bg-zinc-200 text-zinc-800" : "bg-zinc-700 text-white hover:bg-zinc-600"}`}
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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Excel importieren
          </button>
          <button
            type="button"
            onClick={handleExcelExport}
            className="text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            Excel herunterladen
          </button>
          {importStatus && (
            <p className="text-xs text-zinc-600">{importStatus}</p>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {showArchived ? "Archiv" : "Produktkatalog"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {loading
                ? "Laden…"
                : `${filteredProducts.length} von ${visibleProducts.length} Produkten`}
            </p>
          </header>
          <div className="flex gap-3">
            <input
              type="search"
              placeholder="Produktkatalog durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => openModal("new")}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Neues Produkt
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>Fehler beim Laden: {error}</p>
            <p className="mt-2 text-red-700">
              Falls die Tabelle noch nicht alle Spalten hat: Im Supabase Dashboard
              (SQL Editor) die Migration ausführen:{" "}
              <code className="rounded bg-red-100 px-1">
                supabase/migrations/004_produkte_vollstaendig.sql
              </code>
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500">Produkte werden geladen…</p>
        ) : (
          <div className="mt-6 space-y-6">
            {categoriesWithProducts.length === 0 ? (
              <p className="text-zinc-500">
                {visibleProducts.length === 0
                  ? showArchived
                    ? "Keine archivierten Produkte."
                    : "Keine Produkte vorhanden. Über «Neues Produkt» anlegen."
                  : "Keine Produkte in der gewählten Kategorie."}
              </p>
            ) : (
              categoriesWithProducts.map((cat) => {
                const items = filteredProducts.filter((p) => p.category === cat);
                if (items.length === 0) return null;
                return (
                  <section key={cat} className="rounded-lg bg-white p-5">
                    <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500">
                      {categoryLabel(cat)}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {items.map((p) => (
                        <article
                          key={p.id}
                          className="rounded-lg border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-zinc-950 min-w-0">
                              {displayName(p)}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openModal(p.id)}
                                className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
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
                                  className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
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
                                    className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {p.archived ? (
                                      <button
                                        type="button"
                                        onClick={() => handleWiederherstellen(p.id)}
                                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                                      >
                                        Produkt wiederherstellen
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleArchivieren(p.id)}
                                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                                      >
                                        Produkt archivieren
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDuplizieren(p)}
                                      className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                                    >
                                      Duplizieren
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleLöschen(p.id)}
                                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                      Löschen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            Verlag: {p.verlag ?? "—"} · Kanal: {p.kanal ?? "—"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Platzierung: {p.platzierung ?? "—"}
                          </p>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <dt className="text-zinc-500">Grösse</dt>
                              <dd className="font-medium text-zinc-800">
                                {displaySize(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500">Laufzeit</dt>
                              <dd className="font-medium text-zinc-800">
                                {displayDuration(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500">Preis Netto</dt>
                              <dd className="font-medium text-zinc-800">
                                {displayNet(p)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500">Mindestbudget</dt>
                              <dd className="font-medium text-zinc-800">
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
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-800">Produkt wirklich löschen?</p>
            <p className="mt-1 text-xs text-zinc-500">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
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
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-zinc-950">
              {productModal === "new" ? "Neues Produkt" : "Produkt bearbeiten"}
            </h3>

            <form
              className="mt-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(false, false);
              }}
            >
              {/* 1. Basis Informationen */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">
                  Basis Informationen
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Kategorie
                    </label>
                    <select
                      value={editingProduct.category ?? ""}
                      onChange={(e) => setField("category", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Verlag
                    </label>
                    <input
                      type="text"
                      value={editingProduct.verlag ?? ""}
                      onChange={(e) => setField("verlag", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Kanal (Werbeform)
                    </label>
                    <select
                      value={editingProduct.kanal ?? ""}
                      onChange={(e) => setField("kanal", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {KANAL_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Produktgruppe
                    </label>
                    <input
                      type="text"
                      value={editingProduct.produktgruppe ?? ""}
                      onChange={(e) => setField("produktgruppe", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Produktvariante Titel
                    </label>
                    <input
                      type="text"
                      value={editingProduct.produktvarianteTitel ?? ""}
                      onChange={(e) =>
                        setField("produktvarianteTitel", e.target.value)
                      }
                      placeholder="z.B. Liewo 1/4 Seite, Liewo 1/2 Seite"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Beispiel (Platzhalter für Bild)
                    </label>
                    <textarea
                      value={editingProduct.beispielBild ?? ""}
                      onChange={(e) => setField("beispielBild", e.target.value)}
                      rows={2}
                      placeholder="Platzhalter für zukünftige Bildfunktion"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      Diese Funktion ist derzeit deaktiviert
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Platzierung & Details */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">
                  Platzierung &amp; Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Platzierung
                    </label>
                    <textarea
                      value={editingProduct.platzierung ?? ""}
                      onChange={(e) => setField("platzierung", e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Position
                    </label>
                    <input
                      type="text"
                      value={editingProduct.position ?? ""}
                      onChange={(e) => setField("position", e.target.value)}
                      placeholder="z.B. Above the Fold - Homepage"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Zusatzinformationen für diese Produktvariante
                    </label>
                    <textarea
                      value={editingProduct.zusatzinformationen ?? ""}
                      onChange={(e) =>
                        setField("zusatzinformationen", e.target.value)
                      }
                      placeholder="z.B. Werberadius: Liechtenstein"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Ziel Eignung
                    </label>
                    <select
                      value={editingProduct.zielEignung ?? ""}
                      onChange={(e) => setField("zielEignung", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {ZIEL_EIGNUNG_OPTIONS.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* 3. Creative */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">
                  Informationen zum erforderlichen Creative
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Farbe
                    </label>
                    <input
                      type="text"
                      value={editingProduct.creativeFarbe ?? ""}
                      onChange={(e) =>
                        setField("creativeFarbe", e.target.value)
                      }
                      placeholder="z.B. RGB"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Dateityp
                    </label>
                    <input
                      type="text"
                      value={editingProduct.creativeDateityp ?? ""}
                      onChange={(e) =>
                        setField("creativeDateityp", e.target.value)
                      }
                      placeholder="z.B. PDF"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Grösse
                    </label>
                    <input
                      type="text"
                      value={editingProduct.creativeGroesse ?? ""}
                      onChange={(e) =>
                        setField("creativeGroesse", e.target.value)
                      }
                      placeholder="z.B. 728 x 90 px"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Typ
                    </label>
                    <input
                      type="text"
                      value={editingProduct.creativeTyp ?? ""}
                      onChange={(e) => setField("creativeTyp", e.target.value)}
                      placeholder="z.B. Statischer Banner oder Animiert"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Creative Deadline
                    </label>
                    <input
                      type="date"
                      value={editingProduct.creativeDeadlineDate ?? ""}
                      onChange={(e) =>
                        setField("creativeDeadlineDate", e.target.value || null)
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* 4. Preise & Budget */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">
                  Preise &amp; Budget
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Laufzeit pro Einheit
                    </label>
                    <select
                      value={editingProduct.laufzeitProEinheit ?? ""}
                      onChange={(e) =>
                        setField("laufzeitProEinheit", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      {LAUFZEIT_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Preis Brutto (CHF) pro Einheit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editingProduct.preisBruttoChf ?? ""}
                      onChange={(e) =>
                        setField(
                          "preisBruttoChf",
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Preis Netto (CHF) pro Einheit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editingProduct.preisNettoChf ?? ""}
                      onChange={(e) =>
                        setField(
                          "preisNettoChf",
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Preis Agenturservice pro Einheit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editingProduct.preisAgenturservice ?? ""}
                      onChange={(e) =>
                        setField(
                          "preisAgenturservice",
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Mindestbudget
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editingProduct.mindestbudget ?? ""}
                      onChange={(e) =>
                        setField(
                          "mindestbudget",
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500">
                      Empfohlenes Medienbudget (optional)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.empfohlenesMedienbudget ?? ""}
                      onChange={(e) =>
                        setField("empfohlenesMedienbudget", e.target.value)
                      }
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* 5. Buchungsvoraussetzung */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">
                  Buchungsvoraussetzung
                </h4>
                <textarea
                  value={editingProduct.buchungsvoraussetzung ?? ""}
                  onChange={(e) =>
                    setField("buchungsvoraussetzung", e.target.value)
                  }
                  placeholder="z.B. Meta Business Manager Setup"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </section>

              {/* Automatische Tasks für dieses Produkt */}
              <section>
                <h4 className="mb-1 text-sm font-semibold text-zinc-800">
                  Automatische Tasks für dieses Produkt
                </h4>
                <p className="mb-4 text-xs text-zinc-500">
                  Wählen Sie Tasks aus, die beim Hinzufügen dieses Produkts zu einem Mediaplan automatisch erstellt werden. Task-Vorlagen können in den Einstellungen → Task-Vorlagen verwaltet werden.
                </p>
                <div className="space-y-4">
                  {Array.from(new Set(taskVorlagen.map((t) => t.category))).map((cat) => {
                    const items = taskVorlagen.filter((t) => t.category === cat);
                    return (
                      <div key={cat}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {cat}
                        </p>
                        <ul className="space-y-2">
                          {items.map((t) => (
                            <li key={t.id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                id={`task-${t.id}`}
                                checked={selectedTaskVorlageIds.includes(t.id)}
                                onChange={() => {
                                  setSelectedTaskVorlageIds((prev) =>
                                    prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                  );
                                }}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-0 border-none bg-white shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,white_40%)]"
                              />
                              <label htmlFor={`task-${t.id}`} className="cursor-pointer text-sm">
                                <span className="font-medium text-zinc-800">{t.title}</span>
                                {t.description && (
                                  <span className="block text-xs text-zinc-500">{t.description}</span>
                                )}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
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
                      Als neue Produktvariante speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(false, true)}
                      disabled={saving}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Produkt überschreiben und alte Variante archivieren
                    </button>
                  </>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {productModal === "new"
                    ? "Neues Produkt speichern"
                    : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
