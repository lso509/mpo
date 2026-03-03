"use client";

import { useParams } from "next/navigation";
import { nochNichtImplementiert } from "@/lib/not-implemented";

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          E-Mail Vorlage – {id === "1" ? "Creatives beim Kunden anfordern" : "Detail"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Betreff: Creative-Material für {`{{campaign_name}}`} benötigt
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-700">Inhalt</h2>
        <div className="mt-3">
          <textarea
            rows={12}
            placeholder="E-Mail-Text mit Platzhaltern..."
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900"
            defaultValue={`Sehr geehrte Damen und Herren,

für die Kampagne {{campaign_name}} benötigen wir noch das Creative-Material.

Bitte senden Sie uns die Unterlagen bis {{due_date}}.

Mit freundlichen Grüßen
{{contact_name}}`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-700">
          Verfügbare Platzhalter
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={nochNichtImplementiert}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-900 hover:bg-violet-100"
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={nochNichtImplementiert}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}
