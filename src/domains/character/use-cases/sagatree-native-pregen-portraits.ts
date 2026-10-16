/**
 * sagatree-native-pregen-portraits — Stable public portrait URLs for Dornhain native pregens.
 * Art lives under public/assets/marketplace/dornhain/ (sourced from npc-creature-icon-sources).
 * Location: src/domains/character/use-cases/sagatree-native-pregen-portraits.ts
 */

export const SAGATREE_NATIVE_PREGEN_PORTRAIT_URLS = {
  'pregen.warrior': '/assets/marketplace/dornhain/pregen-warrior.png',
  'pregen.scout': '/assets/marketplace/dornhain/pregen-scout.png',
  'pregen.mystic': '/assets/marketplace/dornhain/pregen-mystic.png',
  'pregen.diplomat': '/assets/marketplace/dornhain/pregen-diplomat.png',
} as const;

export type SagatreeNativePregenId = keyof typeof SAGATREE_NATIVE_PREGEN_PORTRAIT_URLS;

const PREGEN_ID_BY_DISPLAY_NAME: Record<string, SagatreeNativePregenId> = {
  'brenna sturmfaust': 'pregen.warrior',
  'kael schattenpfad': 'pregen.scout',
  'liora mondschein': 'pregen.mystic',
  'oskar federkiel': 'pregen.diplomat',
};

export function isSagatreeNativePregenId(value: string): value is SagatreeNativePregenId {
  return Object.prototype.hasOwnProperty.call(SAGATREE_NATIVE_PREGEN_PORTRAIT_URLS, value);
}

/** Resolve portrait path from attributes.nativeAssetId (e.g. pregen.scout). */
export function sagatreeNativePregenPortraitUrl(pregenId: string): string | null {
  const key = pregenId.trim();
  if (!isSagatreeNativePregenId(key)) return null;
  return SAGATREE_NATIVE_PREGEN_PORTRAIT_URLS[key];
}

/** Resolve native pregen id from character display name (e.g. Liora Mondschein → pregen.mystic). */
export function sagatreeNativePregenIdByName(displayName: string): SagatreeNativePregenId | null {
  const id = PREGEN_ID_BY_DISPLAY_NAME[displayName.trim().toLowerCase()];
  return id ?? null;
}

/** Resolve portrait path from character display name (library/session fallback). */
export function sagatreeNativePregenPortraitUrlByName(displayName: string): string | null {
  const id = sagatreeNativePregenIdByName(displayName);
  return id ? SAGATREE_NATIVE_PREGEN_PORTRAIT_URLS[id] : null;
}

/** True when the display name matches a seeded Dornhain pregen. */
export function isSagatreeNativePregenName(displayName: string): boolean {
  return sagatreeNativePregenIdByName(displayName) != null;
}
