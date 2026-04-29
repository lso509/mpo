-- Standard-Zeitpunkt und Aktiv-Status pro Task-Vorlage

alter table public.task_vorlagen
  add column if not exists standard_tage integer not null default 0,
  add column if not exists standard_richtung text not null default 'vor',
  add column if not exists standard_referenz text not null default 'Enddatum',
  add column if not exists is_active boolean not null default true;

alter table public.task_vorlagen
  drop constraint if exists task_vorlagen_standard_richtung_check;

alter table public.task_vorlagen
  add constraint task_vorlagen_standard_richtung_check
  check (standard_richtung in ('vor', 'nach', 'am gleichen Tag'));

alter table public.task_vorlagen
  drop constraint if exists task_vorlagen_standard_referenz_check;

alter table public.task_vorlagen
  add constraint task_vorlagen_standard_referenz_check
  check (standard_referenz in ('Startdatum', 'Enddatum', 'Creative Deadline'));

comment on column public.task_vorlagen.standard_tage is 'Standardwert für Tage bei Auswahl in Produkten.';
comment on column public.task_vorlagen.standard_richtung is 'vor | nach | am gleichen Tag';
comment on column public.task_vorlagen.standard_referenz is 'Startdatum | Enddatum | Creative Deadline';
comment on column public.task_vorlagen.is_active is 'Wenn false, ist die Vorlage im Produktformular nicht auswählbar.';

-- Bestehende Seed-Vorlagen auf aktuelle Defaults setzen
update public.task_vorlagen
set standard_tage = 1, standard_richtung = 'nach', standard_referenz = 'Enddatum'
where title = 'Rechnung erstellen';

update public.task_vorlagen
set standard_tage = 14, standard_richtung = 'vor', standard_referenz = 'Startdatum'
where title = 'Creative Briefing erstellen';

update public.task_vorlagen
set standard_tage = 10, standard_richtung = 'vor', standard_referenz = 'Startdatum'
where title = 'Plakatdruck in Auftrag geben';

update public.task_vorlagen
set standard_tage = 0, standard_richtung = 'am gleichen Tag', standard_referenz = 'Creative Deadline'
where title = 'Creative Deadline';

update public.task_vorlagen
set standard_tage = 5, standard_richtung = 'vor', standard_referenz = 'Startdatum'
where title = 'Kundenfreigabe einholen';

update public.task_vorlagen
set standard_tage = 0, standard_richtung = 'am gleichen Tag', standard_referenz = 'Enddatum'
where title = 'Kampagnen-Ende prüfen';

update public.task_vorlagen
set standard_tage = 0, standard_richtung = 'am gleichen Tag', standard_referenz = 'Startdatum'
where title = 'Kampagnen-Start prüfen';

update public.task_vorlagen
set standard_tage = 7, standard_richtung = 'vor', standard_referenz = 'Startdatum'
where title = 'Materialien an Publisher senden';

update public.task_vorlagen
set standard_tage = 30, standard_richtung = 'vor', standard_referenz = 'Startdatum'
where title = 'Media-Buchung vornehmen';

update public.task_vorlagen
set standard_tage = 1, standard_richtung = 'nach', standard_referenz = 'Enddatum'
where title = 'Final Report erstellen';

update public.task_vorlagen
set standard_tage = 21, standard_richtung = 'vor', standard_referenz = 'Enddatum'
where title = 'Zwischenbericht erstellen';
