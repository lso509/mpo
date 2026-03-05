-- =============================================================================
-- Prozessstatus pro Mediaplan-Position (10 Schritte: Offen / Erledigt / N/A)
-- =============================================================================

alter table public.mediaplan_positionen
  add column if not exists prozess_status jsonb default '{}';

comment on column public.mediaplan_positionen.prozess_status is 'Prozessschritte 1-10: Keys "1".."10", Werte "Offen" | "Erledigt" | "Freigegeben" (nur Schritt 1) | "N/A"';
