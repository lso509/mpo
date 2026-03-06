"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  uploadProduktDatei,
  deleteProduktDatei,
  getSignedUrl,
  type ProduktDateiMeta,
} from "@/lib/storage";

const ACCEPT =
  ".pdf,.ppt,.pptx,.xls,.xlsx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_SIZE_MB = 20;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const SIGNED_URL_EXPIRES = 3600;

function fileIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("pdf")) return "📄";
  if (t.includes("spreadsheet") || t.includes("excel") || t.includes("xls")) return "📊";
  if (t.includes("presentation") || t.includes("powerpoint") || t.includes("ppt")) return "📽️";
  return "📎";
}

type Props = {
  produktId: string | null;
  dateien: ProduktDateiMeta[];
  onDateienChange: (dateien: ProduktDateiMeta[]) => void;
  disabled?: boolean;
};

export function ProduktDateienUpload({
  produktId,
  dateien,
  onDateienChange,
  disabled,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!produktId || !files?.length) return;
      const allowed = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const list = Array.from(files).filter((f) => {
        if (f.size > MAX_BYTES) return false;
        return allowed.some((m) => f.type === m);
      });
      if (list.length === 0) {
        setError("Nur PDF, PPT, PPTX, XLS, XLSX erlaubt, max. 20 MB pro Datei.");
        return;
      }
      setError(null);
      setUploading(true);
      const supabase = createClient();
      try {
        const next: ProduktDateiMeta[] = [...dateien];
        for (const file of list) {
          const meta = await uploadProduktDatei(supabase, produktId, file);
          next.push(meta);
        }
        onDateienChange(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload fehlgeschlagen.");
      } finally {
        setUploading(false);
      }
    },
    [produktId, dateien, onDateienChange]
  );

  const handleRemove = useCallback(
    async (path: string) => {
      if (!produktId) return;
      setUploading(true);
      setError(null);
      try {
        const supabase = createClient();
        await deleteProduktDatei(supabase, path);
        onDateienChange(dateien.filter((d) => d.path !== path));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
      } finally {
        setUploading(false);
      }
    },
    [produktId, dateien, onDateienChange]
  );

  const handleDownload = useCallback(async (path: string) => {
    try {
      const supabase = createClient();
      const url = await getSignedUrl(supabase, path, SIGNED_URL_EXPIRES);
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Download-Link konnte nicht erstellt werden.");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (disabled || uploading || !produktId) return;
      handleFiles(e.dataTransfer.files ?? []);
    },
    [disabled, uploading, produktId, handleFiles]
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
        Bitte zuerst das Produkt speichern, dann können Dateien hochgeladen werden.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          drag
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
        } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <label className="cursor-pointer">
          <input
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files;
              if (f?.length) handleFiles(f);
              e.target.value = "";
            }}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {uploading
              ? "Wird hochgeladen…"
              : "Dateien hier ablegen oder klicken (PDF, PPT, PPTX, XLS, XLSX, max. 20 MB)"}
          </span>
        </label>
      </div>

      {dateien.length > 0 && (
        <ul className="space-y-2">
          {dateien.map((d) => (
            <li
              key={d.path}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 px-3 py-2.5"
            >
              <span className="text-lg" aria-hidden>
                {fileIcon(d.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {d.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(d.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(d.path)}
                className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => handleRemove(d.path)}
                disabled={uploading}
                className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
