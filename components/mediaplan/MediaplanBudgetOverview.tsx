import { formatChf } from "@/lib/mediaplan/utils";

type Props = {
  bestaetigtSumme: number;
  ausstehendSumme: number;
  gesamtEinmalig: number;
  totalRabatt: number;
};

export function MediaplanBudgetOverview({
  bestaetigtSumme,
  ausstehendSumme,
  gesamtEinmalig,
  totalRabatt,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4">
      <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Budgetübersicht</h3>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600 dark:text-zinc-400">Bestätigte Positionen (exkl. MwSt.)</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">{formatChf(bestaetigtSumme)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-orange-600 dark:text-orange-400">Ausstehende Freigaben</dt>
          <dd className="font-medium text-orange-600 dark:text-orange-400 shrink-0">{formatChf(ausstehendSumme)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-zinc-200 dark:border-zinc-600 pt-2">
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">Gesamt einmalig</dt>
          <dd className="font-semibold text-zinc-950 dark:text-zinc-100 shrink-0">{formatChf(gesamtEinmalig)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600 dark:text-zinc-400">Totalrabatt (einmalige Positionen)</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">{formatChf(totalRabatt)}</dd>
        </div>
      </dl>
    </div>
  );
}
