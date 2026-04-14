/**
 * Import von Claude/AI-exportiertem Mediaplan-JSON (Produkte + Positionen + Metadaten).
 * Kein externes API — nur Mapping + Supabase-Insert.
 */

import { CATEGORIES, DEFAULT_MM_TARIFFS, emptyProduct, productToRow, type Product } from "@/lib/produkte";
import type { SupabaseClient } from "@supabase/supabase-js";

const DE_MONTHS: Record<string, number> = {
  januar: 0,
  februar: 1,
  märz: 2,
  april: 3,
  mai: 4,
  juni: 5,
  juli: 6,
  august: 7,
  september: 8,
  oktober: 9,
  november: 10,
  dezember: 11,
};

export type ClaudeJsonKontakt = {
  name?: string | null;
  email?: string | null;
  telefon?: string | null;
};

export type ClaudeJsonMediaplanMeta = {
  kunde: string;
  kampagne: string;
  laufzeit?: string;
  budget_bemerkung?: string;
  datum?: string;
  kontakt_kunde?: ClaudeJsonKontakt;
  kontakt_agentur?: ClaudeJsonKontakt;
};

export type ClaudeJsonProdukt = {
  _ref: string;
  category?: string;
  kanal?: string | null;
  produktgruppe?: string | null;
  verlag?: string | null;
  produktvarianteTitel?: string | null;
  produktbeschreibung?: string | null;
  platzierung?: string | null;
  zusatzinformationen?: string | null;
  zielEignung?: string | null;
  creativeFarbe?: string | null;
  creativeDateityp?: string | null;
  creativeGroesse?: string | null;
  creativeGroesseEinheit?: string | null;
  creativeTyp?: string | null;
  waehrung?: string | null;
  pricingType?: string;
  editionType?: string;
  preisBruttoChf?: number | null;
  preisNettoChf?: number | null;
  laufzeitProEinheit?: string | null;
  buchungsvoraussetzung?: string | null;
};

export type ClaudeJsonPosition = {
  _produkt_ref: string;
  bezeichnung: string;
  preis_brutto?: number;
  rabatt_prozent?: number;
  rabatt_chf?: number;
  preis_netto?: number;
  frequenz?: number;
  preis_netto_gesamt?: number;
  verdienst_prozent?: number;
  verdienst_chf?: number | null;
  belegung?: string[];
  bemerkungen?: string | null;
};

export type ClaudeJsonExport = {
  mediaplan: ClaudeJsonMediaplanMeta;
  produkte: ClaudeJsonProdukt[];
  positionen: ClaudeJsonPosition[];
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

export function validateClaudeJson(data: unknown): { ok: true; value: ClaudeJsonExport } | { ok: false; error: string } {
  if (!isRecord(data)) return { ok: false, error: "Ungültiges JSON (kein Objekt)." };
  const mp = data.mediaplan;
  const prod = data.produkte;
  const pos = data.positionen;
  if (!isRecord(mp)) return { ok: false, error: "Feld mediaplan fehlt oder ist ungültig." };
  if (typeof mp.kunde !== "string" || !mp.kunde.trim()) return { ok: false, error: "mediaplan.kunde fehlt." };
  if (typeof mp.kampagne !== "string" || !mp.kampagne.trim()) return { ok: false, error: "mediaplan.kampagne fehlt." };
  if (!Array.isArray(prod)) return { ok: false, error: "produkte muss ein Array sein." };
  if (!Array.isArray(pos)) return { ok: false, error: "positionen muss ein Array sein." };
  if (prod.length === 0) return { ok: false, error: "produkte darf nicht leer sein." };
  if (pos.length === 0) return { ok: false, error: "positionen darf nicht leer sein." };
  for (const p of prod) {
    if (!isRecord(p) || typeof p._ref !== "string" || !p._ref.trim()) {
      return { ok: false, error: "Jedes Produkt braucht einen String _ref." };
    }
  }
  const refSet = new Set(prod.map((p) => (p as ClaudeJsonProdukt)._ref));
  for (const q of pos) {
    if (!isRecord(q) || typeof q._produkt_ref !== "string" || !q._produkt_ref.trim()) {
      return { ok: false, error: "Jede Position braucht _produkt_ref." };
    }
    if (!refSet.has(q._produkt_ref)) {
      return { ok: false, error: `Unbekannte Produkt-Ref in positionen: „${q._produkt_ref}“` };
    }
  }
  return {
    ok: true,
    value: data as unknown as ClaudeJsonExport,
  };
}

/** Grobe Laufzeit → ISO-Daten (Monatsnamen DE/EN, z. B. „Mai 2026 bis Mai 2027“). */
export function parseLaufzeitToDateRange(
  laufzeit: string | undefined,
  datumFallback: string | undefined
): { date_range_start: string | null; date_range_end: string | null } {
  if (!laufzeit?.trim()) {
    return { date_range_start: null, date_range_end: null };
  }
  const y = datumFallback ? new Date(datumFallback).getFullYear() : new Date().getFullYear();
  const years = laufzeit.match(/\b(20\d{2})\b/g);
  const yStart = years?.length ? parseInt(years[0], 10) : y;
  const yEnd = years && years.length >= 2 ? parseInt(years[1], 10) : yStart;

  const lower = laufzeit.toLowerCase();
  const mStart = lower.match(
    /(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+(20\d{2})/i
  );
  const parts = lower.split(/\s+bis\s+/i);
  let monthStart = 0;
  let monthEnd = 11;
  if (mStart) {
    const mo = DE_MONTHS[mStart[1].toLowerCase()];
    if (mo !== undefined) monthStart = mo;
  } else {
    const moOnly = lower.match(/^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i);
    if (moOnly) {
      const mo = DE_MONTHS[moOnly[1].toLowerCase()];
      if (mo !== undefined) monthStart = mo;
    }
  }
  if (parts[1]) {
    const mEnd = parts[1].match(
      /(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
    );
    if (mEnd) {
      const mo = DE_MONTHS[mEnd[1].toLowerCase()];
      if (mo !== undefined) monthEnd = mo;
    }
  }

  const lastDay = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();
  const start = `${yStart}-${String(monthStart + 1).padStart(2, "0")}-01`;
  const end = `${yEnd}-${String(monthEnd + 1).padStart(2, "0")}-${String(lastDay(yEnd, monthEnd)).padStart(2, "0")}`;
  return { date_range_start: start, date_range_end: end };
}

function inferYears(laufzeit: string | undefined, datumIso: string | undefined): { firstYear: number; secondYear: number } {
  const m = laufzeit?.match(/(20\d{2})\s*bis\s*.*?(20\d{2})/);
  if (m) return { firstYear: parseInt(m[1], 10), secondYear: parseInt(m[2], 10) };
  const y = datumIso ? new Date(datumIso).getFullYear() : new Date().getFullYear();
  return { firstYear: y, secondYear: y };
}

/** Monat 5–12 → erstes Kampagnenjahr; Monat 1–4 bei 2-Jahres-Lauf → zweites Jahr (Heuristik). */
function yearForMonth(mo1Based: number, y: { firstYear: number; secondYear: number }): number {
  if (y.firstYear === y.secondYear) return y.firstYear;
  return mo1Based >= 5 ? y.firstYear : y.secondYear;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Ein Slot „04.05. - 10.05.“ → Start/Ende-Datum (ISO). */
function parseBelegungSlot(slot: string, ydef: { firstYear: number; secondYear: number }): { start: string; end: string } | null {
  const re = /(\d{1,2})\.(\d{1,2})\.\s*-\s*(\d{1,2})\.(\d{1,2})\.?/;
  const x = slot.trim().match(re);
  if (!x) return null;
  const d1 = parseInt(x[1], 10);
  const mo1 = parseInt(x[2], 10);
  const d2 = parseInt(x[3], 10);
  const mo2 = parseInt(x[4], 10);
  if (mo1 < 1 || mo1 > 12 || mo2 < 1 || mo2 > 12) return null;
  const ys = yearForMonth(mo1, ydef);
  let ye = yearForMonth(mo2, ydef);
  const s = new Date(ys, mo1 - 1, d1);
  let e = new Date(ye, mo2 - 1, d2);
  if (e < s) {
    ye = ys + (mo2 < mo1 ? 1 : 0);
    e = new Date(ye, mo2 - 1, d2);
  }
  return { start: toIsoDate(s), end: toIsoDate(e) };
}

export function aggregateBelegungDates(
  belegung: string[] | undefined,
  laufzeit: string | undefined,
  datumIso: string | undefined
): { start_date: string | null; end_date: string | null } {
  if (!belegung?.length) return { start_date: null, end_date: null };
  const ydef = inferYears(laufzeit, datumIso);
  let min: Date | null = null;
  let max: Date | null = null;
  for (const slot of belegung) {
    const r = parseBelegungSlot(slot, ydef);
    if (!r) continue;
    const s = new Date(r.start);
    const e = new Date(r.end);
    if (!Number.isNaN(s.getTime()) && (!min || s < min)) min = s;
    if (!Number.isNaN(e.getTime()) && (!max || e > max)) max = e;
  }
  if (!min || !max) return { start_date: null, end_date: null };
  return { start_date: toIsoDate(min), end_date: toIsoDate(max) };
}

function normalizeCategory(cat: unknown): string {
  const s = typeof cat === "string" ? cat.trim() : "";
  if (s && CATEGORIES.includes(s)) return s;
  return "CUSTOM";
}

function mapJsonProduktToProduct(j: ClaudeJsonProdukt): Partial<Product> {
  const pricingType = j.pricingType === "per_mm" ? "per_mm" : "fixed";
  const editionType = j.editionType === "ga" ? "ga" : "na";
  const einh =
    j.creativeGroesseEinheit === "mm" || j.creativeGroesseEinheit === "cm" ? j.creativeGroesseEinheit : "px";
  return {
    ...emptyProduct,
    category: normalizeCategory(j.category),
    verlag: j.verlag ?? null,
    kanal: j.kanal ?? null,
    produktgruppe: j.produktgruppe ?? null,
    useCase: [],
    produktbeschreibung: j.produktbeschreibung ?? null,
    produktvarianteTitel: j.produktvarianteTitel ?? null,
    platzierung: j.platzierung ?? null,
    zusatzinformationen: j.zusatzinformationen ?? null,
    zielEignung: j.zielEignung ?? null,
    creativeFarbe: j.creativeFarbe ?? null,
    creativeDateityp: j.creativeDateityp ?? null,
    creativeGroesse: j.creativeGroesse ?? null,
    creativeGroesseEinheit: einh,
    creativeTyp: j.creativeTyp ?? null,
    waehrung: j.waehrung === "EUR" ? "EUR" : "CHF",
    pricingType,
    editionType,
    mmTariffs:
      pricingType === "per_mm"
        ? DEFAULT_MM_TARIFFS.map((row) => ({ ...row, columnWidths: [...row.columnWidths] }))
        : [],
    fixedFormats: [],
    laufzeitProEinheit: j.laufzeitProEinheit ?? null,
    preisBruttoChf: j.preisBruttoChf ?? null,
    preisNettoChf: j.preisNettoChf ?? null,
    buchungsvoraussetzung: j.buchungsvoraussetzung ?? null,
  };
}

function formatDiscountText(pos: ClaudeJsonPosition): string | null {
  const rp = pos.rabatt_prozent;
  const chf = pos.rabatt_chf;
  if (rp == null && (chf == null || chf === 0)) return null;
  const parts: string[] = [];
  if (rp != null) parts.push(`${(rp * 100).toLocaleString("de-CH", { maximumFractionDigits: 2 })} %`);
  if (chf != null && chf !== 0) parts.push(`${chf.toLocaleString("de-CH", { minimumFractionDigits: 2 })} CHF`);
  return parts.length ? parts.join(", Rabatt ") : null;
}

function lineBrutto(pos: ClaudeJsonPosition): number | null {
  const u = pos.preis_brutto;
  const f = pos.frequenz ?? 1;
  if (u == null) return null;
  return u * f;
}

export type ClaudeImportResult = {
  mediaplanId: string;
  productsInserted: number;
  positionsInserted: number;
};

/**
 * Legt Kunde (optional), Mediaplan, Produkte und Positionen an.
 */
export async function importClaudeJsonExport(
  supabase: SupabaseClient,
  data: ClaudeJsonExport
): Promise<ClaudeImportResult> {
  const meta = data.mediaplan;
  const { date_range_start, date_range_end } = parseLaufzeitToDateRange(meta.laufzeit, meta.datum);

  let kundeId: string | null = null;
  const kundeName = meta.kunde.trim();
  const { data: existingKunde } = await supabase.from("kunden").select("id").eq("name", kundeName).maybeSingle();
  if (existingKunde?.id) {
    kundeId = existingKunde.id as string;
  } else {
    const { data: insK, error: kErr } = await supabase
      .from("kunden")
      .insert({ name: kundeName, status: "Aktiv" })
      .select("id")
      .single();
    if (kErr) throw new Error(`Kunde anlegen: ${kErr.message}`);
    kundeId = insK?.id as string;
  }

  const kk = meta.kontakt_kunde ?? {};
  const ka = meta.kontakt_agentur ?? {};

  const { data: planRow, error: planErr } = await supabase
    .from("mediaplaene")
    .insert({
      client: kundeName,
      kunde_id: kundeId,
      status: "Entwurf",
      campaign: meta.kampagne.trim(),
      date_range_start,
      date_range_end,
      kunde_email: kk.email ?? null,
      kunde_telefon: kk.telefon ?? null,
      kunde_ap_name: kk.name ?? null,
      berater_name: ka.name ?? null,
      berater_email: ka.email ?? null,
      berater_telefon: ka.telefon ?? null,
    })
    .select("id")
    .single();

  if (planErr || !planRow) throw new Error(`Mediaplan anlegen: ${planErr?.message ?? "unbekannt"}`);
  const mediaplanId = planRow.id as string;

  const refToProductId = new Map<string, string>();

  for (const jp of data.produkte) {
    const partial = mapJsonProduktToProduct(jp);
    const row = productToRow(partial);
    const { data: prodIns, error: pErr } = await supabase.from("produkte").insert(row).select("id").single();
    if (pErr || !prodIns) throw new Error(`Produkt „${jp._ref}“: ${pErr?.message ?? "Insert fehlgeschlagen"}`);
    refToProductId.set(jp._ref, prodIns.id as string);
  }

  let sort = 0;
  for (const pos of data.positionen) {
    const produktId = refToProductId.get(pos._produkt_ref);
    if (!produktId) {
      throw new Error(`Position „${pos.bezeichnung}“: unbekannte Produkt-Ref „${pos._produkt_ref}“`);
    }
    const bruttoLine = lineBrutto(pos);
    const kundenpreis = pos.preis_netto_gesamt ?? null;
    const { start_date, end_date } = aggregateBelegungDates(pos.belegung, meta.laufzeit, meta.datum);
    const descParts = [pos.bemerkungen].filter(Boolean);
    if (pos.belegung?.length) descParts.push(`Belegung:\n${pos.belegung.join("\n")}`);
    const description = descParts.length ? descParts.join("\n\n") : null;
    const rabattPct = pos.rabatt_prozent != null ? pos.rabatt_prozent * 100 : null;

    const { error: posErr } = await supabase.from("mediaplan_positionen").insert({
      mediaplan_id: mediaplanId,
      produkt_id: produktId,
      title: pos.bezeichnung,
      description,
      tag: null,
      brutto: bruttoLine,
      discount_text: formatDiscountText(pos),
      kundenpreis,
      status_tags: ["Offen"],
      sort_order: sort++,
      start_date,
      end_date,
      creative_deadline: null,
      menge_volumen: pos.frequenz != null ? `${pos.frequenz}×` : null,
      anzahl_einheiten: pos.frequenz ?? null,
      rabatt_prozent: rabattPct,
      agenturgebuehr: pos.verdienst_chf ?? null,
      prozess_status: {},
    });
    if (posErr) throw new Error(`Position „${pos.bezeichnung}“: ${posErr.message}`);
  }

  return {
    mediaplanId,
    productsInserted: data.produkte.length,
    positionsInserted: data.positionen.length,
  };
}
