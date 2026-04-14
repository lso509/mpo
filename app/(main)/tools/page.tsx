"use client";

import { createClient } from "@/lib/supabase/client";
import { importClaudeJsonExport, validateClaudeJson } from "@/lib/mediaplan/claudeJsonImport";
import Link from "next/link";
import { useState } from "react";

export default function ToolsPage() {
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; products: number; positions: number } | null>(null);

  async function runImport() {
    setError(null);
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("Kein gültiges JSON.");
      return;
    }
    const validated = validateClaudeJson(parsed);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    const refs = validated.value.produkte.map((p) => p._ref);
    if (new Set(refs).size !== refs.length) {
      setError("Doppelte _ref bei produkte — jede Ref muss eindeutig sein.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const r = await importClaudeJsonExport(supabase, validated.value);
      setResult({ id: r.mediaplanId, products: r.productsInserted, positions: r.positionsInserted });
      setJsonText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Tools
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Hilfsmittel für Importe und Konvertierungen.
        </p>
      </header>

      <section className="haupt-box space-y-4 p-6">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Mediaplan-JSON importieren (Claude / KI-Export)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Erwartetes Format: Objekt mit <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">mediaplan</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">produkte</code> (mit{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">_ref</code>) und{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">positionen</code> (mit{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">_produkt_ref</code>). Es werden ein neuer{" "}
          <strong>Mediaplan (Entwurf)</strong>, <strong>neue Produktkatalog-Einträge</strong> und{" "}
          <strong>Positionen</strong> angelegt. Der Kunde wird unter <strong>Kunden</strong> gesucht oder neu
          erstellt.
        </p>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
            Importiert: {result.products} Produkte, {result.positions} Positionen.{" "}
            <Link href={`/mediaplaene/${result.id}`} className="font-medium text-[#FF6554] underline">
              Zum Mediaplan
            </Link>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">JSON einfügen</span>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={16}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder='{ "mediaplan": { ... }, "produkte": [ ... ], "positionen": [ ... ] }'
            spellCheck={false}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !jsonText.trim()}
            onClick={runImport}
            className="rounded-full bg-[#FF6554] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50"
          >
            {busy ? "Import läuft…" : "Import starten"}
          </button>
          <Link
            href="/mediaplaene"
            className="inline-flex items-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
          >
            Zur Mediaplan-Liste
          </Link>
        </div>
      </section>
    </div>
  );
}
