/**
 * Supabase Storage-Helfer für Produktbilder und Mediadatenblätter.
 * Direkte Uploads vom Browser zu Supabase Storage (kein API-Route).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_BILDER = "produkt-bilder";
const BUCKET_DATEIEN = "produkt-dateien";

function getExt(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith(".png")) return "png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "jpg";
  if (n.endsWith(".webp")) return "webp";
  return "jpg";
}

/**
 * Lädt ein Produktbild hoch. Pfad: produkt-bilder/[produktId]/bild.[ext]
 * Gibt die öffentliche URL zurück (Bucket ist public).
 */
export async function uploadProduktBild(
  supabase: SupabaseClient,
  produktId: string,
  file: File
): Promise<string> {
  const ext = getExt(file);
  const path = `${produktId}/bild.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_BILDER).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET_BILDER).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * Löscht das Produktbild aus dem Storage (alle Varianten .png/.jpg/.webp).
 * Die Spalte produkte.bild_url muss separat auf null gesetzt werden.
 */
export async function deleteProduktBild(
  supabase: SupabaseClient,
  produktId: string
): Promise<void> {
  const exts = ["png", "jpg", "jpeg", "webp"];
  await Promise.all(
    exts.map((ext) =>
      supabase.storage.from(BUCKET_BILDER).remove([`${produktId}/bild.${ext}`])
    )
  );
}

export type ProduktDateiMeta = {
  name: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
};

/**
 * Lädt eine Mediadatei hoch. Pfad: produkt-dateien/[produktId]/[dateiname]
 * Gibt Metadaten zurück (URL für private Buckets per getSignedUrl).
 */
export async function uploadProduktDatei(
  supabase: SupabaseClient,
  produktId: string,
  file: File
): Promise<ProduktDateiMeta> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${produktId}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET_DATEIEN).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return {
    name: file.name,
    path,
    size: file.size,
    type: file.type,
    uploaded_at: new Date().toISOString(),
  };
}

/**
 * Löscht eine einzelne Datei aus dem Storage.
 */
export async function deleteProduktDatei(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_DATEIEN).remove([path]);
  if (error) throw error;
}

/**
 * Erzeugt eine temporäre signierte Download-URL (Standard: 1 Stunde).
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_DATEIEN)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Keine signierte URL erhalten");
  return data.signedUrl;
}
