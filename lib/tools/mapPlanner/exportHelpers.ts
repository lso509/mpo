import type { MapZone } from "./types";
import * as XLSX from "xlsx";

export type PlzExportRow = {
  zone_name: string;
  postal_code: string;
  municipality: string;
  canton: string;
  country: string;
};

export type MetaExportRow = {
  municipality: string;
  postal_code: string;
  canton: string;
  country: string;
};

export function buildPlzExportRows(zones: MapZone[]): PlzExportRow[] {
  const out: PlzExportRow[] = [];
  for (const z of zones) {
    for (const p of z.plzData) {
      out.push({
        zone_name: z.name,
        postal_code: p.postal_code,
        municipality: p.municipality,
        canton: p.canton,
        country: p.country,
      });
    }
  }
  return out;
}

/** Meta Ads: ohne zone_name, eindeutig nach PLZ+Ort+Kanton+Land */
export function buildMetaExportRows(zones: MapZone[]): MetaExportRow[] {
  const seen = new Set<string>();
  const out: MetaExportRow[] = [];
  for (const z of zones) {
    for (const p of z.plzData) {
      const k = `${p.postal_code}|${p.municipality}|${p.canton}|${p.country}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        municipality: p.municipality,
        postal_code: p.postal_code,
        canton: p.canton,
        country: p.country,
      });
    }
  }
  return out;
}

function escapeCsvCell(v: string): string {
  if (/[,"\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function rowsToCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(String(row[h] ?? ""))).join(","));
  }
  return lines.join("\n");
}

export function downloadTextFile(filename: string, text: string, mime: string) {
  const blob = new Blob(["\uFEFF" + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPlzXlsx(filename: string, rows: PlzExportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PLZ");
  XLSX.writeFile(wb, filename);
}

export function aggregateStats(zones: MapZone[]): { totalPlz: number; totalGemeinden: number } {
  let totalPlz = 0;
  const gemeinden = new Set<string>();
  for (const z of zones) {
    totalPlz += z.plzData.length;
    for (const p of z.plzData) {
      gemeinden.add(`${p.municipality}|${p.canton}|${p.country}`);
    }
  }
  return { totalPlz, totalGemeinden: gemeinden.size };
}
