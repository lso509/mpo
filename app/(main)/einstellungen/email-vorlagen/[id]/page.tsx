"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { nochNichtImplementiert } from "@/lib/not-implemented";
import { useCallback, useEffect, useState } from "react";

const PLACEHOLDERS = [
  "{{campaign_name}}",
  "{{client_name}}",
  "{{position_name}}",
  "{{due_date}}",
  "{{contact_name}}",
];

export default function EmailVorlageDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("email_vorlagen")
      .select("id, title, subject, body")
      .eq("id", id)
      .single();
    if (err) {
      setError(err.message);
      setTitle("");
      setSubject("");
      setBody("");
    } else if (data) {
      setTitle((data.title as string) ?? "");
      setSubject((data.subject as string) ?? "");
      setBody((data.body as string) ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("email_vorlagen")
      .update({ title, subject, body, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);
    if (err) setError(err.message);
    else await load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <p className="text-zinc-500">Vorlage wird geladen…</p>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        <Link href="/einstellungen/email-vorlagen" className="text-sm text-[#FF6554] hover:underline">
          ← Zurück zu E-Mail Vorlagen
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">E-Mail Vorlage – {title || "Detail"}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Betreff: {subject || "—"}</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <section className="content-radius border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/80">
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <label className="mt-4 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Betreff</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="z. B. Creative-Material für {{campaign_name}} benötigt"
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <h2 className="mt-6 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Inhalt</h2>
        <div className="mt-3">
          <textarea
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="E-Mail-Text mit Platzhaltern..."
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Verfügbare Platzhalter</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={nochNichtImplementiert}
              className="rounded-full border border-[#FF6554]/30 bg-[#FF6554]/15 px-3 py-1.5 text-sm font-medium text-[#FF6554] hover:bg-[#FF6554]/25"
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link
          href="/einstellungen/email-vorlagen"
          className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Abbrechen
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
