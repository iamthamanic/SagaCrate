/**
 * Lore / Verlauf timeline parse (#617).
 * Location: src/domains/saga/permissions/lore-timeline.ts
 */

export type SagaLoreEntryKind = 'recap' | 'knowledge' | 'lore_binding';

export type SagaLoreTimelineEntry = {
  readonly id: string;
  readonly kind: SagaLoreEntryKind;
  readonly title: string;
  readonly summary: string;
  readonly visibility: string;
  readonly occurredAt: string | null;
};

export type SagaLoreTimelineVm = {
  readonly projectId: string;
  readonly canReadHidden: boolean;
  readonly entries: readonly SagaLoreTimelineEntry[];
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBool(value: unknown): boolean {
  return value === true;
}

const KINDS = new Set<string>(['recap', 'knowledge', 'lore_binding']);

export function parseSagaLoreTimeline(raw: unknown): SagaLoreTimelineVm {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Lore-Timeline Antwort ungültig');
  }
  const row = raw as Record<string, unknown>;
  const projectId = asString(row.projectId);
  if (!projectId) {
    throw new Error('Lore-Timeline ohne projectId');
  }
  const entriesRaw = Array.isArray(row.entries) ? row.entries : [];
  const entries: SagaLoreTimelineEntry[] = [];
  for (const item of entriesRaw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const kindRaw = asString(e.kind);
    if (!KINDS.has(kindRaw)) continue;
    const id = asString(e.id);
    if (!id) continue;
    entries.push({
      id,
      kind: kindRaw as SagaLoreEntryKind,
      title: asString(e.title, 'Eintrag'),
      summary: asString(e.summary),
      visibility: asString(e.visibility, 'gm_only'),
      occurredAt: typeof e.occurredAt === 'string' ? e.occurredAt : null,
    });
  }
  return {
    projectId,
    canReadHidden: asBool(row.canReadHidden),
    entries,
  };
}
