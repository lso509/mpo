import type { CatalogProduct, PositionRow } from "@/lib/mediaplan/types";
import { parseZielEignung } from "@/lib/produkte";
import { formatChf, formatDateRange } from "@/lib/mediaplan/utils";

type Props = {
  product: CatalogProduct | null;
  position?: PositionRow | null;
  view?: "agency" | "customer";
};

export function PositionCatalogInfo({ product, position = null, view = "agency" }: Props) {
  const isCustomerView = view === "customer";

  return (
    <div className="bg-white dark:bg-zinc-900/50 p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {isCustomerView ? "Positionsdetails aus Mediaplan" : "Produktinformationen aus Katalog"}
      </h4>
      {product || position ? (
        isCustomerView ? (
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Laufzeiten & Umsetzung</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Titel: </dt><dd className="inline">{position?.title || "—"}</dd></div>
                <div><dt className="inline">Laufzeit: </dt><dd className="inline">{formatDateRange(position?.start_date ?? null, position?.end_date ?? null)}</dd></div>
                <div><dt className="inline">Creative Deadline: </dt><dd className="inline">{position?.creative_deadline ? formatDateRange(position.creative_deadline, null) : "—"}</dd></div>
                <div><dt className="inline">Menge / Volumen: </dt><dd className="inline">{position?.menge_volumen ?? "—"}</dd></div>
                <div><dt className="inline">Anzahl Einheiten: </dt><dd className="inline">{position?.anzahl_einheiten ?? "—"}</dd></div>
                <div>
                  <dt className="inline">Ziel: </dt>
                  <dd className="inline">
                    {parseZielEignung(position?.ziel ?? product?.ziel_eignung) || "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Creatives</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Creative Typ: </dt><dd className="inline">{product?.creative_typ ?? "—"}</dd></div>
                <div><dt className="inline">Creative Farbe: </dt><dd className="inline">{product?.creative_farbe ?? "—"}</dd></div>
                <div><dt className="inline">Creative Dateityp: </dt><dd className="inline">{product?.creative_dateityp ?? "—"}</dd></div>
                <div><dt className="inline">Creative Format: </dt><dd className="inline">{product?.creative_groesse ?? product?.size ?? "—"}{product?.creative_groesse_einheit ? ` ${product.creative_groesse_einheit}` : ""}</dd></div>
              </dl>
            </div>
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Preis & Infos</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Kundenpreis (CHF): </dt><dd className="inline">{formatChf(position?.kundenpreis ?? product?.preis_netto_chf ?? null)}</dd></div>
                <div><dt className="inline">Brutto (CHF): </dt><dd className="inline">{formatChf(position?.brutto ?? product?.preis_brutto_chf ?? null)}</dd></div>
                <div><dt className="inline">Rabatt Verlag (%): </dt><dd className="inline">{position?.rabatt_prozent ?? "—"}</dd></div>
                <div><dt className="inline">Rabatttext: </dt><dd className="inline">{position?.discount_text ?? "—"}</dd></div>
                <div><dt className="inline">Platzierung: </dt><dd className="inline">{product?.platzierung ?? "—"}</dd></div>
                <div><dt className="inline">Zusatzinfos: </dt><dd className="inline">{position?.zusatzinformationen_kunde ?? position?.description ?? product?.zusatzinformationen ?? "—"}</dd></div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Produkt</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Kategorie: </dt><dd className="inline">{product?.category ?? product?.kategorie ?? "—"}</dd></div>
                <div><dt className="inline">Verlag: </dt><dd className="inline">{product?.verlag ?? "—"}</dd></div>
                <div><dt className="inline">Kanal: </dt><dd className="inline">{product?.kanal ?? "—"}</dd></div>
                <div><dt className="inline">Produktgruppe: </dt><dd className="inline">{product?.produktgruppe ?? "—"}</dd></div>
                <div><dt className="inline">Ziel: </dt><dd className="inline">{parseZielEignung(position?.ziel ?? product?.ziel_eignung) || "—"}</dd></div>
                <div><dt className="inline">Zusatzinformationen: </dt><dd className="inline">{product?.zusatzinformationen ?? "—"}</dd></div>
              </dl>
            </div>
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Spezifikationen</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Platzierung: </dt><dd className="inline">{product?.platzierung ?? "—"}</dd></div>
                <div><dt className="inline">Position: </dt><dd className="inline">{product?.position ?? "—"}</dd></div>
                <div><dt className="inline">Farbe: </dt><dd className="inline">{product?.creative_farbe ?? "—"}</dd></div>
                <div><dt className="inline">Typ: </dt><dd className="inline">{product?.creative_typ ?? "—"}</dd></div>
                <div><dt className="inline">Format & Grösse: </dt><dd className="inline">{product?.creative_groesse ?? product?.size ?? "—"}{product?.creative_groesse_einheit ? ` ${product.creative_groesse_einheit}` : ""}</dd></div>
                <div><dt className="inline">Dateityp: </dt><dd className="inline">{product?.creative_dateityp ?? "—"}</dd></div>
              </dl>
            </div>
            <div>
              <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Standard-Konditionen</h5>
              <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <div><dt className="inline">Brutto (CHF): </dt><dd className="inline">{position ? formatChf(position.brutto) : formatChf(product?.preis_brutto_chf ?? null)}</dd></div>
                <div><dt className="inline">Rabatt Verlag (%): </dt><dd className="inline">{position?.rabatt_prozent ?? "—"}</dd></div>
                <div><dt className="inline">Rabatttext: </dt><dd className="inline">{position?.discount_text ?? "—"}</dd></div>
                <div><dt className="inline">Kundenpreis (CHF): </dt><dd className="inline">{position ? formatChf(position.kundenpreis) : formatChf(product?.preis_netto_chf ?? null)}</dd></div>
                <div><dt className="inline">Preis Agenturservice: </dt><dd className="inline">{product?.preis_agenturservice != null ? formatChf(product.preis_agenturservice) : "—"}</dd></div>
                <div><dt className="inline">Laufzeit pro Einheit: </dt><dd className="inline">{product?.laufzeit_pro_einheit ?? "—"}</dd></div>
                <div><dt className="inline">Empfohlenes Medienbudget: </dt><dd className="inline">{product?.empfohlenes_medienbudget ?? "—"}</dd></div>
                <div><dt className="inline">Buchungsvoraussetzung: </dt><dd className="inline">{product?.buchungsvoraussetzung ?? "—"}</dd></div>
                <div><dt className="inline">Info zum Buchungsschluss: </dt><dd className="inline">{product?.buchungsschluss_info ?? "—"}</dd></div>
                <div><dt className="inline">Creative Deadline: </dt><dd className="inline">{product?.creative_deadline_tage != null ? `${product.creative_deadline_tage} Tage vorher` : product?.creative_deadline_date ? formatDateRange(product.creative_deadline_date, null) : "—"}</dd></div>
              </dl>
            </div>
          </div>
        )
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kein Produkt aus dem Katalog verknüpft.</p>
      )}
    </div>
  );
}
