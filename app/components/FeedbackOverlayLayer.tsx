"use client";

import { useFeedback } from "@/app/context/FeedbackContext";
import { useScrollContainer } from "@/app/context/ScrollContainerContext";
import { overlayPositionPercent } from "@/app/components/feedback/shared";
import { useCallback } from "react";

export function FeedbackOverlayLayer() {
  const { overlayMode, cancelOverlayMode, openFeedbackAtPosition } = useFeedback();
  const scrollContainerRef = useScrollContainer();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!overlayMode) return;
      e.preventDefault();
      e.stopPropagation();
      const el = scrollContainerRef?.current;
      const { x: position_x, y: position_y } = overlayPositionPercent(e.clientX, e.clientY, el ?? null);
      openFeedbackAtPosition(position_x, position_y);
    },
    [overlayMode, openFeedbackAtPosition, scrollContainerRef]
  );

  if (!overlayMode) return null;

  return (
    <div
      className="fixed inset-0 z-[100] cursor-crosshair"
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      aria-label="Stelle für Feedback markieren"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 pointer-events-none">
        <p className="text-center text-lg font-medium text-white drop-shadow-md max-w-sm">
          Klicke auf die Stelle, an der du Feedback platzieren möchtest.
        </p>
        <p className="text-sm text-white/90 drop-shadow">
          Das Feedback wird dort für alle sichtbar angezeigt.
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          cancelOverlayMode();
        }}
        className="absolute top-4 right-4 pointer-events-auto rounded-full bg-white/90 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 shadow-lg hover:bg-white dark:hover:bg-zinc-700"
      >
        Abbrechen
      </button>
    </div>
  );
}
