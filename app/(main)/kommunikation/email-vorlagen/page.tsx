"use client";

import { nochNichtImplementiert } from "@/lib/not-implemented";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EmailVorlage = {
  id: string;
  title: string;
  subject: string | null;
  body: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  Gesamt: "zinc",
  Kunde: "blue",
  Verlag: "emerald",
  Lieferant: "orange",
  Intern: "accent",
};

export default function EmailVorlagenPage() {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailVorlage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("email_vorlagen")
      .select("id, title, subject, body, category, tags, created_at, updated_at")
      .order("title")
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setTemplates([]);
        } else {
          setTemplates((data ?? []) as EmailVorlage[]);
        }
        setLoading(false);
      });
  }, []);

  const categoryCards = useMemo(() => {
    const total = templates.length;
    const byCat: Record<string, number> = { Kunde: 0, Verlag: 0, Lieferant: 0, Intern: 0 };
    for (const t of templates) {
      const c = t.category ?? "Kunde";
      if (c in byCat) byCat[c]++;
      else byCat[c] = 1;
    }
    return [
      { label: "Gesamt", value: String(total), color: CATEGORY_COLORS["Gesamt"] ?? "zinc" },
      { label: "Kunde", value: String(byCat["Kunde"] ?? 0), color: "blue" },
      { label: "Verlag", value: String(byCat["Verlag"] ?? 0), color: "emerald" },
      { label: "Lieferant", value: String(byCat["Lieferant"] ?? 0), color: "orange" },
      { label: "Intern", value: String(byCat["Intern"] ?? 0), color: "accent" },
    ];
  }, [templates]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          E-Mail Vorlagen
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Vordefinierte E-Mail-Templates für wiederkehrende Kommunikation
        </p>
      </header>

      {error && (
        <div className="content-radius border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
          Fehler beim Laden: {error}
        </div>
      )}

      <section className="haupt-box dark:bg-zinc-800 p-6">
        <div className="flex flex-wrap items-center gap-4">
          {categoryCards.map((c) => (
            <div
              key={c.label}
              className={`content-radius border px-4 py-3 ${
                c.color === "zinc"
                  ? "border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800/80"
                  : c.color === "blue"
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : c.color === "emerald"
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : c.color === "orange"
                        ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
                        : "border-[#FF6554]/30 bg-[#FF6554]/15 dark:border-[#FF6554]/50 dark:bg-[#FF6554]/20"
              }`}
            >
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{c.label}</p>
              <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{c.value}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="ml-auto rounded-full bg-[#FF6554] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e55a4a]"
          >
            + Neue Vorlage
          </button>
        </div>

        <div className="mt-4 flex gap-4">
          <input
            type="search"
            placeholder="Suche nach Name, Betreff oder Inhalt..."
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100"
          />
          <select className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200">
            <option>Alle Kategorien</option>
          </select>
          <select className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200">
            <option>Alle Schritte</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-6 text-zinc-500 dark:text-zinc-400">Vorlagen werden geladen…</p>
        ) : (
        <ul className="mt-6 space-y-3">
          {templates.map((t) => {
            const created = t.created_at ? new Date(t.created_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
            const updated = t.updated_at ? new Date(t.updated_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;
            const placeholders = (t.subject ?? "").match(/\{\{[^}]+\}\}/g)?.length ?? 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/kommunikation/email-vorlagen/${t.id}`}
                  className="content-radius flex items-center justify-between border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4 transition hover:border-[#FF6554]/50 dark:hover:border-[#FF6554]"
                >
                <div className="flex items-start gap-3">
                  <span className="text-2xl opacity-70">✉</span>
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-100">{t.title}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Betreff: {t.subject ?? "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(t.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {placeholders} Platzhalter · Erstellt: {created}
                      {updated != null && ` · Aktualisiert: ${updated}`}
                    </p>
                  </div>
                </div>
                <span className="text-zinc-400">→</span>
              </Link>
            </li>
          );
        })}
        </ul>
        )}
      </section>

      {newModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setNewModalOpen(false)}
        >
          <div
            className="content-radius w-full max-w-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">
              Neue Vorlage erstellen
            </h3>
            <form className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500">
                  Name
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500">
                  Kategorie
                </label>
                <select className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <option>Kunde</option>
                  <option>Verlag</option>
                  <option>Lieferant</option>
                  <option>Intern</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={nochNichtImplementiert}
                  className="rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a]"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
