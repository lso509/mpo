-- Repair: fehlende Spalten nach teilweise fehlgeschlagener Migration 032
-- Idempotent – sicher mehrfach ausführbar.

alter table public.feedback_eintraege
  add column if not exists prioritaet text not null default 'Low',
  add column if not exists deadline date,
  add column if not exists updated_at timestamptz not null default now();

-- Prioritäts-Constraint nur setzen, wenn noch nicht vorhanden
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_eintraege_prioritaet_check'
      and conrelid = 'public.feedback_eintraege'::regclass
  ) then
    alter table public.feedback_eintraege
      add constraint feedback_eintraege_prioritaet_check
      check (prioritaet in ('Low', 'High', 'Critical'));
  end if;
end $$;

create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_set_updated_at on public.feedback_eintraege;
create trigger trg_feedback_set_updated_at
before update on public.feedback_eintraege
for each row
execute function public.set_feedback_updated_at();
