import type { ReactElement } from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const ACCENT = "#FF6554";
const MWST_SATZ = 8.1; // %

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "column",
    color: "#6b7280",
    fontSize: 8,
  },
  headerLine: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginBottom: 16,
  },
  kundenDaten: {
    flexDirection: "row",
    marginBottom: 14,
  },
  kundenDatenCol: {
    flex: 1,
    gap: 4,
  },
  kundenDatenRow: {
    flexDirection: "row",
    gap: 6,
  },
  kundenDatenLabel: {
    color: "#6b7280",
    minWidth: 90,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 4,
    color: "#111827",
  },
  beraterBox: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 24,
  },
  beraterCol: {
    gap: 2,
  },
  beraterLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  table: {
    width: "100%",
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    flex: 1,
  },
  tableCellFixed: {
    width: 58,
  },
  summenRow: {
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  mwstRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    fontSize: 8,
  },
  gesamtRow: {
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#f3f4f6",
    borderTopWidth: 2,
    borderTopColor: ACCENT,
  },
  zeitplanBox: {
    marginTop: 8,
    marginBottom: 14,
  },
  zeitplanAxisRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 8,
  },
  zeitplanAxisLabel: {
    width: 120,
    fontSize: 7,
    color: "#6b7280",
  },
  zeitplanAxisTrack: {
    flex: 1,
    height: 18,
    position: "relative",
  },
  zeitplanAxisTick: {
    position: "absolute",
    top: 0,
    fontSize: 7,
    color: "#6b7280",
  },
  zeitplanRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  zeitplanLabel: {
    width: 120,
    fontSize: 8,
  },
  zeitplanBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
    flexDirection: "row",
  },
  zeitplanBar: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#6b7280",
  },
});

function formatChf(value: number): string {
  const formatted = Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return value < 0 ? `-CHF ${formatted}` : `CHF ${formatted}`;
}

function parseDate(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function getMonthName(ts: number): string {
  const d = new Date(ts);
  return MONTH_NAMES[d.getMonth()] ?? "";
}

/** ISO-Kalenderwoche (KW) */
function getCalendarWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1).getTime();
  return Math.ceil((d.getTime() - yearStart) / 86400000 / 7);
}

/** Erster Tag der Woche (Montag) für ts */
function getWeekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.getTime();
}

/** Erster Tag des Monats für ts */
function getMonthStart(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type MediaplanPDFKunde = {
  name: string;
  ansprechpartner: string;
  firmaName?: string;
  firmaAdresse?: string;
};

export type MediaplanPDFKampagne = {
  name: string;
  vonDatum: string;
  bisDatum: string;
};

export type MediaplanPDFKundenberater = {
  name: string;
  position?: string;
  email?: string;
  telefon?: string;
};

export type MediaplanPDFPosition = {
  produkt: string;
  verlag: string;
  zeitraum: string;
  laufzeit: string;
  nettoChf: number;
  bruttoChf: number;
  /** Für Zeitplan: Startdatum (YYYY-MM-DD oder parsebar) */
  startDate?: string;
  /** Für Zeitplan: Enddatum */
  endDate?: string;
};

export type MediaplanPDFProps = {
  kunde: MediaplanPDFKunde;
  kampagne: MediaplanPDFKampagne;
  kundenberater?: MediaplanPDFKundenberater;
  positionen: MediaplanPDFPosition[];
  erstelltAm?: string;
  logoPath?: string;
};

export function MediaplanPDF({
  kunde,
  kampagne,
  kundenberater,
  positionen,
  erstelltAm,
  logoPath,
}: MediaplanPDFProps): ReactElement {
  const nettoSumme = positionen.reduce((s, p) => s + p.nettoChf, 0);
  const getRabatt = (p: MediaplanPDFPosition) => (p.bruttoChf != null && p.nettoChf != null && p.bruttoChf > p.nettoChf ? p.bruttoChf - p.nettoChf : 0);
  const mwstBetrag = (nettoSumme * MWST_SATZ) / 100;
  const gesamtMitMwst = nettoSumme + mwstBetrag;

  // Zeitplan: Gesamtzeitraum aus Kampagne oder aus allen Positionen
  const planStart = parseDate(kampagne.vonDatum);
  const planEnd = parseDate(kampagne.bisDatum);
  const positionStarts = positionen.map((p) => (p.startDate ? parseDate(p.startDate) : planStart));
  const positionEnds = positionen.map((p) => (p.endDate ? parseDate(p.endDate) : planEnd));
  const minDate = planStart || Math.min(...positionStarts.filter(Boolean), Infinity) || Date.now();
  const maxDate = planEnd || Math.max(...positionEnds.filter(Boolean), 0) || minDate + 1;
  const rangeMs = Math.max(1, maxDate - minDate);

  return (
    <Document>
      <Page size="A3" orientation="landscape" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {(kunde.firmaName || kunde.firmaAdresse) && (
              <>
                {kunde.firmaName && <Text>{kunde.firmaName}</Text>}
                {kunde.firmaAdresse && <Text>{kunde.firmaAdresse}</Text>}
              </>
            )}
            {!kunde.firmaName && !kunde.firmaAdresse && <Text>Mediaplan</Text>}
          </View>
          {logoPath && (
            <Image src={logoPath} style={{ width: 72, height: 36 }} />
          )}
        </View>
        <View style={styles.headerLine} />

        {/* KUNDENDATEN 2-spaltig */}
        <View style={styles.kundenDaten}>
          <View style={styles.kundenDatenCol}>
            <View style={styles.kundenDatenRow}>
              <Text style={styles.kundenDatenLabel}>Kunde</Text>
              <Text>{kunde.name || "–"}</Text>
            </View>
            <View style={styles.kundenDatenRow}>
              <Text style={styles.kundenDatenLabel}>Ansprechpartner</Text>
              <Text>{kunde.ansprechpartner || "–"}</Text>
            </View>
            <View style={styles.kundenDatenRow}>
              <Text style={styles.kundenDatenLabel}>Kampagnenname</Text>
              <Text>{kampagne.name || "–"}</Text>
            </View>
          </View>
          <View style={styles.kundenDatenCol}>
            <View style={styles.kundenDatenRow}>
              <Text style={styles.kundenDatenLabel}>Zeitraum</Text>
              <Text>
                {kampagne.vonDatum && kampagne.bisDatum
                  ? `${kampagne.vonDatum} – ${kampagne.bisDatum}`
                  : "–"}
              </Text>
            </View>
            <View style={styles.kundenDatenRow}>
              <Text style={styles.kundenDatenLabel}>Erstellungsdatum</Text>
              <Text>{erstelltAm || "–"}</Text>
            </View>
          </View>
        </View>

        {/* KUNDENBERATER */}
        {kundenberater && (kundenberater.name || kundenberater.email) && (
          <>
            <Text style={styles.sectionTitle}>Kundenberater</Text>
            <View style={styles.beraterBox}>
              {kundenberater.name && (
                <View style={styles.beraterCol}>
                  <Text style={styles.beraterLabel}>Name</Text>
                  <Text>{kundenberater.name}</Text>
                </View>
              )}
              {kundenberater.position && (
                <View style={styles.beraterCol}>
                  <Text style={styles.beraterLabel}>Position</Text>
                  <Text>{kundenberater.position}</Text>
                </View>
              )}
              {kundenberater.email && (
                <View style={styles.beraterCol}>
                  <Text style={styles.beraterLabel}>E-Mail</Text>
                  <Text>{kundenberater.email}</Text>
                </View>
              )}
              {kundenberater.telefon && (
                <View style={styles.beraterCol}>
                  <Text style={styles.beraterLabel}>Telefon</Text>
                  <Text>{kundenberater.telefon}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ZEITPLAN */}
        {positionen.some((p) => p.startDate || p.endDate) && (() => {
          const monthTicks: { label: string; pct: number }[] = [];
          let t = getMonthStart(minDate);
          const maxT = maxDate + 86400000;
          while (t <= maxT) {
            if (t >= minDate) monthTicks.push({ label: getMonthName(t), pct: ((t - minDate) / rangeMs) * 100 });
            const d = new Date(t);
            d.setMonth(d.getMonth() + 1);
            t = d.getTime();
          }
          const kwTicks: { label: string; pct: number }[] = [];
          t = getWeekStart(minDate);
          while (t <= maxT) {
            if (t >= minDate) kwTicks.push({ label: `KW ${getCalendarWeek(t)}`, pct: ((t - minDate) / rangeMs) * 100 });
            t += 7 * 86400000;
          }
          return (
          <>
            <Text style={styles.sectionTitle}>Zeitplan</Text>
            <View style={styles.zeitplanBox}>
              <View style={styles.zeitplanAxisRow}>
                <Text style={styles.zeitplanAxisLabel}>Monat</Text>
                <View style={styles.zeitplanAxisTrack}>
                  {monthTicks.map((tick, i) => (
                    <Text key={i} style={[styles.zeitplanAxisTick, { left: `${Math.min(98, Math.max(0, tick.pct))}%` }]}>{tick.label}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.zeitplanAxisRow}>
                <Text style={styles.zeitplanAxisLabel}>KW</Text>
                <View style={styles.zeitplanAxisTrack}>
                  {kwTicks.map((tick, i) => (
                    <Text key={i} style={[styles.zeitplanAxisTick, { left: `${Math.min(98, Math.max(0, tick.pct))}%` }]}>{tick.label}</Text>
                  ))}
                </View>
              </View>
              {positionen.map((pos, i) => {
                const start = pos.startDate ? parseDate(pos.startDate) : minDate;
                const end = pos.endDate ? parseDate(pos.endDate) : maxDate;
                const leftPct = rangeMs ? ((start - minDate) / rangeMs) * 100 : 0;
                const widthPct = rangeMs ? (Math.max(end - start, 0) / rangeMs) * 100 : 10;
                return (
                  <View key={i} style={styles.zeitplanRow}>
                    <Text style={styles.zeitplanLabel}>{pos.produkt || "–"}</Text>
                    <View style={styles.zeitplanBarTrack}>
                      <View
                        style={[
                          styles.zeitplanBar,
                          {
                            width: `${Math.min(100 - leftPct, Math.max(2, widthPct))}%`,
                            marginLeft: `${Math.max(0, Math.min(leftPct, 98))}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
          );
        })()}

        {/* KOSTENÜBERSICHT: nur Netto, Rabatt-Spalte, MWST nur beim Gesamtpreis */}
        <Text style={styles.sectionTitle}>Kostenübersicht</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Produkt</Text>
            <Text style={styles.tableCell}>Verlag</Text>
            <Text style={styles.tableCell}>Zeitraum</Text>
            <Text style={styles.tableCell}>Laufzeit</Text>
            <Text style={[styles.tableCell, styles.tableCellFixed]}>Rabatt CHF</Text>
            <Text style={[styles.tableCell, styles.tableCellFixed]}>Netto CHF</Text>
          </View>
          {positionen.map((pos, i) => {
            const rabatt = getRabatt(pos);
            return (
              <View
                key={i}
                style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{pos.produkt || "–"}</Text>
                <Text style={styles.tableCell}>{pos.verlag || "–"}</Text>
                <Text style={styles.tableCell}>{pos.zeitraum || "–"}</Text>
                <Text style={styles.tableCell}>{pos.laufzeit || "–"}</Text>
                <Text style={[styles.tableCell, styles.tableCellFixed]}>{rabatt > 0 ? formatChf(rabatt) : "–"}</Text>
                <Text style={[styles.tableCell, styles.tableCellFixed]}>{formatChf(pos.nettoChf)}</Text>
              </View>
            );
          })}
          <View style={styles.summenRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Summe Netto</Text>
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={[styles.tableCell, styles.tableCellFixed]}>–</Text>
            <Text style={[styles.tableCell, styles.tableCellFixed]}>{formatChf(nettoSumme)}</Text>
          </View>
          <View style={styles.mwstRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>MWST {MWST_SATZ}%</Text>
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={[styles.tableCell, styles.tableCellFixed]} />
            <Text style={[styles.tableCell, styles.tableCellFixed]}>{formatChf(mwstBetrag)}</Text>
          </View>
          <View style={styles.gesamtRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Gesamt (inkl. MWST)</Text>
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={styles.tableCell} />
            <Text style={[styles.tableCell, styles.tableCellFixed]} />
            <Text style={[styles.tableCell, styles.tableCellFixed]}>{formatChf(gesamtMitMwst)}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
          <Text>Vertraulich – nur für den internen Gebrauch</Text>
        </View>
      </Page>
    </Document>
  );
}
