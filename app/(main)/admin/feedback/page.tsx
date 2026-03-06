"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FeedbackEintrag = {
  id: string;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  kategorie: string;
  beschreibung: string;
  seite: string | null;
  target: string | null;
  position_x: number | null;
  position_y: number | null;
  status: string;
};

const STATUS_OPTIONS = ["Offen", "In Bearbeitung", "Erledigt"] as const;
const KATEGORIEN = ["Bug", "Idee", "Verbesserung"] as const;

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user, role, loading: userLoading } = useUser();
  const [eintraege, setEintraege] = useState<FeedbackEintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKategorie, setFilterKategorie] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTarget, setFilterTarget] = useState<string>("");

  const isAgency = (role?.toLowerCase?.() ?? "") === "agency";

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("feedback_eintraege")
      .select("id, created_at, user_id, user_name, kategorie, beschreibung, seite, target, position_x, position_y, status")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setEintraege([]);
    } else {
      setError(null);
      setEintraege((data as FeedbackEintrag[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && !isAgency && user) {
      router.replace("/dashboard");
      return;
    }
    if (!userLoading && !user) {
      router.replace("/login");
      return;
    }
    if (isAgency) load();
  }, [userLoading, user, isAgency, router, load]);

  const updateStatus = useCallback(
    async (id: string, status: string) => {
      const supabase = createClient();
      const { error: err } = await supabase.from("feedback_eintraege").update({ status }).eq("id", id);
      if (err) setError(err.message);
      else setEintraege((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    },
    []
  );

  const filtered = eintraege.filter((e) => {
    if (filterKategorie && e.kategorie !== filterKategorie) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterTarget && (e.target ?? "") !== filterTarget) return false;
    return true;
  });

  const targetOptions = Array.from(
    new Set(eintraege.map((e) => e.target).filter((t): t is string => !!t))
  ).sort();

  if (userLoading || (!isAgency && user)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Wird geladen…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Feedback-Verwaltung
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Alle Feedback-Einträge (Bug, Idee, Verbesserung)
        </p>
      </header>

      {error && (
        <div className="content-radius border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Kategorie:</span>
          <select
            value={filterKategorie}
            onChange={(e) => setFilterKategorie(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {KATEGORIEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>Ort (Target):</span>
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Alle</option>
            {targetOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">Einträge werden geladen…</p>
      ) : (
        <div className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Datum</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">User</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Kategorie</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Ort (Target)</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Position</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Seite</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Beschreibung</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDatum(e.created_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {e.user_name ?? e.user_id ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.kategorie === "Bug"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                            : e.kategorie === "Idee"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        }`}
                      >
                        {e.kategorie}
                      </span>
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400" title={e.target ?? ""}>
                      {e.target || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {e.target === "overlay" && e.position_x != null && e.position_y != null
                        ? `${Number(e.position_x).toFixed(0)}%, ${Number(e.position_y).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {e.seite ? (
                        <span className="flex items-center gap-2">
                          <span className="truncate" title={e.seite}>
                            {e.seite}
                          </span>
                          {e.target === "overlay" && e.position_x != null && e.position_y != null && (
                            <a
                              href={`${e.seite}#feedback-${e.id}`}
                              className="shrink-0 rounded-full bg-[#FF6554] px-2 py-0.5 text-xs font-medium text-white hover:bg-[#e55a4a]"
                            >
                              Zum Pin
                            </a>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      <span className="line-clamp-2">{e.beschreibung}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={e.status}
                        onChange={(ev) => updateStatus(e.id, ev.target.value)}
                        className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-[#FF6554] focus:outline-none focus:ring-1 focus:ring-[#FF6554]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="p-6 text-center text-zinc-500 dark:text-zinc-400">Keine Einträge.</p>
          )}
        </div>
      )}
    </div>
  );
}
