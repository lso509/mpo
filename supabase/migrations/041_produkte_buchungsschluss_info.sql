alter table public.produkte
add column if not exists buchungsschluss_info text;

comment on column public.produkte.buchungsschluss_info is
  'Freitext-Info zum Buchungsschluss eines Produkts.';
