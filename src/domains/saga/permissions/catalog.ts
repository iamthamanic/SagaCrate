/**
 * Saga permission catalog — keys, bundles, pure helpers (#617).
 * Location: src/domains/saga/permissions/catalog.ts
 *
 * Fail-closed: unknown keys never grant. URL/nav never implies permission.
 */

export const SAGA_REVEAL_STATUSES = ['gm_only', 'party', 'unlisted'] as const;
export type SagaRevealStatus = (typeof SAGA_REVEAL_STATUSES)[number];

export const SAGA_ASSET_KINDS = [
  'character',
  'npc',
  'item',
  'quest',
  'map',
  'location',
  'lore',
] as const;
export type SagaAssetKind = (typeof SAGA_ASSET_KINDS)[number];

export const SAGA_PERMISSION_KEYS = [
  'saga.workspace.access',
  'saga.characters.read',
  'saga.characters.create',
  'saga.characters.update_own',
  'saga.characters.update_any',
  'saga.characters.assign',
  'saga.world.read',
  'saga.world.update',
  'saga.npc.read',
  'saga.npc.read_hidden',
  'saga.npc.create',
  'saga.npc.update',
  'saga.npc.delete',
  'saga.items.read',
  'saga.items.read_hidden',
  'saga.items.create',
  'saga.items.update',
  'saga.items.delete',
  'saga.quests.read',
  'saga.quests.read_hidden',
  'saga.quests.create',
  'saga.quests.update',
  'saga.quests.delete',
  'saga.lore.read',
  'saga.lore.read_hidden',
  'saga.secrets.read',
  'saga.secrets.reveal',
  'saga.sessions.create',
  'saga.sessions.join',
  'saga.sessions.lobby.manage',
  'saga.sessions.invite.copy',
  'saga.sessions.live.run',
  'saga.sessions.recap.approve',
  'saga.members.read',
  'saga.members.invite',
  'saga.members.kick',
  'saga.members.set_bundle',
  'saga.settings.read',
  'saga.settings.update',
  'saga.story.read',
  'saga.story.update',
] as const;

export type SagaPermissionKey = (typeof SAGA_PERMISSION_KEYS)[number];

export const SAGA_BUNDLE_IDS = ['bundle.saga.gm', 'bundle.saga.player'] as const;
export type SagaBundleId = (typeof SAGA_BUNDLE_IDS)[number];

/** Player bundle allow-list from design. */
export const SAGA_PLAYER_BUNDLE_KEYS: readonly SagaPermissionKey[] = [
  'saga.workspace.access',
  'saga.characters.read',
  'saga.characters.create',
  'saga.characters.update_own',
  'saga.world.read',
  'saga.npc.read',
  'saga.items.read',
  'saga.quests.read',
  'saga.lore.read',
  'saga.sessions.join',
  'saga.sessions.invite.copy',
  'saga.members.read',
  'saga.settings.read',
  'saga.story.read',
] as const;

const KEY_SET = new Set<string>(SAGA_PERMISSION_KEYS);
const BUNDLE_SET = new Set<string>(SAGA_BUNDLE_IDS);
const REVEAL_SET = new Set<string>(SAGA_REVEAL_STATUSES);

export function isSagaPermissionKey(value: unknown): value is SagaPermissionKey {
  return typeof value === 'string' && KEY_SET.has(value);
}

export function isSagaBundleId(value: unknown): value is SagaBundleId {
  return typeof value === 'string' && BUNDLE_SET.has(value);
}

export function parseSagaRevealStatus(value: unknown): SagaRevealStatus | null {
  if (typeof value !== 'string') return null;
  return REVEAL_SET.has(value) ? (value as SagaRevealStatus) : null;
}

/** Fail-closed permission check against an explicit grant list. */
export function hasSagaPermission(
  grants: readonly string[] | null | undefined,
  key: SagaPermissionKey,
): boolean {
  if (!grants || grants.length === 0) return false;
  return grants.includes(key);
}

/**
 * Whether a binding with the given reveal is listable for the viewer.
 * `unlisted` is never listable (deep-link / GM secrets path only).
 */
export function canListBindingReveal(input: {
  reveal: SagaRevealStatus;
  grants: readonly string[];
  assetKind: SagaAssetKind;
  isProjectGm?: boolean;
}): boolean {
  if (input.isProjectGm) return input.reveal !== 'unlisted';
  if (input.reveal === 'unlisted') return false;

  if (input.reveal === 'gm_only') {
    const hiddenKey = hiddenReadKeyForKind(input.assetKind);
    return (
      hasSagaPermission(input.grants, hiddenKey)
      || hasSagaPermission(input.grants, 'saga.secrets.read')
    );
  }

  const readKey = partyReadKeyForKind(input.assetKind);
  return hasSagaPermission(input.grants, readKey);
}

export function partyReadKeyForKind(kind: SagaAssetKind): SagaPermissionKey {
  switch (kind) {
    case 'character':
      return 'saga.characters.read';
    case 'npc':
      return 'saga.npc.read';
    case 'item':
      return 'saga.items.read';
    case 'quest':
      return 'saga.quests.read';
    case 'map':
    case 'location':
      return 'saga.world.read';
    case 'lore':
      return 'saga.lore.read';
    default:
      return 'saga.workspace.access';
  }
}

export function hiddenReadKeyForKind(kind: SagaAssetKind): SagaPermissionKey {
  switch (kind) {
    case 'npc':
      return 'saga.npc.read_hidden';
    case 'item':
      return 'saga.items.read_hidden';
    case 'quest':
      return 'saga.quests.read_hidden';
    case 'lore':
      return 'saga.lore.read_hidden';
    default:
      return 'saga.secrets.read';
  }
}

export function keysForBundle(bundleId: SagaBundleId): readonly SagaPermissionKey[] {
  if (bundleId === 'bundle.saga.gm') return SAGA_PERMISSION_KEYS;
  return SAGA_PLAYER_BUNDLE_KEYS;
}

export function bundleLabelDe(bundleId: SagaBundleId): string {
  return bundleId === 'bundle.saga.gm' ? 'Gamemaster' : 'Spieler';
}

export function revealLabelDe(reveal: SagaRevealStatus): string {
  switch (reveal) {
    case 'gm_only':
      return 'Nur Gamemaster';
    case 'party':
      return 'Party';
    case 'unlisted':
      return 'Nicht gelistet';
    default:
      return reveal;
  }
}
