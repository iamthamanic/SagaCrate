/**
 * SagaOverviewHero — Story hub hero panel (gradient surface, tags, progress, CTA).
 * Matches `.qa/design/prototypes/saga-workspace-screens.html` overview hero.
 * Location: src/app/project/overview/SagaOverviewHero.tsx
 */
import { useState } from 'react';
import type { SagaOverviewVm, SagaPrimaryAction } from '../../../domains/project/contracts/saga-overview';
import { sessionStatusLabelDe } from '../../../domains/session/contracts/session-prepare-recap';
import { Button } from '../../../shared/ui/button';

export type SagaOverviewHeroProps = {
  model: SagaOverviewVm;
  primaryAction: SagaPrimaryAction;
  onPrimary: () => void;
};

const BLURB_CLAMP = 220;

function nextEpisodeHint(model: SagaOverviewVm): string | null {
  const next =
    model.episodes.find((e) => e.status !== 'completed') ?? model.episodes[0] ?? null;
  if (!next) return null;
  const name = next.name?.trim() || `Episode #${next.sessionNumber}`;
  return `Startet ${name} · ${sessionStatusLabelDe(next.status)}`;
}

export function SagaOverviewHero({ model, primaryAction, onPrimary }: SagaOverviewHeroProps) {
  const [expanded, setExpanded] = useState(false);
  const blurb = model.blurb.trim();
  const needsClamp = blurb.length > BLURB_CLAMP;
  const shown = !needsClamp || expanded ? blurb : `${blurb.slice(0, BLURB_CLAMP).trimEnd()}…`;
  const wait = primaryAction.kind === 'wait';
  const completed = model.episodes.filter((e) => e.status === 'completed').length;
  const total = model.episodes.length;
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const hint = nextEpisodeHint(model);

  return (
    <section
      className="grid gap-4 rounded-xl border border-border bg-card p-5 [background-image:radial-gradient(120%_80%_at_0%_0%,rgba(6,182,212,0.12),transparent_55%)] @[40rem]:grid-cols-[1fr_auto] @[40rem]:items-end"
      data-saga-overview-hero
      aria-label="Nächster Schritt"
    >
      <div className="min-w-0 space-y-3">
        {blurb ? (
          <div className="space-y-1">
            <p className="max-w-[62ch] text-[15px] font-medium leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {shown}
            </p>
            {needsClamp ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 px-0"
                onClick={() => setExpanded((v) => !v)}
                data-saga-overview-blurb-toggle
              >
                {expanded ? 'Weniger' : 'Mehr lesen'}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Noch keine Beschreibung.</p>
        )}

        {model.versionLabel ? (
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex min-h-7 items-center rounded-md border border-border px-2.5 text-[13px] font-semibold text-muted-foreground"
              data-saga-overview-version
            >
              Fassung {model.versionLabel}
              {model.newerVersionAvailable ? ' · neu' : ''}
            </span>
          </div>
        ) : null}

        {total > 0 ? (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3.5"
            data-saga-overview-progress
          >
            <span className="text-[13px] font-semibold text-muted-foreground">Gruppenfortschritt</span>
            <div
              className="h-1.5 min-w-[7.5rem] flex-1 overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${completed} von ${total} Episoden abgeschlossen`}
            >
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {completed} / {total}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-[min(100%,13.75rem)] flex-col gap-2">
        <Button
          type="button"
          className="min-h-11 w-full text-base font-bold"
          disabled={wait}
          onClick={onPrimary}
          data-saga-overview-primary={primaryAction.kind}
        >
          {primaryAction.labelDe}
        </Button>
        {wait ? (
          <p className="text-center text-[13px] text-muted-foreground" data-saga-overview-wait-hint>
            Deine Spielleitung startet die nächste Session.
          </p>
        ) : hint ? (
          <p className="text-center text-[13px] text-muted-foreground" data-saga-overview-cta-hint>
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
