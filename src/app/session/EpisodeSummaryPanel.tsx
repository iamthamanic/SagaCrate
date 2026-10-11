/**
 * EpisodeSummaryPanel — GM AI/manual episode summary with approve (#573).
 * Location: src/app/session/EpisodeSummaryPanel.tsx
 *
 * Player path: read-only approved text only (no generate).
 */
import { Button } from '../../shared/ui/button';
import { useEpisodeSummary } from './hooks/useEpisodeSummary';

type EpisodeSummaryPanelProps = {
  readonly sessionId: string | null;
  readonly isGm: boolean;
  readonly playerSummaryText: string | null;
};

export function EpisodeSummaryPanel({
  sessionId,
  isGm,
  playerSummaryText,
}: EpisodeSummaryPanelProps) {
  const episode = useEpisodeSummary({
    sessionId,
    enabled: isGm && Boolean(sessionId),
  });

  if (!isGm) {
    if (!playerSummaryText) return null;
    return (
      <section
        className="rounded-lg border border-border bg-card/40 p-4"
        data-session-recap-summary
        data-episode-summary="approved"
      >
        <h2 className="text-sm font-medium">Zusammenfassung</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{playerSummaryText}</p>
      </section>
    );
  }

  const busy = episode.status === 'generating';
  const statusLabel =
    episode.status === 'generating'
      ? 'Wird geschrieben…'
      : episode.status === 'approved'
        ? 'Episode gespeichert'
        : episode.status === 'failed'
          ? 'KI fehlgeschlagen — bitte manuell schreiben'
          : episode.status === 'draft'
            ? 'Entwurf (noch nicht freigegeben)'
            : 'Noch keine Zusammenfassung';

  return (
    <section
      className="rounded-lg border border-border bg-card/40 p-4"
      data-session-recap-summary
      data-episode-summary={episode.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Zusammenfassung</h2>
        <span className="text-xs text-muted-foreground" data-episode-summary-status>
          {statusLabel}
        </span>
      </div>

      {episode.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert" data-episode-summary-error>
          {episode.error}
        </p>
      ) : null}

      <textarea
        className="mt-3 min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={episode.summaryText}
        disabled={busy}
        onChange={(e) => episode.setSummaryText(e.target.value)}
        placeholder="Episoden-Zusammenfassung für Spieler…"
        data-episode-summary-textarea
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={busy || !sessionId}
          onClick={() => void episode.generate()}
          data-episode-summary-generate
        >
          {busy ? 'Wird geschrieben…' : episode.summaryText ? 'Neu generieren' : 'Mit KI schreiben'}
        </Button>
        <Button
          type="button"
          className="min-h-11"
          disabled={busy || !episode.summaryText.trim()}
          onClick={() => void episode.approve()}
          data-episode-summary-approve
        >
          Freigeben
        </Button>
        {busy ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => episode.cancel()}
            data-episode-summary-cancel
          >
            Abbrechen
          </Button>
        ) : null}
      </div>
    </section>
  );
}
