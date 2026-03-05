"use client";

import { createClient } from "@/lib/supabase/client";
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
    const { data, error: err } = await supabase
      .from("mediaplaene")
      .insert({
        client: clientName,
        kunde_id: kundeId || null,
        status: "Entwurf",
        campaign: campaign.trim(),
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null,
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Neuer Mediaplan
      </h1>
      <p className="text-zinc-600">
        Kunden auswählen, Zeitraum und Kampagnenname eingeben.
      </p>

      {loading ? (
        <p className="text-zinc-500">Kunden werden geladen…</p>
      ) : (
        <form onSubmit={handleSubmit} className="content-radius space-y-4 border border-zinc-200 bg-white p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="kunde" className="block text-sm font-medium text-zinc-700">
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
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900"
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
            <label htmlFor="client" className="block text-sm font-medium text-zinc-700">
              Unternehmen / Anzeigename
            </label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="z. B. Salt, FL1"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="campaign" className="block text-sm font-medium text-zinc-700">
              Kampagne *
            </label>
            <input
              id="campaign"
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              required
              placeholder="z. B. Q1 2026 - Digitale Transformation"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date_start" className="block text-sm font-medium text-zinc-700">
                Laufzeit Start
              </label>
              <input
                id="date_start"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="date_end" className="block text-sm font-medium text-zinc-700">
                Laufzeit Ende
              </label>
              <input
                id="date_end"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900"
              />
            </div>
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
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      )}

      <Link
        href="/mediaplaene"
        className="inline-block text-sm text-[#FF6554] hover:underline"
      >
        ← Zurück zur Liste
      </Link>
    </div>
  );
}
