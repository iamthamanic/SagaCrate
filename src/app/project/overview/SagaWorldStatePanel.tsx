/**
 * SagaWorldStatePanel — Audience-safe clocks / consequences / deadlines / party (#571 / #578 / #581).
 * Location: src/app/project/overview/SagaWorldStatePanel.tsx
 *
 * Renders only the audience-safe overview world summary from the hub VM.
 */
import type { SagaWorldStateSummaryVm } from '../../../domains/project/contracts/saga-overview';
import { partyLocationDisplayLabel } from '../../../domains/session/contracts/party-location';
import { WorldMapPlayerView } from '../../world';

export type SagaWorldStatePanelProps = {
  summary: SagaWorldStateSummaryVm;
  worldProfileId?: string | null;
};

export function SagaWorldStatePanel({
  summary,
  worldProfileId = null,
}: SagaWorldStatePanelProps) {
  const hasClocks = summary.clocks.length > 0;
  const hasCons = summary.consequences.length > 0;
  const hasDeadlines = summary.openDeadlines.length > 0;
  const partyLabel = partyLocationDisplayLabel(summary.partyLocationRef);
  const hasParty = Boolean(partyLabel);

  return (
    <section className="space-y-3" data-saga-overview-world aria-labelledby="saga-overview-world-title">
      <div className="space-y-1">
        <h3 id="saga-overview-world-title" className="text-lg font-semibold text-foreground">
          Weltzustand
        </h3>
        <p className="text-sm text-muted-foreground">
          Öffentliche Uhren, Fristen und was bisher geschah
          {summary.flagCount > 0 ? ` · ${summary.flagCount} Marken` : ''}
        </p>
      </div>

      {hasParty ? (
        <p
          className="text-sm font-medium text-cyan-700 dark:text-cyan-300"
          data-saga-overview-party-location
        >
          Ihr seid hier: {partyLabel}
        </p>
      ) : null}

      {worldProfileId ? (
        <div data-saga-overview-party-map>
          <WorldMapPlayerView
            worldProfileId={worldProfileId}
            partyLocationRef={summary.partyLocationRef}
            canMoveParty={false}
          />
        </div>
      ) : null}

      {!hasClocks && !hasCons && !hasDeadlines && !hasParty ? (
        <p className="text-sm text-muted-foreground" data-saga-overview-world-empty>
          Noch keine öffentlichen Welt-Ereignisse.
        </p>
      ) : null}

      {hasDeadlines ? (
        <div className="space-y-2" data-saga-overview-open-deadlines>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Offene Fristen</p>
          <ul className="space-y-1.5">
            {summary.openDeadlines.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap justify-between gap-2 text-sm"
                data-saga-overview-deadline={d.id}
              >
                <span className="font-medium text-foreground">{d.label}</span>
                <span className="text-muted-foreground">fällig Tag {d.dueDay}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasClocks ? (
        <ul className="space-y-2" data-saga-overview-clocks>
          {summary.clocks.map((clock) => {
            const max = Math.max(1, clock.max);
            const pct = Math.min(100, Math.round((clock.value / max) * 100));
            return (
              <li key={clock.id} className="space-y-1" data-saga-overview-clock={clock.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{clock.label}</span>
                  <span className="text-muted-foreground">
                    {clock.value}/{max}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-sm bg-muted"
                  role="progressbar"
                  aria-valuenow={clock.value}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-label={clock.label}
                >
                  <div className="h-full bg-cyan-600" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {hasCons ? (
        <div className="space-y-2" data-saga-overview-consequences>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bisher geschah</p>
          <ul className="space-y-1.5">
            {summary.consequences.map((c) => (
              <li key={c.id} className="text-sm text-foreground" data-saga-overview-consequence={c.id}>
                {c.summary}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
