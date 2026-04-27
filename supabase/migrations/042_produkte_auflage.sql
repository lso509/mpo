alter table public.produkte
add column if not exists auflage integer;

comment on column public.produkte.auflage is
  'Auflage fuer Individualformat-Produkte.';
