-- Feedback an bestimmten Stellen platzierbar (z. B. bei einem Button), für alle eingeloggten User sichtbar

alter table public.feedback_eintraege
  add column if not exists target text;

comment on column public.feedback_eintraege.target is 'Optionaler Ort/Bezeichner (z.B. produkte.save-button), an dem das Feedback in der UI angezeigt wird.';

create index if not exists feedback_eintraege_target_idx on public.feedback_eintraege(target) where target is not null;

-- Alle eingeloggten User dürfen Feedback lesen (damit platzierte Hinweise an allen Stellen sichtbar sind)
create policy "Eingeloggt liest Feedback"
  on public.feedback_eintraege for select
  to authenticated
  using (true);
