-- =============================================================================
-- E-Mail Vorlagen table and optional link from task_vorlagen (for "propose template")
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelle: email_vorlagen
-- -----------------------------------------------------------------------------
create table if not exists public.email_vorlagen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  subject text,
  body text,
  category text,
  tags text[] default '{}'
);

alter table public.email_vorlagen enable row level security;

create policy "Email-Vorlagen lesbar" on public.email_vorlagen for select using (true);
create policy "Email-Vorlagen einfügen" on public.email_vorlagen for insert with check (true);
create policy "Email-Vorlagen aktualisieren" on public.email_vorlagen for update using (true);
create policy "Email-Vorlagen löschen" on public.email_vorlagen for delete using (true);

-- -----------------------------------------------------------------------------
-- task_vorlagen: optional link to suggested email template
-- -----------------------------------------------------------------------------
alter table public.task_vorlagen
  add column if not exists email_vorlage_id uuid references public.email_vorlagen(id) on delete set null;

create index if not exists idx_task_vorlagen_email_vorlage_id on public.task_vorlagen(email_vorlage_id);

comment on column public.task_vorlagen.email_vorlage_id is 'Empfohlene E-Mail-Vorlage für diese Task-Art (z. B. im Dashboard "E-Mail Vorlage öffnen").';

-- -----------------------------------------------------------------------------
-- Seed: E-Mail-Vorlagen (aus bisher hardcodierten TEMPLATES)
-- -----------------------------------------------------------------------------
insert into public.email_vorlagen (title, subject, body, category, tags) values
  ('Creatives beim Kunden anfordern', 'Creative-Material für {{campaign_name}} benötigt', '', 'Kunde', array['Kunde', 'Creatives vorhanden']),
  ('Einbuchungsbestätigung an Verlag', 'Buchung für {{client_name}} - {{campaign_name}}', '', 'Verlag', array['Verlag', 'Einbuchung Verlag']),
  ('Neue Position zur Freigabe an Kunde', 'Neue Position zur Freigabe: {{position_name}}', '', 'Kunde', array['Kunde', 'Freigabestatus']),
  ('Creative-Übersicht: Alle Positionen gesammelt', 'Creative-Übersicht: {{campaign_name}} - Alle Positionen', '', 'Kunde', array['Kunde', 'Creatives vorhanden']);

-- Link task_vorlagen to email_vorlagen (Creative Deadline -> Creatives beim Kunden anfordern; Kundenfreigabe -> Neue Position zur Freigabe)
update public.task_vorlagen t
set email_vorlage_id = (select id from public.email_vorlagen where title = 'Creatives beim Kunden anfordern' limit 1)
where t.category = 'KREATIV' and t.title = 'Creative Deadline';

update public.task_vorlagen t
set email_vorlage_id = (select id from public.email_vorlagen where title = 'Neue Position zur Freigabe an Kunde' limit 1)
where t.category = 'KUNDE' and t.title = 'Kundenfreigabe einholen';
