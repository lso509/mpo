"use client";

/**
 * Zugeklappt: Plus im Kreis; aufgeklappt: Minus im Kreis.
 * `open` = Inhalt sichtbar / Abschnitt aufgeklappt.
 */
export function CollapsibleChevron({
  open,
  className = "",
  size = "md",
}: {
  open: boolean;
  className?: string;
  /** `sm` für kompakte Zeilen (z. B. Gantt). */
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 ${className}`.trim()}
      aria-hidden
    >
      <svg className={box} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
        {!open && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8" />}
      </svg>
    </span>
  );
}
