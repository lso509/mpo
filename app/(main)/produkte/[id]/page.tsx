"use client";

import { ProductForm } from "@/app/(main)/produkte/ProductForm";
import { createClient } from "@/lib/supabase/client";
import {
  buildChangelogEntries,
  DEFAULT_FUZZY_THRESHOLD,
  emptyProduct,
  findSimilarProducts,
  type Product,
  type ProduktTaskConfig,
  type TaskVorlage,
  mapRow,
  productToRow,
  sortTaskVorlagen,
} from "@/lib/produkte";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type AenderungshistorieEntry = {
  id: string;
  created_at: string;
  changed_by: string | null;
  change_description: string;
};

async function saveProduktTaskVorlagen(produktId: string, tasksToSave: ProduktTaskConfig[]) {
  const supabase = createClient();
  await supabase.from("produkt_task_vorlagen").delete().eq("produkt_id", produktId);
  if (tasksToSave.length > 0) {
    await supabase.from("produkt_task_vorlagen").insert(
      tasksToSave.map((t) => ({
        produkt_id: produktId,
        task_vorlage_id: t.task_vorlage_id,
        tage: t.tage,
        richtung: t.richtung,
        referenz: t.referenz,
      }))
    );
  }
}

async function loadMmData(produktId: string) {
  const supabase = createClient();
  const [{ data: mmTariffs }, { data: fixedFormats }] = await Promise.all([
    supabase
      .from("product_mm_tariffs")
      .select("id, category, price_per_mm_na, price_per_mm_ga, column_widths, sort_order")
      .eq("product_id", produktId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_fixed_formats")
      .select("id, format_name, width_mm, height_mm, columns, price_na, price_ga, format_type, sort_order")
      .eq("product_id", produktId)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    mmTariffs: (mmTariffs ?? []).map((r) => ({
      id: String(r.id),
      category: String(r.category ?? ""),
      pricePerMmNa: r.price_per_mm_na != null ? Number(r.price_per_mm_na) : null,
      pricePerMmGa: r.price_per_mm_ga != null ? Number(r.price_per_mm_ga) : null,
      columnWidths: Array.isArray(r.column_widths)
        ? r.column_widths.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
        : [],
      sortOrder: Number(r.sort_order ?? 0),
    })),
    fixedFormats: (fixedFormats ?? []).map((r) => ({
      id: String(r.id),
      formatName: String(r.format_name ?? ""),
      widthMm: r.width_mm != null ? Number(r.width_mm) : null,
      heightMm: r.height_mm != null ? Number(r.height_mm) : null,
      columns: r.columns != null ? Number(r.columns) : null,
      priceNa: r.price_na != null ? Number(r.price_na) : null,
      priceGa: r.price_ga != null ? Number(r.price_ga) : null,
      formatType:
        r.format_type === "textanschluss" ? ("textanschluss" as const) : ("annonce" as const),
      sortOrder: Number(r.sort_order ?? 0),
    })),
  };
}

async function saveMmData(produktId: string, product: Partial<Product>) {
  const supabase = createClient();
  await Promise.all([
    supabase.from("product_mm_tariffs").delete().eq("product_id", produktId),
    supabase.from("product_fixed_formats").delete().eq("product_id", produktId),
  ]);

  if (product.pricingType !== "per_mm") return;

  const mmRows = (product.mmTariffs ?? []).map((row, i) => ({
    product_id: produktId,
    category: row.category,
    price_per_mm_na: row.pricePerMmNa,
    price_per_mm_ga: row.pricePerMmGa,
    column_widths: row.columnWidths,
    sort_order: i,
  }));
  const fixedRows = (product.fixedFormats ?? []).map((row, i) => ({
    product_id: produktId,
    format_name: row.formatName,
    width_mm: row.widthMm,
    height_mm: row.heightMm,
    columns: row.columns,
    price_na: row.priceNa,
    price_ga: row.priceGa,
    format_type: row.formatType,
    sort_order: i,
  }));

  if (mmRows.length > 0) {
    const { error } = await supabase.from("product_mm_tariffs").insert(mmRows);
    if (error) throw error;
  }
  if (fixedRows.length > 0) {
    const { error } = await supabase.from("product_fixed_formats").insert(fixedRows);
    if (error) throw error;
  }
}

export default function ProduktBearbeitenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const isNew = id === "neu";
  const duplicateId = searchParams.get("duplicate");

  const [product, setProduct] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taskVorlagen, setTaskVorlagen] = useState<TaskVorlage[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<ProduktTaskConfig[]>([]);
  const [aenderungshistorie, setAenderungshistorie] = useState<AenderungshistorieEntry[]>([]);
  const [fuzzyMatchThreshold, setFuzzyMatchThreshold] = useState(DEFAULT_FUZZY_THRESHOLD);
  const [similarDialog, setSimilarDialog] = useState<{
    similar: { product: Product; score: number }[];
    onConfirmCreate: () => void;
  } | null>(null);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [verlagOptions, setVerlagOptions] = useState<string[]>([]);
  const initialSelectedTasksRef = useRef<ProduktTaskConfig[]>([]);

  const setField = useCallback(<K extends keyof Product>(key: K, value: Product[K]) => {
    setProduct((prev) => (prev ? { ...prev, [key]: value } : null));
  }, []);

  // Lieferanten für Verlag-Dropdown laden
  useEffect(() => {
    const supabase = createClient();
    supabase.from("lieferanten").select("firmenname").order("firmenname").then(({ data }) => {
      setVerlagOptions((data ?? []).map((r) => (r as { firmenname: string }).firmenname));
    });
  }, []);

  // Load product (when editing), duplicate (when new?duplicate=id), or set empty (when new)
  useEffect(() => {
    if (!id) return;
    if (id === "neu") {
      if (duplicateId) {
        const supabase = createClient();
        supabase
          .from("produkte")
          .select("*")
          .eq("id", duplicateId)
          .single()
          .then(({ data, error: err }) => {
            if (err || !data) {
              setProduct({ ...emptyProduct });
            } else {
              const p = mapRow(data as Record<string, unknown>);
              const rest: Partial<Product> = { ...p };
              delete (rest as { id?: string }).id;
              loadMmData(duplicateId)
                .then(({ mmTariffs, fixedFormats }) => {
                  setProduct({ ...rest, mmTariffs, fixedFormats });
                })
                .catch(() => {
                  setProduct(rest);
                });
            }
            setLoading(false);
          });
        return;
      }
      queueMicrotask(() => {
        setProduct({ ...emptyProduct });
        setLoading(false);
      });
      return;
    }
    const supabase = createClient();
    supabase
      .from("produkte")
      .select("*")
      .eq("id", id)
      .single()
      .then(async ({ data, error: err }) => {
        if (err || !data) {
          setError(err?.message ?? "Produkt nicht gefunden");
          setProduct(null);
          router.replace("/produkte");
          return;
        }
        const base = mapRow(data as Record<string, unknown>);
        try {
          const { mmTariffs, fixedFormats } = await loadMmData(id);
          setProduct({ ...base, mmTariffs, fixedFormats });
        } catch {
          setProduct(base);
        }
        setLoading(false);
      });
  }, [id, duplicateId, router]);

  // Load existing products (for similar check when creating new)
  useEffect(() => {
    if (!isNew) return;
    const supabase = createClient();
    supabase
      .from("produkte")
      .select("*")
      .eq("archived", false)
      .order("category")
      .then(({ data }) => {
        if (data) setExistingProducts(data.map((r) => mapRow(r as Record<string, unknown>)));
      });
  }, [isNew]);

  // Task-Vorlagen
  useEffect(() => {
    const supabase = createClient();
    supabase.from("task_vorlagen").select("id, category, title, description").order("category").order("title").then(({ data }) => {
      if (data) setTaskVorlagen(sortTaskVorlagen(data as TaskVorlage[]));
    });
  }, []);

  // Produkt-Task-Konfiguration und Änderungshistorie (nur bei Bearbeitung)
  useEffect(() => {
    if (isNew || !id) {
      queueMicrotask(() => {
        setSelectedTasks([]);
        setAenderungshistorie([]);
      });
      initialSelectedTasksRef.current = [];
      return;
    }
    const supabase = createClient();
    supabase
      .from("produkt_task_vorlagen")
      .select("task_vorlage_id, tage, richtung, referenz")
      .eq("produkt_id", id)
      .then(({ data }) => {
        const rows = data ?? [];
        const configs: ProduktTaskConfig[] = rows.map((r) => ({
          task_vorlage_id: r.task_vorlage_id as string,
          tage: Number(r.tage ?? 0),
          richtung: (r.richtung === "nach" || r.richtung === "am gleichen Tag" ? r.richtung : "vor") as ProduktTaskConfig["richtung"],
          referenz: (["Startdatum", "Enddatum", "Creative Deadline"].includes(String(r.referenz)) ? r.referenz : "Enddatum") as ProduktTaskConfig["referenz"],
        }));
        setSelectedTasks(configs);
        initialSelectedTasksRef.current = configs;
      });
    supabase
      .from("produkt_aenderungshistorie")
      .select("id, created_at, changed_by, change_description")
      .eq("produkt_id", id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setAenderungshistorie((data ?? []) as AenderungshistorieEntry[]);
      });
  }, [id, isNew]);

  async function handleSave(asNewVariant: boolean, overwrite: boolean, forceCreate?: boolean) {
      if (!product) return;
      setSaving(true);
      setError(null);
      const supabase = createClient();
      const row = productToRow(product) as Record<string, unknown>;
      row.automatisierung_aktiv = selectedTasks.length > 0;

      if (isNew || asNewVariant) {
        if (isNew && !forceCreate) {
          const similar = findSimilarProducts(product, existingProducts, fuzzyMatchThreshold);
          if (similar.length > 0) {
            setSimilarDialog({
              similar,
              onConfirmCreate: () => {
                setSimilarDialog(null);
                void handleSave(false, false, true);
              },
            });
            setSaving(false);
            return;
          }
        }
        const { data: inserted, error: err } = await supabase.from("produkte").insert(row).select("id").single();
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }
        if (inserted?.id) {
          try {
            await saveMmData(inserted.id, product);
            await saveProduktTaskVorlagen(inserted.id, selectedTasks);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Tarifdaten konnten nicht gespeichert werden.");
            setSaving(false);
            return;
          }
          router.push("/produkte");
          return;
        }
      }

      if (overwrite && id && !isNew) {
        await supabase.from("produkte").update({ archived: true }).eq("id", id);
        const { data: inserted, error: err } = await supabase.from("produkte").insert(row).select("id").single();
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }
        if (inserted?.id) {
          try {
            await saveMmData(inserted.id, product);
            await saveProduktTaskVorlagen(inserted.id, selectedTasks);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Tarifdaten konnten nicht gespeichert werden.");
            setSaving(false);
            return;
          }
          router.push("/produkte");
          return;
        }
      }

      if (!isNew && id) {
        const { data: currentRow } = await supabase.from("produkte").select("*").eq("id", id).single();
        const historyEntries: { change_description: string }[] = [];
        if (currentRow) {
          historyEntries.push(...buildChangelogEntries(currentRow as Record<string, unknown>, row as Record<string, unknown>));
        }
        const initialIds = initialSelectedTasksRef.current.map((t) => t.task_vorlage_id).sort();
        const currentIds = selectedTasks.map((t) => t.task_vorlage_id).sort();
        const initialStr = JSON.stringify([...initialSelectedTasksRef.current].sort((a, b) => a.task_vorlage_id.localeCompare(b.task_vorlage_id)));
        const currentStr = JSON.stringify([...selectedTasks].sort((a, b) => a.task_vorlage_id.localeCompare(b.task_vorlage_id)));
        if (initialStr !== currentStr) {
          historyEntries.push({
            change_description: `Automatische Tasks: von ${initialIds.length} auf ${currentIds.length} Vorlagen`,
          });
        }
        if (historyEntries.length > 0) {
          await supabase.from("produkt_aenderungshistorie").insert(
            historyEntries.map((e) => ({ produkt_id: id, changed_by: null, change_description: e.change_description }))
          );
        }
        const { error: err } = await supabase.from("produkte").update(row).eq("id", id);
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }
        try {
          await saveMmData(id, product);
          await saveProduktTaskVorlagen(id, selectedTasks);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Tarifdaten konnten nicht gespeichert werden.");
          setSaving(false);
          return;
        }
        router.push("/produkte");
      }
      setSaving(false);
  }

  const handleCancel = useCallback(() => {
    router.push("/produkte");
  }, [router]);

  if (loading || product == null) {
    return (
      <div className="content-radius haupt-box flex min-h-[200px] items-center justify-center p-8">
        <p className="text-zinc-500 dark:text-zinc-400">Laden…</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-zinc-950 dark:text-zinc-100">
        {isNew ? "Neues Produkt" : "Produkt bearbeiten"}
      </h2>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="content-radius haupt-box border border-zinc-200 dark:border-zinc-700 shadow-none mb-10">
      <ProductForm
        product={product}
        setField={setField}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        isNew={isNew}
        productId={isNew ? null : id}
        taskVorlagen={taskVorlagen}
        selectedTasks={selectedTasks}
        setSelectedTasks={setSelectedTasks}
        aenderungshistorie={aenderungshistorie}
        fuzzyMatchThreshold={fuzzyMatchThreshold}
        setFuzzyMatchThreshold={setFuzzyMatchThreshold}
        verlagOptions={verlagOptions}
      />
      </div>

      {/* Dialog: Ähnliche Produkte */}
      {similarDialog != null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSimilarDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Ähnliche Produkte gefunden</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Es gibt bereits {similarDialog.similar.length} Produkt
              {similarDialog.similar.length === 1 ? "" : "e"}, die dem neuen sehr ähneln. Trotzdem neu anlegen oder abbrechen?
            </p>
            <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {similarDialog.similar.map(({ product: p, score }) => (
                <li key={p.id} className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {p.produktvarianteTitel ?? p.category ?? p.id}
                  </span>
                  <span className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">{Math.round(score * 100)}% ähnlich</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSimilarDialog(null)}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => similarDialog.onConfirmCreate()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Trotzdem neu anlegen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
