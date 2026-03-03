"use client";

import Link from "next/link";

export default function NeuerMediaplanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Neuer Mediaplan
      </h1>
      <p className="text-zinc-600">
        Formular für neue Mediapläne (Placeholder). Kunden auswählen, Zeitraum
        und Kampagnenname eingeben.
      </p>
      <Link
        href="/mediaplaene"
        className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        ← Zurück zur Liste
      </Link>
    </div>
  );
}
