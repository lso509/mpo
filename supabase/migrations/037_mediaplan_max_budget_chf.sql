-- Optionales Obergrenzen-Budget pro Mediaplan (CHF, Netto-Ansatz wie Positions-Kundenpreise)
alter table public.mediaplaene
  add column if not exists max_budget_chf numeric;

comment on column public.mediaplaene.max_budget_chf is 'Optionales maximales Kampagnenbudget (CHF); Vergleich mit Summe Kundenpreise der Positionen.';
