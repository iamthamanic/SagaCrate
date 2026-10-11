/**
 * SagaSimulationGmPanel — GM preview/commit for in-world time (#577).
 * Location: src/app/session/SagaSimulationGmPanel.tsx
 *
 * Adaptive UI Journey: days → preview → Freigeben. AU: min-h-11, safe areas.
 */
import { useState } from 'react';
import type { LiveSessionAccess } from '../../domains/session/contracts/live-session-access';
import { Button } from '../../shared/ui/button';
import { Label } from '../../shared/ui/label';
import { useSagaSimulation } from './hooks/useSagaSimulation';

type Props = {
  sessionId: string | null;
  access: LiveSessionAccess | null;
};

const PREVIEW_CHUNK = 8;

export function SagaSimulationGmPanel({ sessionId, access }: Props) {
  const sim = useSagaSimulation({ sessionId, access });
  const [days, setDays] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [commitNote, setCommitNote] = useState<string | null>(null);
  const disabled = sim.isBusy || access?.role !== 'gamemaster';

  const events = sim.pendingPreview?.proposedEvents ?? [];
  const visible = showAll ? events : events.slice(0, PREVIEW_CHUNK);

  return (
    <div
      className="space-y-3 rounded-md border border-border/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-saga-simulation-gm-panel="v1"
      data-au-surface="journey"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Zeit vorstellen</h3>
        <p className="text-xs text-muted-foreground" data-saga-simulation-day>
          Tag {sim.stateV2.time.day}
          {sim.stateV2.partyLocationRef
            ? ` · ${sim.stateV2.partyLocationRef}`
            : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="saga-sim-days">
            Tage
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-11"
              disabled={disabled || days <= 1}
              onClick={() => setDays((d) => Math.max(1, d - 1))}
              data-saga-simulation-days-dec
            >
              −
            </Button>
            <input
              id="saga-sim-days"
              type="number"
              min={1}
              max={sim.softMaxDays}
              className="flex h-11 w-16 rounded-md border border-input bg-background px-2 text-center text-sm"
              value={days}
              disabled={disabled}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setDays(Math.max(1, Math.min(sim.softMaxDays, Math.floor(n))));
              }}
              data-saga-simulation-days
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-11"
              disabled={disabled || days >= sim.softMaxDays}
              onClick={() => setDays((d) => Math.min(sim.softMaxDays, d + 1))}
              data-saga-simulation-days-inc
            >
              +
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={disabled}
          onClick={() => {
            try {
              sim.previewAdvance(days);
              setShowAll(false);
            } catch {
              /* error on hook */
            }
          }}
          data-saga-simulation-preview
        >
          Vorschau
        </Button>
      </div>

      {days > 14 ? (
        <p className="text-xs text-amber-700" data-saga-simulation-days-warn>
          Viele Tage auf einmal — prüfe die Vorschau sorgfältig.
        </p>
      ) : null}

      {sim.error ? (
        <p className="text-sm text-destructive" role="alert" data-saga-simulation-error>
          {sim.error}
        </p>
      ) : null}

      {sim.pendingPreview ? (
        <div className="space-y-2" data-saga-simulation-preview-list>
          <p className="text-xs text-muted-foreground">
            Vorschau → Tag {sim.pendingPreview.nextState.time.day} (
            {sim.pendingPreview.proposedEvents.length} Ereignisse)
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {visible.map((evt) => (
              <li
                key={evt.id}
                className="rounded border border-border/40 px-2 py-1"
                data-saga-simulation-event={evt.kind}
              >
                <span className="font-medium">{evt.kind}</span>
                {': '}
                {evt.summaryPlayer || evt.summaryGm}
                {access?.role === 'gamemaster' && evt.summaryGm !== evt.summaryPlayer ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    SL: {evt.summaryGm}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {events.length > PREVIEW_CHUNK && !showAll ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setShowAll(true)}
            >
              Weitere {events.length - PREVIEW_CHUNK} anzeigen
            </Button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="min-h-11 min-w-[8rem]"
              disabled={disabled || !sim.pendingPreview}
              onClick={() => {
                if (!sim.pendingPreview) return;
                void sim.commitPreview(sim.pendingPreview).then((ok) => {
                  if (ok) {
                    setCommitNote('Die Welt hat sich bewegt.');
                  }
                });
              }}
              data-saga-simulation-commit
            >
              {sim.isBusy ? 'Wird freigegeben…' : 'Freigeben'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={sim.isBusy}
              onClick={() => sim.rejectPreview()}
              data-saga-simulation-reject
            >
              Verwerfen
            </Button>
          </div>
        </div>
      ) : null}

      {commitNote && !sim.pendingPreview ? (
        <p
          className="text-sm text-foreground"
          role="status"
          data-saga-simulation-commit-note
        >
          {commitNote}
        </p>
      ) : null}
    </div>
  );
}
