import type { MediaplanRow } from "@/lib/mediaplan/types";
import { beraterInitials } from "@/lib/mediaplan/utils";

type AgencyUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type Props = {
  plan: MediaplanRow;
  readOnly?: boolean;
  editing?: boolean;
  onStartEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  form?: Partial<MediaplanRow>;
  onFormChange?: (field: string, value: string) => void;
  agencyUsers?: AgencyUser[];
};

export function MediaplanKundenberater({
  plan,
  readOnly = false,
  editing = false,
  onStartEdit,
  onSave,
  onCancel,
  saving = false,
  form,
  onFormChange,
  agencyUsers = [],
}: Props) {
  const getForm = (key: keyof MediaplanRow) => (form && key in form ? String((form as Record<string, unknown>)[key] ?? "") : "");

  const displayName = plan.berater_name ?? "—";
  const displayEmail = plan.berater_email ?? "—";
  const beraterAvatarUrl = agencyUsers.find((u) => u.email === plan.berater_email || u.full_name === plan.berater_name)?.avatar_url;

  if (readOnly) {
    return (
      <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
        <h4 className="mb-3 border-b border-zinc-200 dark:border-zinc-600 pb-2 text-base font-semibold text-zinc-950 dark:text-zinc-100">Kundenberater</h4>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-600">
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {plan.berater_name || plan.berater_email ? beraterInitials(plan.berater_email ?? plan.berater_name ?? undefined) : "—"}
            </span>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{displayEmail}</p>
          </div>
        </div>
      </div>
    );
  }

  const showDisplay = !editing;
  const showSaveCancel = editing && onSave != null && onCancel != null;

  return (
    <div className="content-radius border border-zinc-200 dark:border-zinc-700 bg-[var(--haupt-box-bg)] dark:bg-zinc-800/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-600 pb-2">
        <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Kundenberater</h4>
        {showDisplay && onStartEdit && (
          <button
            type="button"
            onClick={onStartEdit}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            title="Bearbeiten"
            aria-label="Kundenberater bearbeiten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        )}
      </div>
      {showDisplay ? (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-600">
            {beraterAvatarUrl ? (
              <img
                src={beraterAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                {plan.berater_name || plan.berater_email ? beraterInitials(plan.berater_email ?? plan.berater_name ?? undefined) : "—"}
              </span>
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{plan.berater_name ?? "—"}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{plan.berater_email ?? "—"}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">Kundenberater aus App-Usern wählen</span>
            <select
              value={agencyUsers.find((u) => u.email === form?.berater_email || u.full_name === form?.berater_name)?.id ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const user = agencyUsers.find((u) => u.id === id);
                if (user && onFormChange) {
                  onFormChange("berater_name", user.full_name ?? "");
                  onFormChange("berater_email", user.email ?? "");
                } else if (onFormChange) {
                  onFormChange("berater_name", "");
                  onFormChange("berater_email", "");
                }
              }}
              className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">— Keiner / manuell eingeben</option>
              {agencyUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email || u.id}
                  {u.email && u.full_name ? ` (${u.email})` : u.email ? ` – ${u.email}` : ""}
                </option>
              ))}
            </select>
            {agencyUsers.length === 0 && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Keine Agentur-User geladen. In der Konsole (F12) prüfen, ob die RPC get_agency_profiles einen Fehler meldet.
              </p>
            )}
          </label>
          <label className="block">
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">Name</span>
            <input type="text" value={getForm("berater_name")} onChange={(e) => onFormChange?.("berater_name", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="z. B. Sarah Müller" />
          </label>
          <label className="block">
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">E-Mail</span>
            <input type="email" value={getForm("berater_email")} onChange={(e) => onFormChange?.("berater_email", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="sarah.mueller@agency.ch" />
          </label>
          <label className="block">
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">Telefon</span>
            <input type="text" value={getForm("berater_telefon")} onChange={(e) => onFormChange?.("berater_telefon", e.target.value)} className="mt-0.5 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-zinc-100" placeholder="+41 44 123 45 67" />
          </label>
          {showSaveCancel && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={async () => { await onSave?.(); }}
                disabled={saving}
                className="rounded-full bg-[#FF6554] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a4a] disabled:opacity-60"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
