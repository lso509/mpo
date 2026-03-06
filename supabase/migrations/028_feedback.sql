-- Internes Feedback-Tool: Einträge von Nutzern, Verwaltung durch Agentur

create table if not exists public.feedback_eintraege (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  kategorie text not null check (kategorie in ('Bug', 'Idee', 'Verbesserung')),
  beschreibung text not null,
  seite text,
  status text not null default 'Offen' check (status in ('Offen', 'In Bearbeitung', 'Erledigt'))
);

create index if not exists feedback_eintraege_created_at_idx on public.feedback_eintraege(created_at desc);
create index if not exists feedback_eintraege_kategorie_idx on public.feedback_eintraege(kategorie);
create index if not exists feedback_eintraege_status_idx on public.feedback_eintraege(status);

alter table public.feedback_eintraege enable row level security;

-- Jeder eingeloggte User darf eigene Einträge einfügen
create policy "Feedback einfügen (eingeloggt)"
  on public.feedback_eintraege for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

-- Nur Agentur-Rolle darf alle Einträge lesen
create policy "Agentur liest alle Feedback-Einträge"
  on public.feedback_eintraege for select
  using (public.is_agency_user());

-- Nur Agentur darf Status aktualisieren
create policy "Agentur aktualisiert Feedback"
  on public.feedback_eintraege for update
  using (public.is_agency_user())
  with check (public.is_agency_user());

comment on table public.feedback_eintraege is 'Internes Feedback (Bug, Idee, Verbesserung); nur Agency sieht alle Einträge.';
