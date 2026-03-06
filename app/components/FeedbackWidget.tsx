"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useFeedback } from "@/app/context/FeedbackContext";
import { useCallback, useEffect, useState } from "react";

const KATEGORIEN = ["Bug", "Idee", "Verbesserung"] as const;
type Kategorie = (typeof KATEGORIEN)[number];

export function FeedbackWidget() {
  const { user, loading } = useUser();
  const {
    open,
    initialTarget,
    initialPosition,
    openFeedback,
    closeFeedback,
    startOverlayMode,
  } = useFeedback();
  const [kategorie, setKategorie] = useState<Kategorie | null>(null);
  const [beschreibung, setBeschreibung] = useState("");
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const isOverlayPosition = initialPosition != null;

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setKategorie(null);
      setBeschreibung("");
      setTarget(initialTarget ?? "");
    }
  }, [open, initialTarget]);

  const handleOpen = useCallback(() => {
    openFeedback();
  }, [openFeedback]);

  const handleClose = useCallback(() => {
    setSuccess(false);
    setKategorie(null);
    setBeschreibung("");
    setTarget("");
    closeFeedback();
  }, [closeFeedback]);

  const handleStartOverlay = useCallback(() => {
    handleClose();
    startOverlayMode();
  }, [handleClose, startOverlayMode]);

  const handleSubmit = useCallback(async () => {
    if (!kategorie || !beschreibung.trim()) return;
    setSending(true);
    const supabase = createClient();
    const seite = typeof window !== "undefined" ? window.location.pathname : "";
    const payload: Record<string, unknown> = {
      user_id: user?.id ?? null,
      user_name: user?.user_metadata?.full_name ?? user?.email ?? null,
      kategorie,
      beschreibung: beschreibung.trim(),
      seite: seite || null,
      target: isOverlayPosition ? "overlay" : (target.trim() || null),
    };
    if (isOverlayPosition && initialPosition) {
      payload.position_x = initialPosition.x;
      payload.position_y = initialPosition.y;
    }
    const { error } = await supabase.from("feedback_eintraege").insert(payload);
    setSending(false);
    if (error) {
      console.error("Feedback senden:", error);
      return;
    }
    setSuccess(true);
    setBeschreibung("");
    setKategorie(null);
    setTarget("");
    setTimeout(handleClose, 1500);
  }, [kategorie, beschreibung, target, user, handleClose, isOverlayPosition, initialPosition]);

  if (loading || !user) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6554] text-white shadow-lg transition hover:bg-[#e55a4a] focus:outline-none focus:ring-2 focus:ring-[#FF6554] focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
        aria-label="Feedback senden"
        title="Feedback senden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
          onKeyDown={(e) => e.key === "Escape" && handleClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <div
            className="content-radius haupt-box w-full max-w-md border border-zinc-200 dark:border-zinc-700 bg-white p-5 shadow-xl dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="feedback-title" className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
                Feedback senden
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                aria-label="Schliessen"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <p className="mt-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
                Vielen Dank! Dein Feedback wurde gesendet.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartOverlay}
                  className="mt-2 w-full rounded-xl border-2 border-dashed border-[#FF6554]/50 bg-[#FF6554]/5 py-3 text-sm font-medium text-[#FF6554] hover:bg-[#FF6554]/10 dark:border-[#FF6554]/40 dark:bg-[#FF6554]/10 dark:hover:bg-[#FF6554]/20"
                >
                  📍 Stelle auf der Seite markieren
                </button>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Öffnet ein Overlay – klicke dann auf die gewünschte Stelle. Das Feedback wird dort für alle sichtbar.
                </p>

                {isOverlayPosition && (
                  <p className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                    ✓ Feedback wird an der markierten Stelle angezeigt.
                  </p>
                )}

                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Kategorie wählen</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {KATEGORIEN.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKategorie(k)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        kategorie === k
                          ? "bg-[#FF6554] text-white"
                          : "border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {!isOverlayPosition && (
                  <>
                    <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Ort (optional)
                    </label>
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="z.B. button-speichern, header-aktionen"
                      className="mt-1 w-full rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#FF6554] focus:outline-none focus:ring-1 focus:ring-[#FF6554]"
                    />
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Wird das Feedback an dieser Stelle in der App angezeigt (für alle sichtbar).
                    </p>
                  </>
                )}

                <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Beschreibung
                </label>
                <textarea
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                  placeholder="Was möchtest du mitteilen?"
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#FF6554] focus:outline-none focus:ring-1 focus:ring-[#FF6554]"
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!kategorie || !beschreibung.trim() || sending}
                    className="rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a] disabled:opacity-50 dark:hover:bg-[#ff8877]"
                  >
                    {sending ? "Wird gesendet…" : "Absenden"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
