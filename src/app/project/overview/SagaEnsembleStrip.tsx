/**
 * SagaEnsembleStrip — Ensemble panel with avatar initials (EntityBrowser-list chrome).
 * Matches saga-workspace-screens.html overview ensemble panel.
 * Location: src/app/project/overview/SagaEnsembleStrip.tsx
 */
import type { SagaEnsembleMemberVm } from '../../../domains/project/contracts/saga-overview';

export type SagaEnsembleStripProps = {
  ensemble: readonly SagaEnsembleMemberVm[];
  onManageCharacters?: () => void;
};

function roleLabel(role: string): string {
  if (role === 'gamemaster' || role === 'gm') return 'Spielleitung';
  if (role === 'viewer' || role === 'observer') return 'Beobachter';
  return 'Spieler';
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function SagaEnsembleStrip({ ensemble, onManageCharacters }: SagaEnsembleStripProps) {
  return (
    <section
      className="rounded-xl border border-border bg-card"
      data-saga-overview-ensemble
      aria-labelledby="saga-overview-ensemble-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2.5 pt-3.5">
        <div className="space-y-0.5">
          <h3 id="saga-overview-ensemble-title" className="text-[1.05rem] font-bold text-foreground">
            Ensemble
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {ensemble.length === 0
              ? 'Noch keine aktiven Mitglieder.'
              : `${ensemble.length} aktiv`}
          </p>
        </div>
      </div>

      {ensemble.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">Lade Spieler ein, sobald die Saga läuft.</p>
      ) : (
        <ul className="space-y-1 px-3 pb-3" data-saga-overview-ensemble-list>
          {ensemble.map((member) => {
            const isGm = member.role === 'gamemaster' || member.role === 'gm';
            const label =
              member.characterName?.trim() ||
              (isGm ? 'SL' : roleLabel(String(member.role)));
            const thumb = isGm && !member.characterName?.trim() ? 'SL' : initials(label);
            return (
              <li
                key={member.userId}
                className="flex min-h-[3.25rem] items-center gap-3 rounded-[10px] border border-transparent px-2.5 py-2 hover:border-border hover:bg-white/[0.03]"
                data-saga-overview-ensemble-member={member.userId}
              >
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-border bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-cyan-400"
                  aria-hidden
                >
                  {thumb}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {roleLabel(String(member.role))}
                    {member.isSelf ? ' · du' : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {onManageCharacters ? (
        <div className="border-t border-border px-3 py-3">
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-semibold text-foreground hover:border-amber-500/50 hover:text-amber-500"
            data-saga-hub-characters
            onClick={onManageCharacters}
          >
            Spieler-Charaktere verwalten
          </button>
        </div>
      ) : null}
    </section>
  );
}
