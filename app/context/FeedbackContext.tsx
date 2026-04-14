"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type FeedbackPosition = { x: number; y: number };

type FeedbackContextValue = {
  open: boolean;
  initialTarget: string | null;
  /** Position in Prozent relativ zum Scroll-Content (0–100), nur bei target=overlay. */
  initialPosition: FeedbackPosition | null;
  openFeedback: (target?: string) => void;
  /** Öffnet Feedback-Formular mit target=overlay und gesetzter Position (nach Klick im Overlay). */
  openFeedbackAtPosition: (x: number, y: number) => void;
  closeFeedback: () => void;
  /** Overlay-Modus: Nutzer klickt auf die Seite, um eine Stelle zu markieren. */
  overlayMode: boolean;
  startOverlayMode: () => void;
  cancelOverlayMode: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialTarget, setInitialTarget] = useState<string | null>(null);
  const [initialPosition, setInitialPosition] = useState<FeedbackPosition | null>(null);
  const [overlayMode, setOverlayMode] = useState(false);

  const openFeedback = useCallback((target?: string) => {
    setInitialTarget(target ?? null);
    setInitialPosition(null);
    setOpen(true);
  }, []);

  const openFeedbackAtPosition = useCallback((x: number, y: number) => {
    setInitialTarget("overlay");
    setInitialPosition({ x, y });
    setOverlayMode(false);
    setOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setOpen(false);
    setInitialTarget(null);
    setInitialPosition(null);
  }, []);

  const startOverlayMode = useCallback(() => {
    setOpen(false);
    setOverlayMode(true);
  }, []);

  const cancelOverlayMode = useCallback(() => {
    setOverlayMode(false);
  }, []);

  return (
    <FeedbackContext.Provider
      value={{
        open,
        initialTarget,
        initialPosition,
        openFeedback,
        openFeedbackAtPosition,
        closeFeedback,
        overlayMode,
        startOverlayMode,
        cancelOverlayMode,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
