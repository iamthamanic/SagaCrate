/**
 * episode-summary-prompt — Pure spoiler-safe prompt builder for #573 AI recap.
 * Location: src/domains/session/contracts/episode-summary-prompt.ts
 *
 * Only audience-projected / public highlight lines may enter the prompt.
 * No React, I/O, or secrets.
 */

export type EpisodeSummaryPromptLine = {
  readonly id: string;
  readonly kind: string;
  readonly summary: string;
  readonly visibility?: string | null;
};

export type EpisodeSummaryPromptInput = {
  readonly sessionName: string;
  readonly sagaTitle: string | null;
  readonly highlightLines: readonly EpisodeSummaryPromptLine[];
};

export type EpisodeSummaryPrompt = {
  readonly version: 'episode-summary-v1';
  readonly system: string;
  readonly user: string;
  readonly eventCount: number;
};

const FORBIDDEN_VIS = new Set(['gm_only', 'gm-only', 'secret', 'private']);

/** Keep only lines safe for a player-facing episode summary. */
export function filterSpoilerSafeHighlightLines(
  lines: readonly EpisodeSummaryPromptLine[],
): readonly EpisodeSummaryPromptLine[] {
  return lines.filter((line) => {
    const vis = (line.visibility ?? 'shared').trim().toLowerCase();
    if (FORBIDDEN_VIS.has(vis)) return false;
    if (!line.summary.trim()) return false;
    return true;
  });
}

export function buildEpisodeSummaryPrompt(
  input: EpisodeSummaryPromptInput,
): EpisodeSummaryPrompt {
  const safe = filterSpoilerSafeHighlightLines(input.highlightLines).slice(0, 20);
  const saga = (input.sagaTitle ?? '').trim() || 'Saga';
  const session = input.sessionName.trim() || 'Episode';
  const events =
    safe.length === 0
      ? '- (Keine freigegebenen Ereignisse — schreibe eine kurze neutrale Episodennotiz.)'
      : safe.map((l) => `- [${l.kind}] ${l.summary.trim()}`).join('\n');

  return {
    version: 'episode-summary-v1',
    system:
      'Du bist Spielleiter-Assistent für ein Pen&Paper. Schreibe auf Deutsch eine kurze Episoden-Zusammenfassung (max. 180 Wörter) für Spieler. ' +
      'Nur aus den gelieferten freigegebenen Ereignissen. Keine Spoiler, keine GM-Geheimnisse, keine Erfindung neuer Plot-Twists. ' +
      'Ton: atmosphärisch, klar, ohne Meta (kein „als KI“).',
    user: `Saga: ${saga}\nEpisode: ${session}\n\nFreigegebene Ereignisse:\n${events}\n\nSchreibe die Zusammenfassung als Fließtext.`,
    eventCount: safe.length,
  };
}
