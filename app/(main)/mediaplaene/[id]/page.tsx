"use client";

import { createClient } from "@/lib/supabase/client";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type MediaplanRow = {
  id: string;
  client: string | null;
  status: string | null;
  campaign: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
};

type PositionRow = {
  id: string;
  mediaplan_id: string;
  produkt_id: string | null;
  title: string;
  description: string | null;
  tag: string | null;
  brutto: number | null;
  discount_text: string | null;
  kundenpreis: number | null;
  status_tags: string[] | null;
  sort_order: number;
};

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

function formatChf(n: number | null): string {
  if (n == null) return "—";
  return (
    new Intl.NumberFormat("de-CH", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) +
    " CHF"
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (!start) return end ? fmt(end) : "—";
  if (!end) return fmt(start);
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function MediaplanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
  const [viewMode, setViewMode] = useState<"agentur" | "kunde">("agentur");
  const [plan, setPlan] = useState<MediaplanRow | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("mediaplaene")
      .select("id, client, status, campaign, date_range_start, date_range_end")
      .eq("id", planId)
      .single();
    if (err) {
      setError(err.message);
      setPlan(null);
      return;
    }
    setPlan(data as MediaplanRow);
  }, [planId]);

  const loadPositions = useCallback(async () => {
    if (!planId) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("mediaplan_positionen")
      .select("*")
      .eq("mediaplan_id", planId)
      .order("sort_order", { ascending: true });
    if (err) {
      setError(err.message);
      setPositions([]);
      return;
    }
    setPositions((data ?? []) as PositionRow[]);
  }, [planId]);

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([loadPlan(), loadPositions()]).finally(() => setLoading(false));
  }, [planId, loadPlan, loadPositions]);

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

  const deletePosition = useCallback(
    async (positionId: string) => {
      const supabase = createClient();
      const { error: err } = await supabase.from("mediaplan_positionen").delete().eq("id", positionId);
      if (err) setError(err.message);
      else await loadPositions();
    },
    [loadPositions]
  );

  const totalKundenpreis = useMemo(
    () => positions.reduce((s, p) => s + (p.kundenpreis ?? 0), 0),
    [positions]
  );

  if (loading && !plan) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-zinc-500">Mediaplan wird geladen…</p>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Fehler: {error}
        </div>
        <Link href="/mediaplaene" className="mt-4 inline-block text-sm text-violet-600 hover:underline">
          ← Zurück zu Mediapläne
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-zinc-500">Mediaplan nicht gefunden.</p>
        <Link href="/mediaplaene" className="mt-4 inline-block text-sm text-violet-600 hover:underline">
          ← Zurück zu Mediapläne
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {plan.campaign ?? "Mediaplan"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {plan.client ?? "—"} | {formatDateRange(plan.date_range_start, plan.date_range_end)}
            {planId && <span className="ml-2 text-zinc-400">(ID: {planId.slice(0, 8)}…)</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={nochNichtImplementiert}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Creative-Übersicht senden ({positions.length})
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-600">Ansichtsmodus:</span>
            <button
              type="button"
              onClick={() => setViewMode("agentur")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === "agentur" ? "bg-violet-100 text-violet-900" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              Agentur-Ansicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kunde")}
              className="relative rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              <span className={viewMode === "kunde" ? "bg-violet-100 text-violet-900" : "bg-zinc-100 text-zinc-600"}>
                Kunden-Ansicht
              </span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={nochNichtImplementiert}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            PDF Export (A3)
          </button>
        </div>
      </header>

      {positions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Bestätigte Positionen ({positions.length})
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Summe Kundenpreis: {formatChf(totalKundenpreis)}
          </p>
        </div>
      )}

      <section className="grid gap-6 rounded-lg border-t-4 border-[#8026FE] bg-white p-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700">Kundeninformationen</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Unternehmen:</dt>
              <dd className="font-medium text-zinc-900">{plan.client ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Status:</dt>
              <dd className="font-medium text-zinc-900">{plan.status ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-700">Kampagne</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Kampagne:</dt>
              <dd className="font-medium text-zinc-900">{plan.campaign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Laufzeit:</dt>
              <dd className="font-medium text-zinc-900">
                {formatDateRange(plan.date_range_start, plan.date_range_end)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-950">
            Bestätigte Positionen ({positions.length})
          </h2>
          <div className="flex gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-0 border-none bg-zinc-100 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#f4f4f5_40%)]"
              aria-label="Alle auswählen"
            />
            <button
              type="button"
              onClick={nochNichtImplementiert}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Bulk Edit
            </button>
          </div>
        </div>
        <ul className="mt-4 space-y-4">
          {positions.map((pos) => (
            <li
              key={pos.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-0 border-none bg-zinc-100 shadow-none outline-none ring-0 appearance-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 checked:bg-[radial-gradient(circle_at_center,#8b5cf6_40%,#f4f4f5_40%)]"
                />
                <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium text-zinc-950">{pos.title}</p>
                  {pos.description && (
                    <p className="text-sm text-zinc-600">{pos.description}</p>
                  )}
                  {pos.tag && (
                    <span className="mt-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                      {pos.tag}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 sm:flex-nowrap">
                {(pos.status_tags ?? []).map((s, i) => (
                  <span key={i} className="rounded bg-zinc-100 px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-right text-sm">
                {pos.brutto != null && <p className="text-zinc-500">Brutto {formatChf(pos.brutto)}</p>}
                {pos.discount_text && <p className="text-zinc-500">{pos.discount_text}</p>}
                <p className="font-semibold text-zinc-950">
                  Kundenpreis {formatChf(pos.kundenpreis)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deletePosition(pos.id)}
                className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Löschen"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={openAddProduct}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/30 hover:text-violet-700"
        >
          + Position aus Produktkatalog hinzufügen
        </button>
      </section>

      <section className="grid gap-4 rounded-lg border-t-4 border-[#8026FE] bg-white p-5 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-700">Einmalige Positionen</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Bestätigte Positionen (exkl. MwSt.)</dt>
              <dd className="font-medium text-zinc-900">{formatChf(totalKundenpreis)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2">
              <dt className="font-medium text-zinc-700">Gesamt einmalig</dt>
              <dd className="font-semibold text-zinc-950">{formatChf(totalKundenpreis)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-700">Agentur-Marge</h3>
          <p className="mt-3 text-2xl font-semibold text-zinc-950">—</p>
        </div>
      </section>

      <section className="rounded-lg border-t-4 border-[#8026FE] bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-950">
          Notizen &amp; Kommentare zum Mediaplan ({COMMENTS.length})
        </h3>
        <ul className="mt-4 space-y-4">
          {COMMENTS.map((c, i) => (
            <li key={i} className="border-l-2 border-violet-200 pl-4">
              <p className="text-sm font-medium text-zinc-900">{c.author}</p>
              <p className="text-xs text-zinc-500">{c.date}</p>
              <p className="mt-1 text-sm text-zinc-700">{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Notiz zum Mediaplan hinzufügen..."
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600"
            disabled
          >
            Senden
          </button>
        </div>
      </section>

      <footer className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          📄 Als Entwurf speichern
        </button>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ✓ Plan aktivieren
        </button>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ↓ PDF exportieren
        </button>
      </footer>

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
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 p-3 hover:bg-violet-50"
                    onClick={() => addProductAsPosition(prod)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{title}</p>
                      <p className="text-xs text-zinc-500">
                        {prod.category ?? "—"} · {formatChf(prod.preis_netto_chf)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-violet-600">+ Hinzufügen</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !adding && setAddProductOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
