/**
 * saga-definition — Story definition + version contracts (#574).
 * Location: src/domains/saga/contracts/saga-definition.ts
 *
 * Pure domain: parse + audience project. No React / Supabase.
 */

export type SagaDefinitionOrigin = 'native' | 'user' | 'private_backfill';

export type SagaKnowledgeFact = {
  readonly id: string;
  readonly visibility: string;
  readonly summary: string;
};

export type SagaDefinitionPayload = {
  readonly packageId: string | null;
  readonly title: string;
  readonly synopsis: string;
  readonly knowledgeFacts: readonly SagaKnowledgeFact[];
  readonly locations: readonly { readonly id: string; readonly label: string }[];
};

export type SagaDefinitionVersionVm = {
  readonly sagaId: string;
  readonly sagaSlug: string;
  readonly title: string;
  readonly synopsis: string;
  readonly origin: SagaDefinitionOrigin;
  readonly versionId: string;
  readonly versionLabel: string;
  readonly status: string;
  readonly payload: SagaDefinitionPayload;
  readonly isGmProjection: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Strip gm_only knowledge facts for non-GM audiences. */
export function projectSagaDefinitionPayload(
  payload: SagaDefinitionPayload,
  isGm: boolean,
): SagaDefinitionPayload {
  if (isGm) return payload;
  return {
    ...payload,
    knowledgeFacts: payload.knowledgeFacts.filter((f) => {
      const vis = f.visibility.trim().toLowerCase();
      return vis === 'public' || vis === 'discovered' || vis === 'shared';
    }),
  };
}

export function parseSagaDefinitionPayload(raw: unknown): SagaDefinitionPayload {
  const rec = isRecord(raw) ? raw : {};
  const facts: SagaKnowledgeFact[] = [];
  if (Array.isArray(rec.knowledgeFacts)) {
    for (const item of rec.knowledgeFacts) {
      if (!isRecord(item)) continue;
      const id = asString(item.id);
      const summary = asString(item.summary);
      if (!id) continue;
      facts.push({
        id,
        visibility: asString(item.visibility, 'gm_only'),
        summary,
      });
    }
  }
  const locations: { id: string; label: string }[] = [];
  if (Array.isArray(rec.locations)) {
    for (const item of rec.locations) {
      if (!isRecord(item)) continue;
      const id = asString(item.id);
      if (!id) continue;
      locations.push({ id, label: asString(item.label, id) });
    }
  }
  return {
    packageId: typeof rec.packageId === 'string' ? rec.packageId : null,
    title: asString(rec.title, ''),
    synopsis: asString(rec.synopsis, ''),
    knowledgeFacts: facts,
    locations,
  };
}

export function parseSagaDefinitionVersion(raw: unknown): SagaDefinitionVersionVm {
  if (!isRecord(raw)) throw new Error('Ungültige Saga-Definition');
  const sagaId = asString(raw.sagaId);
  const versionId = asString(raw.versionId);
  if (!sagaId || !versionId) throw new Error('Saga-Definition unvollständig');
  const originRaw = asString(raw.origin, 'user');
  const origin: SagaDefinitionOrigin =
    originRaw === 'native' || originRaw === 'private_backfill' || originRaw === 'user'
      ? originRaw
      : 'user';
  return {
    sagaId,
    sagaSlug: asString(raw.sagaSlug),
    title: asString(raw.title),
    synopsis: asString(raw.synopsis),
    origin,
    versionId,
    versionLabel: asString(raw.versionLabel, 'v1'),
    status: asString(raw.status, 'published'),
    payload: parseSagaDefinitionPayload(raw.payload),
    isGmProjection: raw.isGmProjection === true,
  };
}

/** Group playthroughs (projects) by story definition id. */
export function groupProjectsBySagaDefinition<T extends { sagaId: string | null; id: string }>(
  projects: readonly T[],
): readonly { sagaId: string | null; runs: readonly T[] }[] {
  const map = new Map<string, T[]>();
  const orphans: T[] = [];
  for (const p of projects) {
    if (!p.sagaId) {
      orphans.push(p);
      continue;
    }
    const list = map.get(p.sagaId) ?? [];
    list.push(p);
    map.set(p.sagaId, list);
  }
  const groups: { sagaId: string | null; runs: readonly T[] }[] = [];
  for (const [sagaId, runs] of map) {
    groups.push({ sagaId, runs });
  }
  for (const o of orphans) {
    groups.push({ sagaId: null, runs: [o] });
  }
  return groups;
}
