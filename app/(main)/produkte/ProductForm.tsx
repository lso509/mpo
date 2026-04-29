"use client";

import {
  CATEGORIES,
  categoryLabel,
  DEFAULT_FUZZY_THRESHOLD,
  DEFAULT_MM_TARIFFS,
  FUZZY_MATCH_THRESHOLDS,
  getDefaultTaskConfig,
  MM_TARIFF_CATEGORY_OPTIONS,
  KANAL_OPTIONS,
  PRODUKTGRUPPE_OPTIONS,
  USE_CASE_OPTIONS,
  VERLAG_OPTIONS,
  type Product,
  type ProduktTaskConfig,
  REFERENZ_OPTIONS,
  RICHTUNG_LABEL,
  RICHTUNG_OPTIONS,
  type Richtung,
  type Referenz,
  type TaskVorlage,
  parseZielEignung,
  ZIEL_OPTIONS,
} from "@/lib/produkte";
import { ProduktBildUpload } from "@/app/components/produkte/ProduktBildUpload";
import { ProduktDateienUpload } from "@/app/components/produkte/ProduktDateienUpload";
import { FeedbackMarker } from "@/app/components/FeedbackMarker";
import { CollapsibleChevron } from "@/components/shared/CollapsibleChevron";
import { useEffect, useState } from "react";

type AenderungshistorieEntry = {
  id: string;
  created_at: string;
  changed_by: string | null;
  change_description: string;
};

type ProductFormProps = {
  product: Partial<Product>;
  setField: <K extends keyof Product>(key: K, value: Product[K]) => void;
  onSave: (asNewVariant: boolean, overwrite: boolean) => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
  productId: string | null;
  taskVorlagen: TaskVorlage[];
  selectedTasks: ProduktTaskConfig[];
  setSelectedTasks: React.Dispatch<React.SetStateAction<ProduktTaskConfig[]>>;
  aenderungshistorie: AenderungshistorieEntry[];
  fuzzyMatchThreshold?: number;
  setFuzzyMatchThreshold?: (v: number) => void;
  /** Lieferanten-Firmennamen aus DB (für Verlag-Dropdown). Falls leer, wird VERLAG_OPTIONS verwendet. */
  verlagOptions?: string[];
};

export function ProductForm({
  product,
  setField,
  onSave,
  onCancel,
  saving,
  isNew,
  productId,
  taskVorlagen,
  selectedTasks,
  setSelectedTasks,
  aenderungshistorie,
  fuzzyMatchThreshold = DEFAULT_FUZZY_THRESHOLD,
  setFuzzyMatchThreshold,
  verlagOptions: verlagOptionsProp,
}: ProductFormProps) {
  const KANAL_PRODUKTGRUPPE_STORAGE_KEY = "produkte.kanal-produktgruppe.options.v1";
  const verlagOptionsList = (verlagOptionsProp?.length ? verlagOptionsProp : VERLAG_OPTIONS) as string[];
  const [kanalProduktgruppeOptions, setKanalProduktgruppeOptions] = useState<string[]>(() => {
    const sortOptions = (values: string[]) =>
      [...values].sort((a, b) => a.localeCompare(b, "de-CH", { sensitivity: "base" }));
    const baseDefaults = Array.from(new Set([...KANAL_OPTIONS, ...PRODUKTGRUPPE_OPTIONS]));

    if (typeof window === "undefined") return sortOptions(baseDefaults);
    try {
      const raw = window.localStorage.getItem(KANAL_PRODUKTGRUPPE_STORAGE_KEY);
      if (!raw) return sortOptions(baseDefaults);
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return sortOptions(baseDefaults);
      const cleaned = Array.from(
        new Set(
          parsed
            .map((x) => (typeof x === "string" ? x.trim() : ""))
            .filter(Boolean)
        )
      );
      return cleaned.length > 0 ? sortOptions(cleaned) : sortOptions(baseDefaults);
    } catch {
      return sortOptions(baseDefaults);
    }
  });
  const [showProduktgruppeModal, setShowProduktgruppeModal] = useState(false);
  const [newProduktgruppe, setNewProduktgruppe] = useState("");
  const PRODUCT_FORM_SECTIONS = ["basis", "placement", "preise", "automatisierung", "historie"] as const;
  type ProductFormSection = (typeof PRODUCT_FORM_SECTIONS)[number];
  const [openSections, setOpenSections] = useState<Record<ProductFormSection, boolean>>(
    () => Object.fromEntries(PRODUCT_FORM_SECTIONS.map((k) => [k, true])) as Record<ProductFormSection, boolean>
  );
  const isSectionOpen = (id: ProductFormSection) => openSections[id] !== false;
  const toggleSection = (id: ProductFormSection) => {
    setOpenSections((s) => ({ ...s, [id]: !isSectionOpen(id) }));
  };
  const expandAllProductSections = () => {
    setOpenSections(
      Object.fromEntries(PRODUCT_FORM_SECTIONS.map((k) => [k, true])) as Record<ProductFormSection, boolean>
    );
  };
  const collapseAllProductSections = () => {
    setOpenSections(
      Object.fromEntries(PRODUCT_FORM_SECTIONS.map((k) => [k, false])) as Record<ProductFormSection, boolean>
    );
  };
  const zielSelectValue = parseZielEignung(product.zielEignung);
  const isPerMm = product.pricingType === "per_mm";
  const mmTariffs = product.mmTariffs ?? [];
  const fixedFormats = product.fixedFormats ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KANAL_PRODUKTGRUPPE_STORAGE_KEY, JSON.stringify(kanalProduktgruppeOptions));
  }, [kanalProduktgruppeOptions]);

  const addMmTariff = () => {
    setField("mmTariffs", [
      ...mmTariffs,
      {
        category: MM_TARIFF_CATEGORY_OPTIONS[0],
        pricePerMmNa: null,
        pricePerMmGa: null,
        columnWidths: [],
        sortOrder: mmTariffs.length,
      },
    ]);
  };
  const removeMmTariff = (idx: number) => {
    setField(
      "mmTariffs",
      mmTariffs
        .filter((_, i) => i !== idx)
        .map((row, i) => ({ ...row, sortOrder: i }))
    );
  };
  const updateMmTariff = (idx: number, patch: Partial<(typeof mmTariffs)[number]>) => {
    setField(
      "mmTariffs",
      mmTariffs.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addFixedFormat = () => {
    setField("fixedFormats", [
      ...fixedFormats,
      {
        formatName: "",
        widthMm: null,
        heightMm: null,
        columns: null,
        priceNa: null,
        priceGa: null,
        formatType: "annonce",
        sortOrder: fixedFormats.length,
      },
    ]);
  };
  const removeFixedFormat = (idx: number) => {
    setField(
      "fixedFormats",
      fixedFormats
        .filter((_, i) => i !== idx)
        .map((row, i) => ({ ...row, sortOrder: i }))
    );
  };
  const updateFixedFormat = (idx: number, patch: Partial<(typeof fixedFormats)[number]>) => {
    setField(
      "fixedFormats",
      fixedFormats.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(false, false);
      }}
    >
      <div className="p-6 pb-32">
        <div className="mb-0 flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 pr-5">
          <button
            type="button"
            onClick={expandAllProductSections}
            className="p-0 text-left text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Alle aufklappen
          </button>
          <button
            type="button"
            onClick={collapseAllProductSections}
            className="p-0 text-left text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Alle zuklappen
          </button>
        </div>

        <div className="space-y-6">
        {/* 1. Basis-Infos */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0">
          <button
            type="button"
            onClick={() => toggleSection("basis")}
            aria-expanded={isSectionOpen("basis")}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left -mx-1 rounded-xl px-1 py-0.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40"
          >
            <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Basis-Infos</h4>
            <CollapsibleChevron open={isSectionOpen("basis")} />
          </button>
          {isSectionOpen("basis") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Produktvariante Titel</label>
              <input
                type="text"
                value={product.produktvarianteTitel ?? ""}
                onChange={(e) => setField("produktvarianteTitel", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">z.B. Liewo 1/4 Seite, Liewo 1/2 Seite</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Produkttyp</label>
              <select
                value={product.pricingType ?? "fixed"}
                onChange={(e) => {
                  const nextPricing = e.target.value as "fixed" | "per_mm";
                  setField("pricingType", nextPricing);
                  if (nextPricing === "per_mm" && (product.mmTariffs?.length ?? 0) === 0) {
                    setField(
                      "mmTariffs",
                      DEFAULT_MM_TARIFFS.map((row) => ({ ...row, columnWidths: [...row.columnWidths] }))
                    );
                  }
                }}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="fixed">Standardformat</option>
                <option value="per_mm">Individualformat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kategorie</label>
              <select
                value={product.category ?? ""}
                onChange={(e) => setField("category", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Verlag (Lieferant)</label>
              <select
                value={product.verlag ?? ""}
                onChange={(e) => setField("verlag", e.target.value || null)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {product.verlag && !verlagOptionsList.includes(product.verlag) && (
                  <option value={product.verlag}>{product.verlag}</option>
                )}
                {verlagOptionsList.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kanal / Produktgruppe</label>
              <div className="mt-1 flex items-center gap-2">
                <select
                  value={product.produktgruppe ?? product.kanal ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setField("kanal", value);
                    setField("produktgruppe", value);
                  }}
                  className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {kanalProduktgruppeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowProduktgruppeModal(true)}
                  className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
            {isPerMm && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Erscheinungsweise</label>
                <select
                  value={product.editionType ?? "na"}
                  onChange={(e) => setField("editionType", e.target.value as "na" | "ga")}
                  className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  <option value="na">täglich</option>
                  <option value="ga">wöchentlich</option>
                </select>
              </div>
            )}
            {isPerMm && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Auflage</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={product.auflage ?? ""}
                  onChange={(e) => setField("auflage", e.target.value === "" ? null : parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">Use Case</p>
              <ul className="mt-1 space-y-1.5">
                {USE_CASE_OPTIONS.map((opt) => {
                  const selected = (product.useCase ?? []).includes(opt);
                  return (
                    <li key={opt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`use-case-${opt.replace(/\s+/g, "-")}`}
                        checked={selected}
                        onChange={() => {
                          const current = product.useCase ?? [];
                          const next = selected
                            ? current.filter((x) => x !== opt)
                            : [...current, opt];
                          setField("useCase", next);
                        }}
                        className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                      />
                      <label
                        htmlFor={`use-case-${opt.replace(/\s+/g, "-")}`}
                        className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        {opt}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Produktbeschreibung</label>
              <textarea
                value={product.produktbeschreibung ?? ""}
                onChange={(e) => setField("produktbeschreibung", e.target.value || null)}
                rows={3}
                placeholder="Kurze Beschreibung des Produkts …"
                className="mt-1 w-full rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#FF6554] focus:outline-none focus:ring-1 focus:ring-[#FF6554]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Produktbild</label>
              <ProduktBildUpload
                produktId={productId}
                bildUrl={product.bildUrl ?? null}
                onBildUrlChange={(url) => setField("bildUrl", url)}
                disabled={saving}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mediadatenblätter &amp; Dateien</label>
              <ProduktDateienUpload
                produktId={productId}
                dateien={product.dateien ?? []}
                onDateienChange={(list) => setField("dateien", list)}
                disabled={saving}
              />
            </div>
          </div>
          )}
        </section>

        {/* 2. Placement & Kreativ-Specs */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0">
          <button
            type="button"
            onClick={() => toggleSection("placement")}
            aria-expanded={isSectionOpen("placement")}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left -mx-1 rounded-xl px-1 py-0.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40"
          >
            <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Placement &amp; Kreativ-Specs</h4>
            <CollapsibleChevron open={isSectionOpen("placement")} />
          </button>
          {isSectionOpen("placement") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Platzierung</label>
              <textarea
                value={product.platzierung ?? ""}
                onChange={(e) => setField("platzierung", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-3xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Position</label>
              <input
                type="text"
                value={product.position ?? ""}
                onChange={(e) => setField("position", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">z.B. Above the Fold – Homepage</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Ziel</label>
              <select
                value={zielSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setField("zielEignung", v === "" ? null : v);
                }}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {ZIEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Zusatzinformationen</label>
              <textarea
                value={product.zusatzinformationen ?? ""}
                onChange={(e) => setField("zusatzinformationen", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-3xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Farbraum</label>
              <select
                value={product.creativeFarbe === "RGB" || product.creativeFarbe === "CMYK" ? product.creativeFarbe : ""}
                onChange={(e) => setField("creativeFarbe", e.target.value || null)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="RGB">RGB</option>
                <option value="CMYK">CMYK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Dateityp</label>
              <input
                type="text"
                value={product.creativeDateityp ?? ""}
                onChange={(e) => setField("creativeDateityp", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Grösse</label>
              <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                <input
                  type="text"
                  value={product.creativeGroesse ?? ""}
                  onChange={(e) => setField("creativeGroesse", e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                />
                <select
                  value={product.creativeGroesseEinheit ?? "px"}
                  onChange={(e) => setField("creativeGroesseEinheit", e.target.value as "px" | "mm" | "cm")}
                  className="rounded-r-full border-0 bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <option value="px">px</option>
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Typ</label>
              <input
                type="text"
                value={product.creativeTyp ?? ""}
                onChange={(e) => setField("creativeTyp", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          )}
        </section>

        {/* 3. Preise & Budget (inkl. Tarife bei Individualformat) */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0">
          <button
            type="button"
            onClick={() => toggleSection("preise")}
            aria-expanded={isSectionOpen("preise")}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left -mx-1 rounded-xl px-1 py-0.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40"
          >
            <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Preise &amp; Budget</h4>
            <CollapsibleChevron open={isSectionOpen("preise")} />
          </button>
          {isSectionOpen("preise") && (
          <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Währung</label>
              <select
                value={product.waehrung ?? "CHF"}
                onChange={(e) => setField("waehrung", e.target.value as "CHF" | "EUR")}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="CHF">CHF</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Werbeabgabe Österreich</label>
              <label className="mt-1 flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-600 bg-transparent px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={product.werbeabgabeAt === true}
                  onChange={(e) => setField("werbeabgabeAt", e.target.checked)}
                  className="h-4 w-4 rounded border-0 border-none bg-white dark:bg-zinc-700 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,white_40%)] dark:checked:bg-[radial-gradient(circle_at_center,#FF6554_40%,#3f3f46_40%)]"
                />
                <span>5% Werbeabgabe (AT) auf Preise aufschlagen</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Laufzeit pro Einheit</label>
              <input
                type="text"
                value={product.laufzeitProEinheit ?? ""}
                onChange={(e) => setField("laufzeitProEinheit", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                placeholder="z. B. 1 Woche, 10 Tage, pro Ausgabe"
              />
            </div>
            {!isPerMm && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Preis Brutto</label>
                  <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={product.preisBruttoChf ?? ""}
                      onChange={(e) => setField("preisBruttoChf", e.target.value === "" ? null : parseFloat(e.target.value))}
                      className="min-w-0 flex-1 rounded-l-full border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                    />
                    <span className="flex items-center rounded-r-full bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">{product.waehrung ?? "CHF"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Preis Netto</label>
                  <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={product.preisNettoChf ?? ""}
                      onChange={(e) => setField("preisNettoChf", e.target.value === "" ? null : parseFloat(e.target.value))}
                      className="min-w-0 flex-1 rounded-l-full border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                    />
                    <span className="flex items-center rounded-r-full bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">{product.waehrung ?? "CHF"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Preis Agenturservice</label>
                  <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={product.preisAgenturservice ?? ""}
                      onChange={(e) => setField("preisAgenturservice", e.target.value === "" ? null : parseFloat(e.target.value))}
                      className="min-w-0 flex-1 rounded-l-full border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                    />
                    <span className="flex items-center rounded-r-full bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">{product.waehrung ?? "CHF"}</span>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Agenturmarge (%)</label>
              <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={product.agenturMargeProzent ?? ""}
                  onChange={(e) => setField("agenturMargeProzent", e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="min-w-0 flex-1 rounded-l-full border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                />
                <span className="flex items-center rounded-r-full bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {isPerMm ? "Mindestverrechnung" : "Mindestbudget"}
              </label>
              <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={isPerMm ? (product.minCharge ?? "") : (product.mindestbudget ?? "")}
                  onChange={(e) =>
                    isPerMm
                      ? setField("minCharge", e.target.value === "" ? null : parseFloat(e.target.value))
                      : setField("mindestbudget", e.target.value === "" ? null : parseFloat(e.target.value))
                  }
                  className="min-w-0 flex-1 rounded-l-full border-0 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                />
                <span className="flex items-center rounded-r-full bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">{product.waehrung ?? "CHF"}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Empfohlenes Medienbudget</label>
              <input
                type="text"
                value={product.empfohlenesMedienbudget ?? ""}
                onChange={(e) => setField("empfohlenesMedienbudget", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Buchungsvoraussetzung</label>
              <textarea
                value={product.buchungsvoraussetzung ?? ""}
                onChange={(e) => setField("buchungsvoraussetzung", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-3xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Info zum Buchungsschluss</label>
              <textarea
                value={product.buchungsschlussInfo ?? ""}
                onChange={(e) => setField("buchungsschlussInfo", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-3xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

        {isPerMm && (
          <div className="mt-6 space-y-8 border-t border-zinc-200 dark:border-zinc-600 pt-6">
            <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Tarife Individualformat</h4>
              <button
                type="button"
                onClick={addMmTariff}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200"
              >
                Zeile hinzufügen
              </button>
            </div>
            {mmTariffs.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Keine mm-Tarifzeilen hinterlegt. Falls nur Fixformate verwendet werden, kann das Feld leer bleiben.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                      <th className="px-2">Rubrik/Kategorie</th>
                      <th className="px-2">mm-Preis NA</th>
                      <th className="px-2">mm-Preis GA</th>
                      <th className="px-2">Spaltenraster (Optionen in mm)</th>
                      <th className="w-12 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {mmTariffs.map((row, idx) => (
                      <tr key={`mm-tariff-${idx}`}>
                        <td className="px-2 py-1">
                          <select
                            value={row.category}
                            onChange={(e) => updateMmTariff(idx, { category: e.target.value })}
                            className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                          >
                            {MM_TARIFF_CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={row.pricePerMmNa ?? ""}
                            onChange={(e) => updateMmTariff(idx, { pricePerMmNa: e.target.value === "" ? null : parseFloat(e.target.value) })}
                            className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={row.pricePerMmGa ?? ""}
                            onChange={(e) => updateMmTariff(idx, { pricePerMmGa: e.target.value === "" ? null : parseFloat(e.target.value) })}
                            className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={row.columnWidths.join(", ")}
                            onChange={(e) =>
                              updateMmTariff(idx, {
                                columnWidths: e.target.value
                                  .split(",")
                                  .map((part) => Number(part.trim()))
                                  .filter((n) => !Number.isNaN(n) && n > 0),
                              })
                            }
                            placeholder="z.B. 27, 56, 86, 115, 144, 174, 203, 232, 291"
                            className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeMmTariff(idx)}
                            className="rounded-full border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs text-red-700 dark:text-red-300"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Die konkrete Auswahl (Spalten/Höhe) und Preisberechnung erfolgt später im Mediaplan.
            </p>
            </div>

            <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Tarife Fixformate</h4>
              <button
                type="button"
                onClick={addFixedFormat}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200"
              >
                Zeile hinzufügen
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                    <th className="px-2">Formatname</th>
                    <th className="px-2">Breite (mm)</th>
                    <th className="px-2">Höhe (mm)</th>
                    <th className="px-2">Spalten</th>
                    <th className="px-2">Preis NA</th>
                    <th className="px-2">Preis GA</th>
                    <th className="px-2">Rubrik-Typ</th>
                    <th className="w-12 px-2" />
                  </tr>
                </thead>
                <tbody>
                    {fixedFormats.map((row, idx) => (
                    <tr key={`fixed-format-${idx}`}>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.formatName}
                          onChange={(e) => updateFixedFormat(idx, { formatName: e.target.value })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          value={row.widthMm ?? ""}
                          onChange={(e) => updateFixedFormat(idx, { widthMm: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          value={row.heightMm ?? ""}
                          onChange={(e) => updateFixedFormat(idx, { heightMm: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          value={row.columns ?? ""}
                          onChange={(e) => updateFixedFormat(idx, { columns: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.priceNa ?? ""}
                          onChange={(e) => updateFixedFormat(idx, { priceNa: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.priceGa ?? ""}
                          onChange={(e) => updateFixedFormat(idx, { priceGa: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.formatType ?? "annonce"}
                          onChange={(e) => updateFixedFormat(idx, { formatType: e.target.value as "annonce" | "textanschluss" })}
                          className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5"
                        >
                          <option value="annonce">Annonce</option>
                          <option value="textanschluss">Textanschluss</option>
                        </select>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeFixedFormat(idx)}
                          className="rounded-full border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs text-red-700 dark:text-red-300"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

          </>
          )}
        </section>

        {/* 4. Automatisierung */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0">
          <button
            type="button"
            onClick={() => toggleSection("automatisierung")}
            aria-expanded={isSectionOpen("automatisierung")}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left -mx-1 rounded-xl px-1 py-0.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40"
          >
            <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Automatisierung</h4>
            <CollapsibleChevron open={isSectionOpen("automatisierung")} />
          </button>
          {isSectionOpen("automatisierung") && (
          <div className="space-y-4">
            {Array.from(new Set(taskVorlagen.map((t) => t.category))).map((cat) => {
              const items = taskVorlagen.filter(
                (t) => t.category === cat && (t.is_active !== false || selectedTasks.some((sel) => sel.task_vorlage_id === t.id))
              );
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{cat}</p>
                  <div className="flex flex-col gap-1">
                    {items.map((t) => {
                      const cfg = selectedTasks.find((c) => c.task_vorlage_id === t.id);
                      const selected = cfg != null;
                      const isGleicherTag = cfg?.richtung === "am gleichen Tag";
                      const tagTage = cfg ? (cfg.tage === 1 ? "Tag" : "Tage") : "Tage";
                      const inputClass = isGleicherTag
                        ? "cursor-not-allowed border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400"
                        : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";
                      return (
                        <div key={t.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-3 py-2.5">
                            <label className="switch shrink-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setSelectedTasks((prev) => {
                                    if (prev.some((c) => c.task_vorlage_id === t.id)) {
                                      return prev.filter((c) => c.task_vorlage_id !== t.id);
                                    }
                                    const fallback = getDefaultTaskConfig(t.title);
                                    const def = {
                                      tage: t.standard_tage ?? fallback.tage,
                                      richtung: t.standard_richtung ?? fallback.richtung,
                                      referenz: t.standard_referenz ?? fallback.referenz,
                                    };
                                    return [...prev, { task_vorlage_id: t.id, ...def }];
                                  });
                                }}
                              />
                              <span className="slider" />
                            </label>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</span>
                              {t.description && (
                                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{t.description}</span>
                              )}
                            </div>
                          </div>
                          {selected && cfg && (
                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50 pl-4 pr-3 py-2">
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
                                className={`w-14 rounded-full border px-2 py-1 text-sm ${inputClass}`}
                                aria-label="Tage"
                              />
                              <span className="text-zinc-600 dark:text-zinc-400">{tagTage}</span>
                              <select
                                value={cfg.richtung}
                                onChange={(e) =>
                                  setSelectedTasks((prev) =>
                                    prev.map((x) =>
                                      x.task_vorlage_id === cfg.task_vorlage_id ? { ...x, richtung: e.target.value as Richtung } : x
                                    )
                                  )
                                }
                                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm"
                                aria-label="Richtung"
                              >
                                {RICHTUNG_OPTIONS.map((r) => (
                                  <option key={r} value={r}>{RICHTUNG_LABEL[r]}</option>
                                ))}
                              </select>
                              <select
                                value={cfg.referenz}
                                onChange={(e) =>
                                  setSelectedTasks((prev) =>
                                    prev.map((x) =>
                                      x.task_vorlage_id === cfg.task_vorlage_id ? { ...x, referenz: e.target.value as Referenz } : x
                                    )
                                  )
                                }
                                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm"
                                aria-label="Referenz"
                              >
                                {REFERENZ_OPTIONS.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
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
          )}
        </section>

        {isNew && setFuzzyMatchThreshold != null && (
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3">
            <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>Warnung bei Ähnlichkeit ab:</span>
              <select
                value={fuzzyMatchThreshold}
                onChange={(e) => setFuzzyMatchThreshold(Number(e.target.value))}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
              >
                {FUZZY_MATCH_THRESHOLDS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </section>
        )}

        {!isNew && productId && (
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("historie")}
              aria-expanded={isSectionOpen("historie")}
              className="mb-3 flex w-full items-center justify-between gap-2 text-left -mx-1 rounded-xl px-1 py-0.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40"
            >
              <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Änderungshistorie</h4>
              <CollapsibleChevron open={isSectionOpen("historie")} />
            </button>
            {isSectionOpen("historie") && (
            <>
            {aenderungshistorie.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Änderungen erfasst.</p>
            ) : (
              <ul className="space-y-2">
                {aenderungshistorie.map((e) => {
                  const at = e.created_at
                    ? new Date(e.created_at).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—";
                  return (
                    <li key={e.id} className="rounded-lg border border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">
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
            </>
            )}
          </section>
        )}
        </div>
      </div>

      {/* Fixed am unteren Viewport-Rand, links ab Sidebar (w-64) */}
      <div className="fixed bottom-0 left-64 right-0 z-30 px-6 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Abbrechen
          </button>
          {!isNew && productId && (
            <>
              <button
                type="button"
                onClick={() => onSave(true, false)}
                disabled={saving}
                className="rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
              >
                Variante erstellen
              </button>
              <button
                type="button"
                onClick={() => onSave(false, true)}
                disabled={saving}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Ersetzen & Archivieren
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isNew ? "Neues Produkt speichern" : "Speichern"}
          </button>
          <FeedbackMarker target="produkte.speichern" />
        </div>
      </div>

      {showProduktgruppeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProduktgruppeModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Kanal / Produktgruppe verwalten</h5>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Einträge hinzufügen, bearbeiten oder entfernen.
            </p>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {kanalProduktgruppeOptions.map((option, idx) => (
                <div key={`${option}-${idx}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const value = e.target.value;
                      setKanalProduktgruppeOptions((prev) =>
                        prev.map((x, i) => (i === idx ? value : x))
                      );
                    }}
                    className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const toRemove = option;
                      setKanalProduktgruppeOptions((prev) => prev.filter((_, i) => i !== idx));
                      if ((product.produktgruppe ?? "") === toRemove || (product.kanal ?? "") === toRemove) {
                        setField("kanal", null);
                        setField("produktgruppe", null);
                      }
                    }}
                    className="shrink-0 rounded-full border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newProduktgruppe}
                onChange={(e) => setNewProduktgruppe(e.target.value)}
                placeholder="Neue Produktgruppe"
                className="w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const value = newProduktgruppe.trim();
                  if (!value) return;
                  if (kanalProduktgruppeOptions.some((x) => x.trim().toLowerCase() === value.toLowerCase())) {
                    return;
                  }
                  setKanalProduktgruppeOptions((prev) =>
                    [...prev, value].sort((a, b) => a.localeCompare(b, "de-CH", { sensitivity: "base" }))
                  );
                  setNewProduktgruppe("");
                }}
                className="shrink-0 rounded-full bg-[#FF6554] px-3 py-2 text-xs font-medium text-white hover:bg-[#e55a4a]"
              >
                Hinzufügen
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const cleaned = Array.from(
                    new Set(
                      kanalProduktgruppeOptions
                        .map((x) => x.trim())
                        .filter(Boolean)
                    )
                  ).sort((a, b) => a.localeCompare(b, "de-CH", { sensitivity: "base" }));
                  setKanalProduktgruppeOptions(cleaned);
                  if (
                    (product.produktgruppe && !cleaned.includes(product.produktgruppe)) ||
                    (product.kanal && !cleaned.includes(product.kanal))
                  ) {
                    setField("kanal", null);
                    setField("produktgruppe", null);
                  }
                  setShowProduktgruppeModal(false);
                }}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
