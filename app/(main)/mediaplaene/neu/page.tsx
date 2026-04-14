"use client";

import { createClient } from "@/lib/supabase/client";
import { parseOptionalChfInput } from "@/lib/mediaplan/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Kunde = { id: string; name: string };

export default function NeuerMediaplanPage() {
  const router = useRouter();
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kundeId, setKundeId] = useState<string>("");
  const [client, setClient] = useState("");
  const [campaign, setCampaign] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [maxBudgetChf, setMaxBudgetChf] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("kunden").select("id, name").order("name");
        if (!cancelled) setKunden((data ?? []) as Kunde[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const kunde = kunden.find((k) => k.id === kundeId);
    const clientName = client.trim() || (kunde?.name ?? "");
    if (!clientName || !campaign.trim()) {
      setError("Bitte Kunde und Kampagnenname angeben.");
      setSaving(false);
      return;
    }
    const maxBudget = parseOptionalChfInput(maxBudgetChf);
    const { data, error: err } = await supabase
      .from("mediaplaene")
      .insert({
        client: clientName,
        kunde_id: kundeId || null,
        status: "Entwurf",
        campaign: campaign.trim(),
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null,
        max_budget_chf: maxBudget,
      })
      .select("id")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.id) router.push(`/mediaplaene/${data.id}`);
  }

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold text-zinc-950 dark:text-zinc-100">
        Neuer Mediaplan
      </h1>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Kunden auswählen, Zeitraum und Kampagnenname eingeben.
      </p>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">Kunden werden geladen…</p>
      ) : (
        <div className="content-radius haupt-box border border-zinc-200 dark:border-zinc-700 p-4 shadow-none sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="kunde" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Kunde
            </label>
            <select
              id="kunde"
              value={kundeId}
              onChange={(e) => {
                setKundeId(e.target.value);
                const k = kunden.find((x) => x.id === e.target.value);
                if (k && !client) setClient(k.name);
              }}
              className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="">— Kunde wählen —</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="client" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Unternehmen / Anzeigename
            </label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="z. B. Salt, FL1"
              className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="campaign" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Kampagne *
            </label>
            <input
              id="campaign"
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              required
              placeholder="z. B. Q1 2026 - Digitale Transformation"
              className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date_start" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Laufzeit Start
              </label>
              <input
                id="date_start"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="date_end" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Laufzeit Ende
              </label>
              <input
                id="date_end"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="max_budget" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Maximales Budget (optional)
            </label>
            <input
              id="max_budget"
              type="text"
              inputMode="decimal"
              value={maxBudgetChf}
              onChange={(e) => setMaxBudgetChf(e.target.value)}
              placeholder="z. B. 50000"
              className="mt-1 w-full rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">CHF netto, Obergrenze für die Kampagnen-Positionen</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Wird erstellt…" : "Mediaplan erstellen"}
            </button>
            <Link
              href="/mediaplaene"
              className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Abbrechen
            </Link>
          </div>
        </form>
        </div>
      )}

      <Link
        href="/mediaplaene"
        className="mt-4 inline-block text-sm text-[#FF6554] hover:underline"
      >
        ← Zurück zur Liste
      </Link>
    </>
  );
}
