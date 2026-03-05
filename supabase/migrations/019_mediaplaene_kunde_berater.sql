-- =============================================================================
-- Kundeninformationen und Kundenberater pro Mediaplan
-- =============================================================================

alter table public.mediaplaene
  add column if not exists kunde_adresse text,
  add column if not exists kunde_email text,
  add column if not exists kunde_telefon text,
  add column if not exists berater_name text,
  add column if not exists berater_position text,
  add column if not exists berater_email text,
  add column if not exists berater_telefon text,
  add column if not exists berater_mobil text;

comment on column public.mediaplaene.kunde_adresse is 'Kundenadresse (mehrzeilig: Strasse, PLZ Ort, Land)';
comment on column public.mediaplaene.kunde_email is 'Kunden E-Mail';
comment on column public.mediaplaene.kunde_telefon is 'Kunden Telefon';
comment on column public.mediaplaene.berater_name is 'Name des Kundenberaters';
comment on column public.mediaplaene.berater_position is 'Position des Kundenberaters';
comment on column public.mediaplaene.berater_email is 'E-Mail des Kundenberaters';
comment on column public.mediaplaene.berater_telefon is 'Telefon des Kundenberaters';
comment on column public.mediaplaene.berater_mobil is 'Mobilnummer des Kundenberaters';
