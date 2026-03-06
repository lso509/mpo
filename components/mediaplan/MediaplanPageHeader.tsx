import type { MediaplanRow } from "@/lib/mediaplan/types";
import { formatDateRange } from "@/lib/mediaplan/utils";

type Props = {
  plan: MediaplanRow;
  titlePrefix?: string;
  onStatusClick?: () => void;
};

export function MediaplanPageHeader({ plan, titlePrefix = "", onStatusClick }: Props) {
  const title = `${titlePrefix}${plan.campaign ?? "Mediaplan"}`;
  const statusLabel = plan.status ?? "Entwurf";
  const statusClassName =
    plan.status === "Aktiv"
      ? "rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 text-sm font-medium text-green-800 dark:text-green-200"
      : "rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{title}</h1>
        {onStatusClick ? (
          <button type="button" onClick={onStatusClick} className={statusClassName}>
            {statusLabel}
          </button>
        ) : plan.status ? (
          <span
            className={
              plan.status === "Aktiv"
                ? "rounded-full border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 text-sm font-medium text-green-800 dark:text-green-200"
                : "rounded-full border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
            }
          >
            {plan.status}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {plan.kunde_name ?? plan.client ?? "—"} | {formatDateRange(plan.date_range_start, plan.date_range_end)}
      </p>
    </div>
  );
}
