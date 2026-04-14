-- Feedback-Workflow erweitern: Priorität, Deadline, Kommentare, Editierbarkeit für alle eingeloggten Nutzer

alter table public.feedback_eintraege
  add column if not exists prioritaet text not null default 'Low',
  add column if not exists deadline date,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'feedback_eintraege_kategorie_check'
      and conrelid = 'public.feedback_eintraege'::regclass
  ) then
    alter table public.feedback_eintraege drop constraint feedback_eintraege_kategorie_check;
  end if;
end $$;

-- Bestehende Kategoriewerte vereinheitlichen (nach Entfernen der alten Constraint)
update public.feedback_eintraege
set kategorie = 'Optimierung'
where kategorie = 'Verbesserung';

alter table public.feedback_eintraege
  add constraint feedback_eintraege_kategorie_check
  check (kategorie in ('Bug', 'Idee', 'Optimierung'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'feedback_eintraege_status_check'
      and conrelid = 'public.feedback_eintraege'::regclass
  ) then
    alter table public.feedback_eintraege drop constraint feedback_eintraege_status_check;
  end if;
end $$;

alter table public.feedback_eintraege
  add constraint feedback_eintraege_status_check
  check (status in ('Offen', 'In Bearbeitung', 'Zur Prüfung für nächsten Sprint', 'Erledigt'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'feedback_eintraege_prioritaet_check'
      and conrelid = 'public.feedback_eintraege'::regclass
  ) then
    alter table public.feedback_eintraege drop constraint feedback_eintraege_prioritaet_check;
  end if;
end $$;

alter table public.feedback_eintraege
  add constraint feedback_eintraege_prioritaet_check
  check (prioritaet in ('Low', 'High', 'Critical'));

create index if not exists feedback_eintraege_prioritaet_idx on public.feedback_eintraege(prioritaet);
create index if not exists feedback_eintraege_deadline_idx on public.feedback_eintraege(deadline);

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

-- Update-Policy: alle eingeloggten Nutzer dürfen Feedback aktualisieren
drop policy if exists "Agentur aktualisiert Feedback" on public.feedback_eintraege;
drop policy if exists "Eingeloggt aktualisiert Feedback" on public.feedback_eintraege;
create policy "Eingeloggt aktualisiert Feedback"
  on public.feedback_eintraege for update
  to authenticated
  using (true)
  with check (true);

create table if not exists public.feedback_kommentare (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback_eintraege(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  kommentar text not null
);

create index if not exists feedback_kommentare_feedback_id_idx
  on public.feedback_kommentare(feedback_id, created_at desc);

alter table public.feedback_kommentare enable row level security;

drop policy if exists "Eingeloggt liest Feedback-Kommentare" on public.feedback_kommentare;
create policy "Eingeloggt liest Feedback-Kommentare"
  on public.feedback_kommentare for select
  to authenticated
  using (true);

drop policy if exists "Eingeloggt fügt Feedback-Kommentare ein" on public.feedback_kommentare;
create policy "Eingeloggt fügt Feedback-Kommentare ein"
  on public.feedback_kommentare for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Autor oder Agentur aktualisiert Feedback-Kommentare" on public.feedback_kommentare;
create policy "Autor oder Agentur aktualisiert Feedback-Kommentare"
  on public.feedback_kommentare for update
  to authenticated
  using (auth.uid() = user_id or public.is_agency_user())
  with check (auth.uid() = user_id or public.is_agency_user());

drop policy if exists "Autor oder Agentur löscht Feedback-Kommentare" on public.feedback_kommentare;
create policy "Autor oder Agentur löscht Feedback-Kommentare"
  on public.feedback_kommentare for delete
  to authenticated
  using (auth.uid() = user_id or public.is_agency_user());

create or replace function public.set_feedback_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_comment_set_updated_at on public.feedback_kommentare;
create trigger trg_feedback_comment_set_updated_at
before update on public.feedback_kommentare
for each row
execute function public.set_feedback_comment_updated_at();

comment on column public.feedback_eintraege.prioritaet is 'Priorität des Feedbacks: Low, High oder Critical.';
comment on column public.feedback_eintraege.deadline is 'Frist zur Bearbeitung oder Prüfung des Feedbacks.';
comment on column public.feedback_eintraege.updated_at is 'Zeitpunkt der letzten Änderung am Feedback-Eintrag.';
comment on column public.feedback_eintraege.position_x is 'Horizontale Position in % relativ zum Scroll-Content (für target=overlay).';
comment on column public.feedback_eintraege.position_y is 'Vertikale Position in % relativ zum Scroll-Content (für target=overlay).';
comment on table public.feedback_kommentare is 'Kommentare zu Feedback-Einträgen, sichtbar für eingeloggte Nutzer.';
