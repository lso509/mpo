alter table public.produkte
add column if not exists agentur_marge_prozent numeric;

comment on column public.produkte.agentur_marge_prozent is
  'Agenturmarge in Prozent als Produkt-Standardwert (z. B. fuer rabatt_agentur_prozent im Mediaplan).';
