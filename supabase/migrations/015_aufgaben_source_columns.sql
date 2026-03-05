-- =============================================================================
-- Aufgaben: source columns for automation-generated tasks (Option A)
-- =============================================================================

alter table public.aufgaben
  add column if not exists mediaplan_id uuid references public.mediaplaene(id) on delete set null,
  add column if not exists mediaplan_position_id uuid references public.mediaplan_positionen(id) on delete set null,
  add column if not exists task_vorlage_id uuid references public.task_vorlagen(id) on delete set null;

create index if not exists idx_aufgaben_mediaplan_id on public.aufgaben(mediaplan_id);
create index if not exists idx_aufgaben_mediaplan_position_id on public.aufgaben(mediaplan_position_id);

comment on column public.aufgaben.mediaplan_id is 'Wenn gesetzt: Aufgabe wurde aus Mediaplan-Automatisierung erzeugt.';
comment on column public.aufgaben.mediaplan_position_id is 'Position im Mediaplan, aus der diese Aufgabe abgeleitet wurde.';
comment on column public.aufgaben.task_vorlage_id is 'Task-Vorlage, aus der diese Aufgabe abgeleitet wurde (für E-Mail-Vorlagen-Vorschlag).';
