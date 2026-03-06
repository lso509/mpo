import { createClient } from "@/lib/supabase/client";
import type { AenderungshistorieEntry, CatalogProduct, MediaplanRow, PositionRow } from "@/lib/mediaplan/types";
import { freigabeStatus } from "@/lib/mediaplan/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useMediaplanData(id: string) {
  const [plan, setPlan] = useState<MediaplanRow | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [aenderungshistorie, setAenderungshistorie] = useState<AenderungshistorieEntry[]>([]);
  const [catalogProductMap, setCatalogProductMap] = useState<Record<string, CatalogProduct>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("mediaplaene")
      .select("id, client, kunde_id, status, campaign, date_range_start, date_range_end, kunde_adresse, kunde_email, kunde_telefon, kunde_ap_name, kunde_ap_position, kunde_ap_email, kunde_ap_telefon, kunde_ap_mobil, berater_name, berater_position, berater_email, berater_telefon, berater_mobil")
      .eq("id", id)
      .single();
    if (err) {
      setError(err.message);
      setPlan(null);
      return;
    }
    const row = data as MediaplanRow & { kunde_id?: string };
    if (row.kunde_id) {
      const { data: kData } = await supabase.from("kunden").select("name").eq("id", row.kunde_id).single();
      row.kunde_name = kData?.name ?? null;
    } else {
      row.kunde_name = null;
    }
    setPlan(row);
  }, [id]);

  const loadPositions = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("mediaplan_positionen")
      .select("*")
      .eq("mediaplan_id", id)
      .order("sort_order", { ascending: true });
    if (err) {
      setError(err.message);
      setPositions([]);
      return;
    }
    setPositions((data ?? []) as PositionRow[]);
  }, [id]);

  const loadAenderungshistorie = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("mediaplan_aenderungshistorie")
      .select("id, created_at, changed_by, change_description")
      .eq("mediaplan_id", id)
      .order("created_at", { ascending: false });
    setAenderungshistorie((data ?? []) as AenderungshistorieEntry[]);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([loadPlan(), loadPositions(), loadAenderungshistorie()]).finally(() => setLoading(false));
  }, [id, loadPlan, loadPositions, loadAenderungshistorie]);

  useEffect(() => {
    const ids = [...new Set(positions.map((p) => p.produkt_id).filter(Boolean) as string[])];
    if (ids.length === 0) {
      setCatalogProductMap({});
      return;
    }
    const supabase = createClient();
    supabase
      .from("produkte")
      .select("id, category, kategorie, name, produktvariante_titel, verlag, kanal, produktgruppe, platzierung, position, zusatzinformationen, ziel_eignung, creative_farbe, creative_dateityp, creative_groesse, creative_typ, creative_deadline_tage, creative_deadline_date, size, laufzeit_pro_einheit, preis_brutto_chf, preis_netto_chf, preis_agenturservice, empfohlenes_medienbudget, buchungsvoraussetzung, beispiel_bild, creative_groesse_einheit, waehrung")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, CatalogProduct> = {};
        for (const row of data ?? []) {
          map[row.id as string] = row as unknown as CatalogProduct;
        }
        setCatalogProductMap(map);
      });
  }, [positions]);

  const totalKundenpreis = useMemo(
    () => positions.reduce((s, p) => s + (p.kundenpreis ?? 0), 0),
    [positions]
  );

  const { bestaetigtSumme, ausstehendSumme, totalRabatt } = useMemo(() => {
    let bestaetigt = 0;
    let ausstehend = 0;
    let rabatt = 0;
    for (const p of positions) {
      const status1 = (p.prozess_status && typeof p.prozess_status === "object" && p.prozess_status["1"]) || "Offen";
      const isBestaetigt = status1 === "Freigegeben" || status1 === "Erledigt";
      const k = p.kundenpreis ?? 0;
      if (isBestaetigt) bestaetigt += k;
      else ausstehend += k;
      const b = p.brutto ?? 0;
      if (b > k) rabatt += b - k;
    }
    return { bestaetigtSumme: bestaetigt, ausstehendSumme: ausstehend, totalRabatt: rabatt };
  }, [positions]);

  const gesamtEinmalig = bestaetigtSumme;

  return {
    plan,
    positions,
    catalogProductMap,
    aenderungshistorie,
    loading,
    error,
    setError,
    loadPlan,
    loadPositions,
    loadAenderungshistorie,
    totalKundenpreis,
    bestaetigtSumme,
    ausstehendSumme,
    totalRabatt,
    gesamtEinmalig,
    freigabeStatus,
  };
}
