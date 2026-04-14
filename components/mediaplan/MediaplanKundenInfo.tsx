import type { MediaplanDetailFormState, MediaplanRow } from "@/lib/mediaplan/types";
import { formatChf } from "@/lib/mediaplan/utils";

type Props = {
  plan: MediaplanRow;
  mode: "full" | "kunde";
  editing?: boolean;
  onStartEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  form?: MediaplanDetailFormState;
  onFormChange?: (field: string, value: string) => void;
};

export function MediaplanKundenInfo({
  plan,
  mode,
  editing = false,
  onStartEdit,
  onSave,
  onCancel,
  saving = false,
  form,
  onFormChange,
}: Props) {
  const displayName = plan.kunde_name ?? plan.client ?? "—";
  const displayAddress = plan.kunde_adresse ?? "—";
  const displayPhone = plan.kunde_telefon ?? "—";
  const displayAp = [plan.kunde_ap_name, plan.kunde_ap_position, plan.kunde_ap_email, plan.kunde_ap_telefon ?? plan.kunde_ap_mobil].filter(Boolean).join("\n") || "—";

  const getForm = (key: keyof MediaplanRow) => (form && key in form ? String((form as Record<string, unknown>)[key] ?? "") : "");

  return (
    <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-600 pb-2">
        <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Kunden Infos</h4>
        {!editing ? (
          onStartEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              title="Bearbeiten"
              aria-label="Bearbeiten"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )
        ) : (
          onCancel != null && onSave != null && (
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                Abbrechen
              </button>
              <button type="button" onClick={onSave} disabled={saving} className="rounded-full bg-[#FF6554] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-60">
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          )
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {!editing ? (
          <>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-zinc-500 dark:text-zinc-400">Unternehmen</dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Adresse</dt><dd className="whitespace-pre-line font-medium text-zinc-900 dark:text-zinc-100">{displayAddress}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Hauptnummer</dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{displayPhone}</dd></div>
              {plan.max_budget_chf != null && (
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Maximales Budget</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatChf(plan.max_budget_chf)}</dd>
                </div>
              )}
            </dl>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Ansprechpartner</dt>
                <dd className="mt-1 whitespace-pre-line font-medium text-zinc-900 dark:text-zinc-100">{displayAp}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            {mode === "full" && onFormChange && (
              <div className="space-y-3 text-sm">
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Kampagne</span>
                  <input type="text" value={getForm("campaign")} onChange={(e) => onFormChange("campaign", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Kampagnenname" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Startdatum</span>
                  <input type="date" value={getForm("date_range_start")} onChange={(e) => onFormChange("date_range_start", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Enddatum</span>
                  <input type="date" value={getForm("date_range_end")} onChange={(e) => onFormChange("date_range_end", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Maximales Budget (optional, CHF netto)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={getForm("max_budget_chf")}
                    onChange={(e) => onFormChange("max_budget_chf", e.target.value)}
                    className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                    placeholder="Leer lassen oder z. B. 50000"
                    aria-label="Maximales Budget CHF"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Unternehmen</span>
                  <input type="text" value={getForm("client")} onChange={(e) => onFormChange("client", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z. B. Salt Mobile AG" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Adresse</span>
                  <textarea value={getForm("kunde_adresse")} onChange={(e) => onFormChange("kunde_adresse", e.target.value)} rows={3} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Strasse, PLZ Ort, Land" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Hauptnummer</span>
                  <input type="text" value={getForm("kunde_telefon")} onChange={(e) => onFormChange("kunde_telefon", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="+41 800 700 700" />
                </label>
              </div>
            )}
            {mode === "kunde" && onFormChange && (
              <div className="space-y-3 text-sm">
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Unternehmen</span>
                  <input type="text" value={getForm("client")} onChange={(e) => onFormChange("client", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z. B. Salt Mobile AG" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Adresse</span>
                  <textarea value={getForm("kunde_adresse")} onChange={(e) => onFormChange("kunde_adresse", e.target.value)} rows={3} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Strasse, PLZ Ort, Land" />
                </label>
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Hauptnummer</span>
                  <input type="text" value={getForm("kunde_telefon")} onChange={(e) => onFormChange("kunde_telefon", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="+41 800 700 700" />
                </label>
              </div>
            )}
            {onFormChange && (
              <div className="space-y-3 text-sm">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ansprechpartner</span>
                <input type="text" value={getForm("kunde_ap_name")} onChange={(e) => onFormChange("kunde_ap_name", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Name" aria-label="Ansprechpartner Name" />
                <input type="text" value={getForm("kunde_ap_position")} onChange={(e) => onFormChange("kunde_ap_position", e.target.value)} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Position" aria-label="Position" />
                <input type="email" value={getForm("kunde_ap_email")} onChange={(e) => onFormChange("kunde_ap_email", e.target.value)} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="E-Mail" aria-label="E-Mail" />
                <input type="text" value={getForm("kunde_ap_telefon")} onChange={(e) => onFormChange("kunde_ap_telefon", e.target.value)} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Telefon" aria-label="Telefon" />
                <input type="text" value={getForm("kunde_ap_mobil")} onChange={(e) => onFormChange("kunde_ap_mobil", e.target.value)} className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="Mobil" aria-label="Mobil" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
