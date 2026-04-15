import Link from "next/link";

export default function ToolsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Tools</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Hilfsmittel für Importe und Konvertierungen.
        </p>
      </header>

      <ul className="space-y-3">
        <li>
          <Link
            href="/tools/mediaplan-json"
            className="haupt-box flex flex-col gap-1 border border-zinc-200 p-5 transition hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
          >
            <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
              Mediaplan importieren
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Claude- oder KI-Export (mediaplan, produkte, positionen) als neuer Entwurf inkl. Katalog.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/tools/maps"
            className="haupt-box flex flex-col gap-1 border border-zinc-200 p-5 transition hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
          >
            <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Map Planner</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Werbezonen auf der Karte wählen, PLZ- und Meta-Exporte für Kampagnenplanung.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
