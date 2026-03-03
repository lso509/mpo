-- Schalter "Automatisierungen aktiv" pro Produkt
-- Im Supabase Dashboard: SQL Editor → ausführen

alter table public.produkte
  add column if not exists automatisierung_aktiv boolean not null default true;

comment on column public.produkte.automatisierung_aktiv is 'Wenn true, werden die verknüpften Task-Vorlagen (produkt_task_vorlagen) beim Mediaplan verwendet.';
