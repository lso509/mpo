"use client";

import { useState } from "react";
import type {
  MediaplanPDFKunde,
  MediaplanPDFKampagne,
  MediaplanPDFKundenberater,
  MediaplanPDFPosition,
} from "@/components/pdf/MediaplanPDF";

export type MediaplanPDFPayload = {
  kunde: MediaplanPDFKunde;
  kampagne: MediaplanPDFKampagne;
  kundenberater?: MediaplanPDFKundenberater;
  positionen: MediaplanPDFPosition[];
  erstelltAm?: string;
};

type MediaplanPDFButtonProps = {
  payload: MediaplanPDFPayload | null;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function MediaplanPDFButton({
  payload,
  disabled = false,
  className = "",
  children = "A3 PDF exportieren",
}: MediaplanPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!payload || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pdf/mediaplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "PDF konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading || !payload;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
    >
      {loading ? "PDF wird erstellt…" : children}
    </button>
  );
}
