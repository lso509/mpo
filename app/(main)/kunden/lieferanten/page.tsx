"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

type Lieferant = {
  id: string;
  firmenname: string;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  telefon: string | null;
  email: string | null;
  website: string | null;
  ansprechpartner: string | null;
  kategorie_werbeform: string | null;
};

export default function LieferantenPage() {
  const [list, setList] = useState<Lieferant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lieferanten")
      .select("*")
      .order("firmenname");
    setList((data as Lieferant[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = list.find((s) => s.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Lieferanten
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Verwaltung aller Medien-Lieferanten und Partner (Werbeträger-Kontakte)
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="haupt-box border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Gesamt Lieferanten</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
            {loading ? "…" : list.length}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Alle Lieferanten
        </h2>
        <div className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
          {loading ? (
            <p className="p-6 text-zinc-500 dark:text-zinc-400">Wird geladen…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Lieferant</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Kategorie / Werbeform</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Standort</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Kontakt</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 ${
                      selectedId === s.id ? "bg-[#FF6554]/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                      >
                        {s.firmenname}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {s.kategorie_werbeform ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {[s.plz, s.ort, s.land].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {s.email && <p className="text-xs">{s.email}</p>}
                      {s.telefon && <p className="text-xs">{s.telefon}</p>}
                      {!s.email && !s.telefon && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && list.length === 0 && (
            <p className="p-6 text-zinc-500 dark:text-zinc-400">Noch keine Lieferanten. Migration 033 ausführen (werbetraeger_kontakte.xlsx).</p>
          )}
        </div>
      </section>

      {selected != null && (
        <section className="haupt-box border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            {selected.firmenname} – Details
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Kategorie / Werbeform</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{selected.kategorie_werbeform ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ansprechpartner</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{selected.ansprechpartner ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Adresse</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                {[selected.strasse, [selected.plz, selected.ort].filter(Boolean).join(" "), selected.land].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Telefon</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{selected.telefon ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">E-Mail</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{selected.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Website</dt>
              <dd className="mt-0.5 text-sm">
                {selected.website ? (
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-[#FF6554] hover:underline">
                    {selected.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
