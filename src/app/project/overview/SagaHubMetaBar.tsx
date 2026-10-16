/**
 * SagaHubMetaBar — Lobby-style cover/meta chrome above saga workspace tabs.
 * Left card: SAGA + public id / title with cover flush right (same as SessionLobby).
 * Right card: role + leave.
 * Location: src/app/project/overview/SagaHubMetaBar.tsx
 */
import { Button } from '../../../shared/ui/button';

export type SagaHubMetaBarProps = {
  sagaTitle: string;
  sagaPublicId: string;
  coverUrl: string | null;
  roleLabel: string;
  onLeave: () => void;
};

export function SagaHubMetaBar({
  sagaTitle,
  sagaPublicId,
  coverUrl,
  roleLabel,
  onLeave,
}: SagaHubMetaBarProps) {
  const title = sagaTitle.trim() || 'Saga';

  return (
    <div
      className="grid min-w-0 grid-cols-1 items-stretch gap-2 pb-1 sm:grid-cols-[minmax(0,1fr)_auto]"
      data-saga-hub-cover-meta
    >
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-baseline gap-2 truncate text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            <span>Saga</span>
            <span
              className="font-mono tracking-[0.14em] text-muted-foreground"
              data-saga-hub-public-id
              translate="no"
            >
              {sagaPublicId}
            </span>
          </p>
          <h1
            id="saga-overview-title"
            className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base"
          >
            {title}
          </h1>
        </div>
        <div
          className="relative aspect-video h-12 w-auto shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:h-14"
          data-saga-hub-saga-cover-frame
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Saga-Cover: ${title}`}
              className="absolute inset-0 size-full object-cover object-center"
              data-saga-hub-saga-cover
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-card text-sm font-semibold text-muted-foreground"
              data-saga-hub-saga-cover-fallback
              aria-hidden
            >
              {title.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      <section
        className="flex h-full min-w-0 items-center gap-2 self-stretch rounded-lg border border-border bg-card/80 px-2.5 py-2"
        data-saga-hub-meta-actions
        aria-label="Saga-Rolle und Aktionen"
      >
        <span
          className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-cyan-500/15 px-2.5 text-[13px] font-semibold text-cyan-600 dark:text-cyan-400"
          data-saga-hub-role
        >
          {roleLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11 shrink-0 px-3 text-xs font-semibold sm:text-sm"
          onClick={onLeave}
          data-saga-hub-leave
        >
          Zurück
        </Button>
      </section>
    </div>
  );
}
