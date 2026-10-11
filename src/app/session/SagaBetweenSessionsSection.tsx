/**
 * SagaBetweenSessionsSection — Prepare “Zwischen den Sessions” (#578).
 * Location: src/app/session/SagaBetweenSessionsSection.tsx
 *
 * GM: reuse SagaSimulationGmPanel. Players: Bote only (via sibling). Open deadlines strip.
 */
import type { LiveSessionAccess } from '../../domains/session/contracts/live-session-access';
import type { OpenDeadlineLine } from '../../domains/session/contracts/bote-lines';
import { SagaPartyLocationGmPanel } from './SagaPartyLocationGmPanel';
import { SagaSimulationGmPanel } from './SagaSimulationGmPanel';

export type SagaBetweenSessionsSectionProps = {
  sessionId: string | null;
  isGm: boolean;
  worldDay: number;
  openDeadlines: readonly OpenDeadlineLine[];
};

const GM_ACCESS: LiveSessionAccess = {
  role: 'gamemaster',
  capabilities: [],
  characterId: null,
};

export function SagaBetweenSessionsSection({
  sessionId,
  isGm,
  worldDay,
  openDeadlines,
}: SagaBetweenSessionsSectionProps) {
  return (
    <section
      className="space-y-3"
      data-saga-between-sessions="v1"
      data-au-surface="session-prepare-between"
      aria-labelledby="saga-between-sessions-title"
    >
      <div className="space-y-1">
        <h2 id="saga-between-sessions-title" className="text-sm font-medium text-foreground">
          Zwischen den Sessions
        </h2>
        <p className="text-xs text-muted-foreground">
          Weltzeit Tag {worldDay}
          {openDeadlines.length > 0
            ? ` · ${openDeadlines.length} offene Frist${openDeadlines.length === 1 ? '' : 'en'}`
            : ''}
        </p>
      </div>

      {openDeadlines.length > 0 ? (
        <ul
          className="space-y-1.5 rounded-md border border-border/60 p-3"
          data-saga-open-deadlines
        >
          <li className="text-xs uppercase tracking-wide text-muted-foreground">
            Offene Fristen
          </li>
          {openDeadlines.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap justify-between gap-2 text-sm"
              data-saga-open-deadline={d.id}
            >
              <span className="font-medium text-foreground">{d.label}</span>
              <span className="text-muted-foreground">fällig Tag {d.dueDay}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {isGm ? (
        <div data-saga-between-sessions-gm className="space-y-3">
          <SagaSimulationGmPanel sessionId={sessionId} access={GM_ACCESS} />
          <SagaPartyLocationGmPanel sessionId={sessionId} access={GM_ACCESS} />
        </div>
      ) : null}
    </section>
  );
}
