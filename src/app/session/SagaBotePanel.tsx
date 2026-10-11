/**
 * SagaBotePanel — Player/viewer “Der Bote” news list (#578).
 * Location: src/app/session/SagaBotePanel.tsx
 *
 * Presentational: spoiler-safe lines from Prepare VM (public/shared only).
 */
import type { BoteLine } from '../../domains/session/contracts/bote-lines';

export type SagaBotePanelProps = {
  lines: readonly BoteLine[];
};

export function SagaBotePanel({ lines }: SagaBotePanelProps) {
  return (
    <section
      className="space-y-2 rounded-lg border border-border bg-card/40 p-4"
      data-saga-bote-panel="v1"
      data-au-surface="session-prepare-bote"
      aria-labelledby="saga-bote-title"
    >
      <div className="space-y-1">
        <h2 id="saga-bote-title" className="text-sm font-medium text-foreground">
          Der Bote
        </h2>
        <p className="text-xs text-muted-foreground">
          Neuigkeiten seit der letzten Session — ohne Geheimnisse der Spielleitung
        </p>
      </div>
      <ul className="space-y-2" data-saga-bote-list>
        {lines.map((line) => (
          <li
            key={line.id}
            className="text-sm text-foreground"
            data-saga-bote-line={line.kind}
          >
            <span>{line.text}</span>
            {line.atLabel ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">{line.atLabel}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
