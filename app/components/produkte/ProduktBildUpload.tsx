"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProduktBild, deleteProduktBild } from "@/lib/storage";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const MAX_SIZE_MB = 5;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

type Props = {
  produktId: string | null;
  bildUrl: string | null;
  onBildUrlChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ProduktBildUpload({
  produktId,
  bildUrl,
  onBildUrlChange,
  disabled,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !produktId) return;
      if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
        setError("Nur PNG, JPG oder WebP erlaubt.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`Maximal ${MAX_SIZE_MB} MB.`);
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const supabase = createClient();
        const url = await uploadProduktBild(supabase, produktId, file);
        onBildUrlChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload fehlgeschlagen.");
      } finally {
        setUploading(false);
      }
    },
    [produktId, onBildUrlChange]
  );

  const handleRemove = useCallback(async () => {
    if (!produktId || !bildUrl) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteProduktBild(supabase, produktId);
      onBildUrlChange(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }, [produktId, bildUrl, onBildUrlChange]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (disabled || uploading || !produktId) return;
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [disabled, uploading, produktId, handleFile]
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
  }, []);

  if (!produktId) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Bitte zuerst das Produkt speichern, dann kann ein Bild hochgeladen werden.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bildUrl ? (
        <div className="relative inline-block">
          <img
            src={bildUrl}
            alt="Produktbild"
            className="max-h-48 rounded-2xl border border-zinc-200 dark:border-zinc-600 object-contain bg-zinc-50 dark:bg-zinc-800/50"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
            >
              Bild entfernen
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            drag
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
          } ${disabled || uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        >
          <label className="cursor-pointer">
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {uploading
                ? "Wird hochgeladen…"
                : "Bild hier ablegen oder klicken (PNG, JPG, WebP, max. 5 MB)"}
            </span>
          </label>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
