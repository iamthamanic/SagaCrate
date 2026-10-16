/**
 * session-prepare-recap — Prepare/Recap lifecycle product contracts (#492).
 * Location: src/domains/session/contracts/session-prepare-recap.ts
 *
 * Pure domain: lifecycle labels, CTAs, audience-safe recap lines. No React or I/O.
 */

import type { SessionRole } from './live-session-access';
import type { ProjectSessionLifecycleStatus } from '../../resource-id/session-routing';
import { resolveNeutralSessionPhase } from '../../resource-id/session-routing';

export type SessionLifecycleScreen = 'prepare' | 'lobby' | 'live' | 'recap';

export type PrepareCtaKind = 'lobby' | 'invite' | 'live-resume' | 'back';

export type RecapCtaKind = 'next-session' | 'saga' | 'home';

export type SessionLifecycleSummary = {
  readonly sessionId: string;
  readonly sessionPublicId: string;
  readonly sagaPublicId: string;
  readonly sessionName: string;
  readonly sagaName: string | null;
  readonly statusLabelDe: string;
  readonly code: string;
  readonly playerCount: number;
  readonly startedAtIso: string | null;
  readonly endedAtIso: string | null;
};

export type RecapHighlightLine = {
  readonly id: string;
  readonly kind: string;
  readonly summary: string;
};

const STATUS_LABEL_DE: Record<string, string> = {
  scheduled: 'Geplant',
  waiting: 'Wartend',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
};

export function sessionStatusLabelDe(status: string): string {
  return STATUS_LABEL_DE[status] ?? status;
}

/**
 * Map persisted project-session status to the product lifecycle screen.
 * Extends #276: scheduled→prepare; active/paused→live; completed/cancelled→recap.
 * Unknown / waiting → prepare (safe pre-live default for neutral /sessions/:id).
 */
export function resolveLifecycleScreenFromStatus(
  status: ProjectSessionLifecycleStatus | string,
): SessionLifecycleScreen {
  if (
    status === 'scheduled' ||
    status === 'active' ||
    status === 'paused' ||
    status === 'completed' ||
    status === 'cancelled'
  ) {
    return resolveNeutralSessionPhase(status);
  }
  return 'prepare';
}

/**
 * Saga-hub „Öffnen“ / host entry — play surface, not prepare tooling.
 * waiting|scheduled → lobby (hosting); active|paused → live; done → recap.
 */
export function resolveHubSessionEntryPhase(
  status: ProjectSessionLifecycleStatus | string,
): SessionLifecycleScreen {
  if (status === 'active' || status === 'paused') return 'live';
  if (status === 'completed' || status === 'cancelled') return 'recap';
  return 'lobby';
}

export function buildPreparePrimaryCta(input: {
  readonly role: SessionRole;
  readonly status: string;
}): { readonly kind: PrepareCtaKind; readonly labelDe: string } {
  if (input.status === 'active' || input.status === 'paused') {
    return {
      kind: 'live-resume',
      labelDe: input.role === 'gamemaster' ? 'Live fortsetzen' : 'Zur Live-Session',
    };
  }
  if (input.role === 'gamemaster') {
    return { kind: 'lobby', labelDe: 'Zur Lobby' };
  }
  return { kind: 'lobby', labelDe: 'Lobby öffnen' };
}

export function buildRecapPrimaryCta(input: {
  readonly role: SessionRole;
}): { readonly kind: RecapCtaKind; readonly labelDe: string } {
  if (input.role === 'gamemaster') {
    return { kind: 'next-session', labelDe: 'Nächste Session erstellen' };
  }
  return { kind: 'saga', labelDe: 'Zur Saga' };
}

export type RecapConsequenceInput = {
  readonly id: string;
  readonly kind: string;
  readonly summary: string;
  readonly createdAt?: string | null;
  readonly visibility?: string | null;
};

/**
 * Build recap highlight lines for an episode (#492 / #572).
 * Prefer newest consequences; optionally filter to a session time window.
 */
export function buildRecapHighlightLines(input: {
  readonly consequences: readonly RecapConsequenceInput[];
  readonly emptyLabelDe?: string;
  /** When set, only include consequences with createdAt in [start, end]. */
  readonly sessionStartedAtIso?: string | null;
  readonly sessionEndedAtIso?: string | null;
  readonly maxLines?: number;
}): readonly RecapHighlightLine[] {
  const maxLines =
    typeof input.maxLines === 'number' && Number.isFinite(input.maxLines)
      ? Math.max(1, Math.floor(input.maxLines))
      : 20;
  const startMs = input.sessionStartedAtIso
    ? Date.parse(input.sessionStartedAtIso)
    : Number.NaN;
  const endMs = input.sessionEndedAtIso ? Date.parse(input.sessionEndedAtIso) : Number.NaN;
  const hasWindow = Number.isFinite(startMs) || Number.isFinite(endMs);

  const filtered = input.consequences.filter((c) => {
    if (!hasWindow || !c.createdAt) return true;
    const t = Date.parse(c.createdAt);
    if (!Number.isFinite(t)) return true;
    if (Number.isFinite(startMs) && t < startMs) return false;
    if (Number.isFinite(endMs) && t > endMs) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  if (sorted.length === 0) {
    return [
      {
        id: 'empty',
        kind: 'empty',
        summary: input.emptyLabelDe ?? 'Keine freigegebenen Ereignisse für deine Rolle.',
      },
    ];
  }

  return sorted.slice(0, maxLines).map((c) => ({
    id: c.id,
    kind: c.kind,
    summary: c.summary,
  }));
}

/** Map persisted session_recaps.highlight_lines JSON into view lines. */
export function parsePersistedRecapHighlightLines(
  raw: unknown,
  emptyLabelDe?: string,
): readonly RecapHighlightLine[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return buildRecapHighlightLines({ consequences: [], emptyLabelDe });
  }
  const consequences: RecapConsequenceInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const summary = typeof row.summary === 'string' ? row.summary : '';
    if (!summary.trim()) continue;
    consequences.push({
      id: typeof row.id === 'string' ? row.id : summary.slice(0, 32),
      kind: typeof row.kind === 'string' ? row.kind : 'generic',
      summary,
      visibility: typeof row.visibility === 'string' ? row.visibility : null,
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : null,
    });
  }
  return buildRecapHighlightLines({ consequences, emptyLabelDe });
}

export function nextSessionDefaultName(baseName: string, sessionNumber: number): string {
  const trimmed = baseName.trim() || 'Session';
  const n = Number.isFinite(sessionNumber) && sessionNumber > 0 ? sessionNumber + 1 : 2;
  return `${trimmed} · Folge ${n}`;
}
