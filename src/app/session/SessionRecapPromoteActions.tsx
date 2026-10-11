/**
 * SessionRecapPromoteActions — GM confirm to promote a highlight (#582).
 * Location: src/app/session/SessionRecapPromoteActions.tsx
 *
 * Separate Welt / Saga buttons (Hick). Confirm before call (Postel).
 */
import { useRef, useState } from 'react';
import type { RecapHighlightLine } from '../../domains/session/contracts/session-prepare-recap';
import { planPromoteConsequence } from '../../domains/session/contracts/session-outcome-promotion';
import { sessionOutcomePromotionService } from '../../infrastructure/saga/session-outcome-promotion-service';
import { Button } from '../../shared/ui/button';

type Props = {
  sessionId: string;
  highlight: RecapHighlightLine;
};

export function SessionRecapPromoteActions({ sessionId, highlight }: Props) {
  const [pending, setPending] = useState<'saga' | 'world' | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<'saga' | 'world' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  if (highlight.kind === 'empty' || highlight.id === 'pending') {
    return null;
  }

  const run = async (target: 'saga' | 'world') => {
    const plan = planPromoteConsequence({
      target,
      consequenceId: highlight.id,
      summary: highlight.summary,
      kind: highlight.kind,
    });
    if (plan.ok === false) {
      setError(plan.reasonDe);
      return;
    }
    if (confirmTarget !== target) {
      setConfirmTarget(target);
      setNote(plan.confirmDe);
      setError(null);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(target);
    setError(null);
    try {
      const result =
        target === 'saga'
          ? await sessionOutcomePromotionService.promoteToSaga(sessionId, plan.consequenceId)
          : await sessionOutcomePromotionService.promoteToWorld(sessionId, plan.consequenceId);
      if (!result.ok) {
        setError(result.messageDe ?? 'Übernehmen fehlgeschlagen');
        return;
      }
      setNote(
        result.idempotent
          ? 'Bereits übernommen.'
          : (result.messageDe ?? 'Übernommen.'),
      );
      setConfirmTarget(null);
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };

  return (
    <div
      className="mt-2 flex flex-col gap-2"
      data-session-recap-promote
      data-au-surface="session-recap-promote"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={confirmTarget === 'saga' ? 'default' : 'outline'}
          className="min-h-11"
          disabled={pending !== null}
          data-session-recap-promote-saga
          onClick={() => void run('saga')}
        >
          {confirmTarget === 'saga' ? 'Saga bestätigen' : 'In die Saga'}
        </Button>
        <Button
          type="button"
          variant={confirmTarget === 'world' ? 'default' : 'outline'}
          className="min-h-11"
          disabled={pending !== null}
          data-session-recap-promote-world
          onClick={() => void run('world')}
        >
          {confirmTarget === 'world' ? 'Welt bestätigen' : 'In die Welt'}
        </Button>
        {confirmTarget ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={pending !== null}
            onClick={() => {
              setConfirmTarget(null);
              setNote(null);
            }}
          >
            Abbrechen
          </Button>
        ) : null}
      </div>
      {note ? (
        <p className="text-xs text-muted-foreground" role="status" data-session-recap-promote-note>
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert" data-session-recap-promote-error>
          {error}
        </p>
      ) : null}
    </div>
  );
}
