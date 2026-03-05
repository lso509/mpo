-- =============================================================================
-- Ansprechpartner auf Kundenseite pro Mediaplan
-- =============================================================================

alter table public.mediaplaene
  add column if not exists kunde_ap_name text,
  add column if not exists kunde_ap_position text,
  add column if not exists kunde_ap_email text,
  add column if not exists kunde_ap_telefon text,
  add column if not exists kunde_ap_mobil text;

comment on column public.mediaplaene.kunde_ap_name is 'Ansprechpartner Kundenseite: Name';
comment on column public.mediaplaene.kunde_ap_position is 'Ansprechpartner Kundenseite: Position';
comment on column public.mediaplaene.kunde_ap_email is 'Ansprechpartner Kundenseite: E-Mail';
comment on column public.mediaplaene.kunde_ap_telefon is 'Ansprechpartner Kundenseite: Telefon';
comment on column public.mediaplaene.kunde_ap_mobil is 'Ansprechpartner Kundenseite: Mobil';
