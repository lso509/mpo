import type { CatalogProduct } from "@/lib/mediaplan/types";
import { formatChf, formatDateRange } from "@/lib/mediaplan/utils";

type Props = {
  product: CatalogProduct | null;
};

export function PositionCatalogInfo({ product }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Produktinformationen aus Katalog
      </h4>
      {product ? (
        <div className="grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Produkt</h5>
            <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div><dt className="inline">Kategorie: </dt><dd className="inline">{product.category ?? product.kategorie ?? "—"}</dd></div>
              <div><dt className="inline">Verlag: </dt><dd className="inline">{product.verlag ?? "—"}</dd></div>
              <div><dt className="inline">Kanal: </dt><dd className="inline">{product.kanal ?? "—"}</dd></div>
              <div><dt className="inline">Produktgruppe: </dt><dd className="inline">{product.produktgruppe ?? "—"}</dd></div>
              <div><dt className="inline">Ziel Eignung: </dt><dd className="inline">{product.ziel_eignung ?? "—"}</dd></div>
              <div><dt className="inline">Zusatzinformationen: </dt><dd className="inline">{product.zusatzinformationen ?? "—"}</dd></div>
            </dl>
          </div>
          <div>
            <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Spezifikationen</h5>
            <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div><dt className="inline">Platzierung: </dt><dd className="inline">{product.platzierung ?? "—"}</dd></div>
              <div><dt className="inline">Position: </dt><dd className="inline">{product.position ?? "—"}</dd></div>
              <div><dt className="inline">Farbe: </dt><dd className="inline">{product.creative_farbe ?? "—"}</dd></div>
              <div><dt className="inline">Typ: </dt><dd className="inline">{product.creative_typ ?? "—"}</dd></div>
              <div><dt className="inline">Format & Grösse: </dt><dd className="inline">{product.creative_groesse ?? product.size ?? "—"}{product.creative_groesse_einheit ? ` ${product.creative_groesse_einheit}` : ""}</dd></div>
              <div><dt className="inline">Dateityp: </dt><dd className="inline">{product.creative_dateityp ?? "—"}</dd></div>
            </dl>
          </div>
          <div>
            <h5 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Standard-Konditionen</h5>
            <dl className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div><dt className="inline">Preis Brutto (CHF) pro Einheit: </dt><dd className="inline">{formatChf(product.preis_brutto_chf)}</dd></div>
              <div><dt className="inline">Preis Netto (CHF) pro Einheit: </dt><dd className="inline">{formatChf(product.preis_netto_chf)}</dd></div>
              <div><dt className="inline">Preis Agenturservice: </dt><dd className="inline">{product.preis_agenturservice != null ? formatChf(product.preis_agenturservice) : "—"}</dd></div>
              <div><dt className="inline">Laufzeit pro Einheit: </dt><dd className="inline">{product.laufzeit_pro_einheit ?? "—"}</dd></div>
              <div><dt className="inline">Empfohlenes Medienbudget: </dt><dd className="inline">{product.empfohlenes_medienbudget ?? "—"}</dd></div>
              <div><dt className="inline">Buchungsvoraussetzung: </dt><dd className="inline">{product.buchungsvoraussetzung ?? "—"}</dd></div>
              <div><dt className="inline">Info zum Buchungsschluss: </dt><dd className="inline">{product.buchungsschluss_info ?? "—"}</dd></div>
              <div><dt className="inline">Creative Deadline: </dt><dd className="inline">{product.creative_deadline_tage != null ? `${product.creative_deadline_tage} Tage vorher` : product.creative_deadline_date ? formatDateRange(product.creative_deadline_date, null) : "—"}</dd></div>
            </dl>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kein Produkt aus dem Katalog verknüpft.</p>
      )}
    </div>
  );
}
