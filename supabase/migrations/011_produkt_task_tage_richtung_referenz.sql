-- Zusatzoptionen pro ausgewähltem Task: Tage, Richtung, Referenz
-- Im Supabase Dashboard: SQL Editor → ausführen

alter table public.produkt_task_vorlagen
  add column if not exists tage integer not null default 0,
  add column if not exists richtung text not null default 'vor',
  add column if not exists referenz text not null default 'Enddatum';

alter table public.produkt_task_vorlagen
  add constraint produkt_task_richtung_check
  check (richtung in ('vor', 'nach', 'am gleichen Tag'));

alter table public.produkt_task_vorlagen
  add constraint produkt_task_referenz_check
  check (referenz in ('Startdatum', 'Enddatum', 'Creative Deadline'));

comment on column public.produkt_task_vorlagen.tage is 'Anzahl Tage (z.B. 33 für "33 Tage vor/nach")';
comment on column public.produkt_task_vorlagen.richtung is 'vor | nach | am gleichen Tag';
comment on column public.produkt_task_vorlagen.referenz is 'Startdatum | Enddatum | Creative Deadline';
