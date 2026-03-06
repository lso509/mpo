import type { AenderungshistorieEntry } from "@/lib/mediaplan/types";

export function Aenderungshistorie({ entries }: { entries: AenderungshistorieEntry[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
      <h4 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Änderungshistorie</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Änderungen erfasst.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const at = e.created_at
              ? new Date(e.created_at).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "—";
            return (
              <li key={e.id} className="rounded-lg border border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium">{e.change_description}</span>
                <span className="mx-2 text-zinc-400">·</span>
                <span className="text-zinc-500">am {at}</span>
                {e.changed_by && (
                  <>
                    <span className="mx-2 text-zinc-400">·</span>
                    <span className="text-zinc-500">{e.changed_by}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
