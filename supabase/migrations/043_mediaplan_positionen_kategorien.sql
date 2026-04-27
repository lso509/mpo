alter table public.mediaplan_positionen
add column if not exists position_kategorie text;

comment on column public.mediaplan_positionen.position_kategorie is
  'Freie Kategorie innerhalb eines Mediaplans zur Gruppierung von Positionen.';
