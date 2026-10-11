/**
 * bote-lines — Der Bote + open-deadline helpers for between-sessions (#578).
 * Location: src/domains/session/contracts/bote-lines.ts
 *
 * Pure domain: filter public/shared simulation consequences and open deadlines.
 * No React, no I/O. Prepare VM builds lines here — not in JSX.
 */

import type { AdventureDeadlineRuntime } from './adventure-runtime-state';

export type BoteLine = {
  readonly id: string;
  readonly text: string;
  readonly atLabel: string;
  readonly kind: string;
};

export type OpenDeadlineLine = {
  readonly id: string;
  readonly label: string;
  readonly dueDay: number;
  readonly visibility: string;
};

const BOTE_KINDS = new Set([
  'deadline',
  'threat_doom',
  'threat_tick',
  'rule',
  'time',
  'sim',
]);

export type BoteConsequenceInput = {
  readonly id: string;
  readonly kind: string;
  readonly summary: string;
  readonly createdAt?: string | null;
  readonly visibility?: string | null;
};

function formatAtLabel(createdAt: string | null | undefined): string {
  if (!createdAt) return '';
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return '';
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(t));
  } catch {
    return '';
  }
}

/**
 * Player/viewer-safe Bote lines from already audience-projected consequences.
 * Prefer simulation-related kinds; newest first. No gm_only (caller must project).
 */
export function buildBoteLines(input: {
  readonly consequences: readonly BoteConsequenceInput[];
  readonly sinceIso?: string | null;
  readonly maxLines?: number;
  readonly emptyTextDe?: string;
}): readonly BoteLine[] {
  const maxLines =
    typeof input.maxLines === 'number' && Number.isFinite(input.maxLines)
      ? Math.max(1, Math.floor(input.maxLines))
      : 12;
  const sinceMs = input.sinceIso ? Date.parse(input.sinceIso) : Number.NaN;
  const hasSince = Number.isFinite(sinceMs);

  const filtered = input.consequences.filter((c) => {
    if (c.visibility === 'gm_only') return false;
    if (!BOTE_KINDS.has(c.kind)) return false;
    if (!c.summary.trim()) return false;
    if (!hasSince || !c.createdAt) return true;
    const t = Date.parse(c.createdAt);
    if (!Number.isFinite(t)) return true;
    return t >= sinceMs;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  if (sorted.length === 0) {
    return [
      {
        id: 'bote-empty',
        text: input.emptyTextDe ?? 'Noch keine Neuigkeiten vom Boten.',
        atLabel: '',
        kind: 'empty',
      },
    ];
  }

  return sorted.slice(0, maxLines).map((c) => ({
    id: c.id,
    text: c.summary,
    atLabel: formatAtLabel(c.createdAt),
    kind: c.kind,
  }));
}

/** Open (unfired) deadlines for Zeigarnik surfaces; audience already filtered. */
export function listOpenDeadlines(input: {
  readonly deadlines: readonly AdventureDeadlineRuntime[];
  readonly maxLines?: number;
}): readonly OpenDeadlineLine[] {
  const maxLines =
    typeof input.maxLines === 'number' && Number.isFinite(input.maxLines)
      ? Math.max(1, Math.floor(input.maxLines))
      : 16;
  const open = input.deadlines
    .filter((d) => !d.fired && d.visibility !== 'gm_only')
    .slice()
    .sort((a, b) => a.dueDay - b.dueDay);
  return open.slice(0, maxLines).map((d) => ({
    id: d.id,
    label: d.label,
    dueDay: d.dueDay,
    visibility: d.visibility,
  }));
}
