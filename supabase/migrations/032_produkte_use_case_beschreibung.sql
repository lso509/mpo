-- Use Case (Mehrfachauswahl) und Produktbeschreibung in Basis-Infos

alter table public.produkte
  add column if not exists use_case jsonb default '[]'::jsonb,
  add column if not exists produktbeschreibung text;

comment on column public.produkte.use_case is 'Use Cases: Array z.B. ["Event", "Employer Branding", "Recruiting"]';
comment on column public.produkte.produktbeschreibung is 'Freitext Produktbeschreibung';
