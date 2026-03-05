-- =============================================================================
-- Per-position dates: start_date, end_date, creative_deadline (mediaplan_positionen)
-- =============================================================================

alter table public.mediaplan_positionen
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists creative_deadline date;

comment on column public.mediaplan_positionen.start_date is 'Startdatum dieser Position (für Automatisierungen: Referenz Startdatum)';
comment on column public.mediaplan_positionen.end_date is 'Enddatum dieser Position (für Automatisierungen: Referenz Enddatum)';
comment on column public.mediaplan_positionen.creative_deadline is 'Deadline für Creatives dieser Position (für Automatisierungen: Referenz Creative Deadline)';
