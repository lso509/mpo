-- =============================================================================
-- Sinnvolle Füll-Daten für bestehende Mediapläne (Kundeninfos, Berater, Positionen)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Frühjahrs-Kampagne 2026 (FL1 / Energie)
-- -----------------------------------------------------------------------------
update public.mediaplaene
set
  client = 'FL1 Energie AG',
  kunde_adresse = 'Industriestrasse 12
8000 Zürich
Schweiz',
  kunde_email = 'marketing@fl1.ch',
  kunde_telefon = '+41 44 123 45 00',
  kunde_ap_name = 'Markus Schneider',
  kunde_ap_position = 'Head of Marketing',
  kunde_ap_email = 'markus.schneider@fl1.ch',
  kunde_ap_telefon = '+41 44 123 45 01',
  kunde_ap_mobil = '+41 79 234 56 01',
  berater_name = 'Sarah Müller',
  berater_position = 'Senior Account Manager',
  berater_email = 'sarah.mueller@coagency.ch',
  berater_telefon = '+41 44 123 45 67',
  berater_mobil = '+41 79 123 45 67'
where campaign = 'Frühjahrs-Kampagne 2026';

-- Positionen der Frühjahrs-Kampagne: Prozessstatus (6/10 erledigt) + Kundendetails
update public.mediaplan_positionen mp
set
  prozess_status = '{"1":"Freigegeben","2":"Erledigt","3":"Erledigt","4":"Erledigt","5":"Erledigt","6":"Erledigt","7":"Offen","8":"Offen","9":"Offen","10":"Offen"}'::jsonb,
  kampagnenname = 'Frühjahrs-Kampagne 2026',
  ziel = 'Sichtbarkeit',
  menge_volumen = '2.500 CPM',
  anzahl_einheiten = 2500,
  werberadius = 'CH',
  zielgruppeninformationen = '25-54 Jahre, energiebewusst',
  rabatt_prozent = 10,
  rabatt_agentur_prozent = 0,
  agenturgebuehr = 5625.00
from public.mediaplaene m
where mp.mediaplan_id = m.id and m.campaign = 'Frühjahrs-Kampagne 2026' and mp.sort_order = 1;

update public.mediaplan_positionen mp
set
  prozess_status = '{"1":"Freigegeben","2":"Erledigt","3":"Erledigt","4":"Offen","5":"Offen","6":"Offen","7":"Offen","8":"Offen","9":"Offen","10":"Offen"}'::jsonb,
  kampagnenname = 'Frühjahrs-Kampagne 2026',
  ziel = 'Reichweite',
  menge_volumen = '3 Schaltungen',
  anzahl_einheiten = 3,
  werberadius = 'FL',
  zielgruppeninformationen = 'Abonnenten Tageszeitungen',
  rabatt_prozent = 5,
  rabatt_agentur_prozent = 0,
  agenturgebuehr = 957.60
from public.mediaplaene m
where mp.mediaplan_id = m.id and m.campaign = 'Frühjahrs-Kampagne 2026' and mp.sort_order = 2;

update public.mediaplan_positionen mp
set
  prozess_status = '{"1":"Offen","2":"Offen","3":"Offen","4":"Offen","5":"Offen","6":"Offen","7":"Offen","8":"Offen","9":"Offen","10":"Offen"}'::jsonb,
  kampagnenname = 'Frühjahrs-Kampagne 2026',
  ziel = 'Sichtbarkeit',
  menge_volumen = '12 Spots',
  anzahl_einheiten = 12,
  werberadius = 'CH',
  zielgruppeninformationen = 'Prime Time Zuschauer',
  rabatt_prozent = 8,
  rabatt_agentur_prozent = 0,
  agenturgebuehr = 8250.56
from public.mediaplaene m
where mp.mediaplan_id = m.id and m.campaign = 'Frühjahrs-Kampagne 2026' and mp.sort_order = 3;

-- -----------------------------------------------------------------------------
-- 2. Q1 2026 - Digitale Transformation (Salt)
-- -----------------------------------------------------------------------------
update public.mediaplaene
set
  client = 'Salt Mobile AG',
  kunde_adresse = 'Richtiring 7
8304 Wallisellen
Schweiz',
  kunde_email = 'marketing@salt.ch',
  kunde_telefon = '+41 800 700 700',
  kunde_ap_name = 'Laura Brunner',
  kunde_ap_position = 'Marketing Manager Digital',
  kunde_ap_email = 'laura.brunner@salt.ch',
  kunde_ap_telefon = '+41 58 123 45 78',
  kunde_ap_mobil = '+41 79 345 67 89',
  berater_name = 'Thomas Weber',
  berater_position = 'Account Director',
  berater_email = 'thomas.weber@coagency.ch',
  berater_telefon = '+41 44 123 45 68',
  berater_mobil = '+41 79 123 45 68'
where campaign = 'Q1 2026 - Digitale Transformation';

-- -----------------------------------------------------------------------------
-- 3. Brand Awareness Initiative (VP Bank)
-- -----------------------------------------------------------------------------
update public.mediaplaene
set
  client = 'VP Bank AG',
  kunde_adresse = 'Aeulestrasse 6
9490 Vaduz
Liechtenstein',
  kunde_email = 'kommunikation@vpbank.com',
  kunde_telefon = '+423 235 66 66',
  kunde_ap_name = 'Claudia Amann',
  kunde_ap_position = 'Leiterin Kommunikation',
  kunde_ap_email = 'claudia.amann@vpbank.com',
  kunde_ap_telefon = '+423 235 66 67',
  kunde_ap_mobil = '+423 79 123 45 67',
  berater_name = 'Sarah Müller',
  berater_position = 'Senior Account Manager',
  berater_email = 'sarah.mueller@coagency.ch',
  berater_telefon = '+41 44 123 45 67',
  berater_mobil = '+41 79 123 45 67'
where campaign = 'Brand Awareness Initiative';

-- -----------------------------------------------------------------------------
-- 4. Q4 2025 - Jahresendkampagne (Salt, abgeschlossen)
-- -----------------------------------------------------------------------------
update public.mediaplaene
set
  client = 'Salt Mobile AG',
  kunde_adresse = 'Richtiring 7
8304 Wallisellen
Schweiz',
  kunde_email = 'marketing@salt.ch',
  kunde_telefon = '+41 800 700 700',
  kunde_ap_name = 'Laura Brunner',
  kunde_ap_position = 'Marketing Manager Digital',
  kunde_ap_email = 'laura.brunner@salt.ch',
  kunde_ap_telefon = null,
  kunde_ap_mobil = null,
  berater_name = 'Thomas Weber',
  berater_position = 'Account Director',
  berater_email = 'thomas.weber@coagency.ch',
  berater_telefon = '+41 44 123 45 68',
  berater_mobil = '+41 79 123 45 68'
where campaign = 'Q4 2025 - Jahresendkampagne';

-- -----------------------------------------------------------------------------
-- 5. Sommer Special 2026 (FL1, Entwurf)
-- -----------------------------------------------------------------------------
update public.mediaplaene
set
  client = 'FL1 Energie AG',
  kunde_adresse = 'Industriestrasse 12
8000 Zürich
Schweiz',
  kunde_email = 'marketing@fl1.ch',
  kunde_telefon = '+41 44 123 45 00',
  kunde_ap_name = 'Markus Schneider',
  kunde_ap_position = 'Head of Marketing',
  kunde_ap_email = 'markus.schneider@fl1.ch',
  kunde_ap_telefon = '+41 44 123 45 01',
  kunde_ap_mobil = '+41 79 234 56 01',
  berater_name = 'Sarah Müller',
  berater_position = 'Senior Account Manager',
  berater_email = 'sarah.mueller@coagency.ch',
  berater_telefon = '+41 44 123 45 67',
  berater_mobil = '+41 79 123 45 67'
where campaign = 'Sommer Special 2026';
