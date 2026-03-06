"use client";

import {
  CATEGORIES,
  categoryLabel,
  DEFAULT_FUZZY_THRESHOLD,
  FUZZY_MATCH_THRESHOLDS,
  getDefaultTaskConfig,
  KANAL_OPTIONS,
  LAUFZEIT_OPTIONS,
  type Product,
  type ProduktTaskConfig,
  REFERENZ_OPTIONS,
  RICHTUNG_LABEL,
  RICHTUNG_OPTIONS,
  type Richtung,
  type Referenz,
  type TaskVorlage,
  ZIEL_EIGNUNG_OPTIONS,
} from "@/lib/produkte";
import { ProduktBildUpload } from "@/app/components/produkte/ProduktBildUpload";
import { ProduktDateienUpload } from "@/app/components/produkte/ProduktDateienUpload";
import { FeedbackMarker } from "@/app/components/FeedbackMarker";

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
}: ProductFormProps) {
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(false, false);
      }}
    >
      <div className="p-6 pb-32 space-y-6">
        {/* 1. Basis-Infos */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Basis-Infos
          </h4>
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
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Verlag</label>
              <input
                type="text"
                value={product.verlag ?? ""}
                onChange={(e) => setField("verlag", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kanal (Werbeform)</label>
              <select
                value={product.kanal ?? ""}
                onChange={(e) => setField("kanal", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {KANAL_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Produktgruppe</label>
              <input
                type="text"
                value={product.produktgruppe ?? ""}
                onChange={(e) => setField("produktgruppe", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
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
        </section>

        {/* 2. Placement & Kreativ-Specs */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Placement &amp; Kreativ-Specs
          </h4>
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
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Ziel-Eignung</label>
              <select
                value={product.zielEignung ?? ""}
                onChange={(e) => setField("zielEignung", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {ZIEL_EIGNUNG_OPTIONS.map((z) => (
                  <option key={z} value={z}>{z}</option>
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
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Creative Deadline</label>
              <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                <span className="flex items-center rounded-l-full bg-zinc-100 dark:bg-zinc-700 pl-3 pr-2 text-zinc-500" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </span>
                <input
                  type="date"
                  value={product.creativeDeadlineDate ?? ""}
                  onChange={(e) => setField("creativeDeadlineDate", e.target.value || null)}
                  className="min-w-0 flex-1 border-0 bg-white dark:bg-zinc-800 py-2 pr-3 pl-2 text-sm focus:ring-2 focus:ring-[#FF6554]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Preise & Budget */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Preise &amp; Budget
          </h4>
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
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Laufzeit pro Einheit</label>
              <select
                value={product.laufzeitProEinheit ?? ""}
                onChange={(e) => setField("laufzeitProEinheit", e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                {LAUFZEIT_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
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
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Mindestbudget</label>
              <div className="mt-1 flex rounded-full border border-zinc-200 dark:border-zinc-600 overflow-hidden">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={product.mindestbudget ?? ""}
                  onChange={(e) => setField("mindestbudget", e.target.value === "" ? null : parseFloat(e.target.value))}
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
          </div>
        </section>

        {/* 4. Automatisierung */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
          <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Automatisierung
          </h4>
          <div className="space-y-4">
            {Array.from(new Set(taskVorlagen.map((t) => t.category))).map((cat) => {
              const items = taskVorlagen.filter((t) => t.category === cat);
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
                                    const def = getDefaultTaskConfig(t.title);
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
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
            <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Änderungshistorie</h4>
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
          </section>
        )}
      </div>

      <div className="sticky z-10 shrink-0 px-6 pt-6 pb-8" style={{ bottom: "50px" }}>
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
    </form>
  );
}
