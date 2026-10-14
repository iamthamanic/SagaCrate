/**
 * sagatree-native-world-covers — Stable public cover URLs for native world profiles.
 * Art lives under public/assets/marketplace/dornhain/ (Bibliothek Welten list/carousel).
 * Location: src/domains/world/use-cases/sagatree-native-world-covers.ts
 */

import type { WorldModuleConfigMap } from '../contracts/world.types';

export const SAGATREE_NATIVE_WORLD_COVER_URLS = {
  // Netflix-style title treatment: "Dornhain" baked into map/village key art
  'dornhain.whisper': '/assets/marketplace/dornhain/world-cover.png?v=2',
} as const;

export type SagatreeNativeWorldSagaSlug = keyof typeof SAGATREE_NATIVE_WORLD_COVER_URLS;

const COVER_BY_NAME: Record<string, SagatreeNativeWorldSagaSlug> = {
  dornhain: 'dornhain.whisper',
};

function isNativeWorldSagaSlug(value: string): value is SagatreeNativeWorldSagaSlug {
  return Object.prototype.hasOwnProperty.call(SAGATREE_NATIVE_WORLD_COVER_URLS, value);
}

/** Resolve cover from world_profiles.modules (origin + sagaSlug from Dornhain seed). */
export function sagatreeNativeWorldCoverUrlFromModules(
  modules: WorldModuleConfigMap | Record<string, unknown> | null | undefined,
): string | null {
  if (!modules || typeof modules !== 'object') return null;
  const record = modules as Record<string, unknown>;
  // Seed stores flat markers: { origin: 'native', sagaSlug: 'dornhain.whisper' }
  if (record.origin !== 'native') return null;
  const sagaSlug = record.sagaSlug;
  if (typeof sagaSlug !== 'string' || !isNativeWorldSagaSlug(sagaSlug)) return null;
  return SAGATREE_NATIVE_WORLD_COVER_URLS[sagaSlug];
}

/** Resolve cover from display name when modules marker is unavailable. */
export function sagatreeNativeWorldCoverUrlByName(name: string): string | null {
  const slug = COVER_BY_NAME[name.trim().toLowerCase()];
  return slug ? SAGATREE_NATIVE_WORLD_COVER_URLS[slug] : null;
}
