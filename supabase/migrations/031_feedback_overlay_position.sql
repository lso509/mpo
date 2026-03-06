-- Overlay-Feedback: Position auf der Seite (Viewport-Prozent 0–100)
alter table public.feedback_eintraege
  add column if not exists position_x numeric(5,2),
  add column if not exists position_y numeric(5,2);

comment on column public.feedback_eintraege.position_x is 'Horizontale Position in % der Viewport-Breite (für target=overlay).';
comment on column public.feedback_eintraege.position_y is 'Vertikale Position in % der Viewport-Höhe (für target=overlay).';
