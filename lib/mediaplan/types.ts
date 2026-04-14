export type AenderungshistorieEntry = {
  id: string;
  created_at: string;
  changed_by: string | null;
  change_description: string;
};

export type MediaplanRow = {
  id: string;
  client: string | null;
  kunde_id: string | null;
  kunde_name: string | null;
  status: string | null;
  campaign: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  kunde_adresse: string | null;
  kunde_email: string | null;
  kunde_telefon: string | null;
  berater_name: string | null;
  berater_position: string | null;
  berater_email: string | null;
  berater_telefon: string | null;
  berater_mobil: string | null;
  kunde_ap_name: string | null;
  kunde_ap_position: string | null;
  kunde_ap_email: string | null;
  kunde_ap_telefon: string | null;
  kunde_ap_mobil: string | null;
  /** Optionales Maximalbudget (CHF), z. B. bei Neuanlage */
  max_budget_chf?: number | null;
};

/** Formular-State Mediaplan bearbeiten (max. Budget als Freitext) */
export type MediaplanDetailFormState = Omit<Partial<MediaplanRow>, "max_budget_chf"> & {
  max_budget_chf?: string;
};

export type PositionRow = {
  id: string;
  mediaplan_id: string;
  produkt_id: string | null;
  title: string;
  description: string | null;
  tag: string | null;
  brutto: number | null;
  discount_text: string | null;
  kundenpreis: number | null;
  status_tags: string[] | null;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  creative_deadline: string | null;
  kampagnenname?: string | null;
  ziel?: string | null;
  creative_verantwortung?: string | null;
  agentur?: string | null;
  menge_volumen?: string | null;
  anzahl_einheiten?: number | null;
  werberadius?: string | null;
  zielgruppeninformationen?: string | null;
  zusatzinformationen_kunde?: string | null;
  rabatt_prozent?: number | null;
  rabatt_agentur_prozent?: number | null;
  agenturgebuehr?: number | null;
  prozess_status?: Record<string, string> | null;
};

/** Produkt aus Katalog (Produktbibliothek) für Anzeige "Produktinformationen aus Katalog" */
export type CatalogProduct = {
  id: string;
  category: string | null;
  kategorie: string | null;
  name: string | null;
  produktvariante_titel: string | null;
  verlag: string | null;
  kanal: string | null;
  produktgruppe: string | null;
  platzierung: string | null;
  position: string | null;
  zusatzinformationen: string | null;
  ziel_eignung: string | null;
  creative_farbe: string | null;
  creative_dateityp: string | null;
  creative_groesse: string | null;
  creative_typ: string | null;
  creative_deadline_tage: number | null;
  creative_deadline_date: string | null;
  size: string | null;
  laufzeit_pro_einheit: string | null;
  preis_brutto_chf: number | null;
  preis_netto_chf: number | null;
  preis_agenturservice: number | null;
  empfohlenes_medienbudget: string | null;
  buchungsvoraussetzung: string | null;
  beispiel_bild: string | null;
  creative_groesse_einheit?: string | null;
  waehrung?: string | null;
};
