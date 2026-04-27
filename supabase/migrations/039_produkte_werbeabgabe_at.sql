alter table public.produkte
add column if not exists werbeabgabe_at boolean not null default false;

comment on column public.produkte.werbeabgabe_at is
  'Wenn TRUE, wird bei Übernahme in Mediaplan +5% österreichische Werbeabgabe auf brutto/netto gerechnet.';
