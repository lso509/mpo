-- =============================================================================
-- Kundenspezifische Produkt-Details pro Mediaplan-Position
-- (Kampagne, Laufzeit-Details, Budget-Details)
-- =============================================================================

alter table public.mediaplan_positionen
  add column if not exists kampagnenname text,
  add column if not exists ziel text,
  add column if not exists creative_verantwortung text,
  add column if not exists agentur text,
  add column if not exists menge_volumen text,
  add column if not exists anzahl_einheiten numeric,
  add column if not exists werberadius text,
  add column if not exists zielgruppeninformationen text,
  add column if not exists zusatzinformationen_kunde text,
  add column if not exists rabatt_prozent numeric,
  add column if not exists rabatt_agentur_prozent numeric,
  add column if not exists agenturgebuehr numeric;

comment on column public.mediaplan_positionen.kampagnenname is 'Kampagnenname (kundenspezifisch, optional Override zum Mediaplan)';
comment on column public.mediaplan_positionen.ziel is 'Ziel (z.B. Sichtbarkeit, Reichweite)';
comment on column public.mediaplan_positionen.creative_verantwortung is 'Creative-Verantwortung';
comment on column public.mediaplan_positionen.agentur is 'Agentur';
comment on column public.mediaplan_positionen.menge_volumen is 'Menge/Volumen (z.B. 2.500 CPM)';
comment on column public.mediaplan_positionen.anzahl_einheiten is 'Anzahl Einheiten';
comment on column public.mediaplan_positionen.werberadius is 'Werberadius (z.B. FL)';
comment on column public.mediaplan_positionen.zielgruppeninformationen is 'Zielgruppeninformationen';
comment on column public.mediaplan_positionen.zusatzinformationen_kunde is 'Zusatzinformationen (kundenspezifisch)';
comment on column public.mediaplan_positionen.rabatt_prozent is 'Rabatt auf Verlagspreis in Prozent';
comment on column public.mediaplan_positionen.rabatt_agentur_prozent is 'Rabatt auf Agenturgebühr in Prozent';
comment on column public.mediaplan_positionen.agenturgebuehr is 'Agenturgebühr (berechnet/vereinbart)';
