"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type AgencyUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

function initials(name: string | undefined, email: string | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/g);
    const a = parts[0]?.[0] ?? "?";
    const b = parts.at(-1)?.[0] ?? "";
    return (a + b).toUpperCase();
  }
  if (email) {
    const part = email.split("@")[0];
    if (part.length >= 2) return part.slice(0, 2).toUpperCase();
    return part ? part.slice(0, 1).toUpperCase() : "?";
  }
  return "?";
}

export default function AgenturMitarbeiterPage() {
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase.rpc("get_agency_profiles");
        if (!mounted) return;
        if (err) {
          setError(err.message);
          setUsers([]);
        } else {
          setUsers((data as AgencyUser[]) ?? []);
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Fehler");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Agentur-Mitarbeiter
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Übersicht aller Teammitglieder mit Agentur-Zugang
        </p>
      </header>

      {error && (
        <div className="content-radius border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="haupt-box border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm dark:bg-zinc-800/80">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mitarbeiter</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
            {loading ? "…" : String(users.length)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">mit Agentur-Zugang</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Alle Agentur-Mitarbeiter
        </h2>
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Wird geladen…</p>
        ) : users.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            Keine Agentur-Mitarbeiter gefunden oder keine Berechtigung.
          </p>
        ) : (
          <div className="content-radius overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    E-Mail
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-600">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              {initials(u.full_name ?? undefined, u.email ?? undefined)}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {u.full_name || u.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {u.email ? (
                        <a
                          href={`mailto:${u.email}`}
                          className="hover:text-[#FF6554] hover:underline dark:hover:text-[#ff8877]"
                        >
                          {u.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
