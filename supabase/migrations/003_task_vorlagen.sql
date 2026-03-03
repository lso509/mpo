-- Task-Vorlagen (für automatische Tasks pro Produkt) und Verknüpfung zu Produkten
-- Im Supabase Dashboard: SQL Editor → ausführen

-- Tabelle: Task-Vorlagen
create table if not exists public.task_vorlagen (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  unique (category, title)
);

alter table public.task_vorlagen enable row level security;
create policy "Task-Vorlagen lesbar für alle" on public.task_vorlagen for select using (true);

-- Verknüpfung: welches Produkt hat welche Task-Vorlagen
create table if not exists public.produkt_task_vorlagen (
  produkt_id uuid not null references public.produkte(id) on delete cascade,
  task_vorlage_id uuid not null references public.task_vorlagen(id) on delete cascade,
  primary key (produkt_id, task_vorlage_id)
);

alter table public.produkt_task_vorlagen enable row level security;
create policy "Produkt-Task-Vorlagen lesbar" on public.produkt_task_vorlagen for select using (true);
create policy "Produkt-Task-Vorlagen einfügen" on public.produkt_task_vorlagen for insert with check (true);
create policy "Produkt-Task-Vorlagen löschen" on public.produkt_task_vorlagen for delete using (true);

-- Seed: Task-Vorlagen aus "Automatische Tasks für dieses Produkt"
insert into public.task_vorlagen (category, title, description) values
  ('KREATIV', 'Creative Briefing erstellen', 'Briefing-Dokument für Kreativabteilung vorbereiten'),
  ('KREATIV', 'Creative Deadline', 'Finale Kreativ-Materialien müssen vorliegen'),
  ('REPORTING', 'Zwischenbericht erstellen', 'Performance-Bericht zur Kampagnen-Mitte'),
  ('REPORTING', 'Final Report erstellen', 'Abschlussbericht mit allen KPIs'),
  ('KUNDE', 'Kundenfreigabe einholen', 'Finale Freigabe durch Kunden'),
  ('MEDIA', 'Media-Buchung vornehmen', 'Werbeplatz beim Publisher buchen'),
  ('MEDIA', 'Materialien an Publisher senden', 'Kreativ-Assets an Publisher übermitteln'),
  ('MEDIA', 'Kampagnen-Start prüfen', 'Live-Check ob Kampagne korrekt geschaltet wurde'),
  ('MEDIA', 'Kampagnen-Ende prüfen', 'Kontrolle ob Kampagne korrekt beendet wurde'),
  ('FINANZEN', 'Rechnung erstellen', 'Ausgangsrechnung für Kunde vorbereiten')
on conflict (category, title) do nothing;
