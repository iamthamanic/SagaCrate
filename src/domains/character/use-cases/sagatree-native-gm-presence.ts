/**
 * sagatree-native-gm-presence — Default GM presence (Kosmischer Erdgeist).
 * Not a library PC: DB character_type = gm_presence (migration 089).
 * Used for Lobby/Live/Ensemble seat portrait — reduced live feature set.
 * Location: src/domains/character/use-cases/sagatree-native-gm-presence.ts
 */

export const GM_DEFAULT_NATIVE_ASSET_ID = 'gm.earthspirit' as const;

/** Internal / seeded row name (portrait map, DB). */
export const GM_DEFAULT_CHARACTER_NAME = 'Kosmischer Erdgeist';

/** Seat / ensemble display — not an editable PC sheet. */
export const GM_PRESENCE_DISPLAY_NAME = 'Gamemaster';

/** @deprecated Prefer GM_PRESENCE_DISPLAY_NAME */
export const GM_LIBRARY_DISPLAY_NAME = GM_PRESENCE_DISPLAY_NAME;

/** Short label when GM has no PC bound (ensemble character slot). */
export const GM_DEFAULT_CHARACTER_ROLE_LABEL = 'Präsenz';

/** Seeded `characters.class` for the GM presence row. */
export const GM_DEFAULT_CHARACTER_CLASS = 'Weltgeist';

export const GM_DEFAULT_CHARACTER_PORTRAIT_URL =
  '/assets/session/gm-earthspirit.jpg?v=1' as const;

const NAME_ALIASES = new Set([
  GM_DEFAULT_CHARACTER_NAME.toLowerCase(),
  GM_PRESENCE_DISPLAY_NAME.toLowerCase(),
  'erdgeist',
  'kosmischer erdgeist',
]);

export function isGmDefaultNativeAssetId(value: string): boolean {
  return value.trim() === GM_DEFAULT_NATIVE_ASSET_ID;
}

export function isGmDefaultCharacterName(displayName: string): boolean {
  return NAME_ALIASES.has(displayName.trim().toLowerCase());
}

/** True when a roster/summary row is the GM presence (must not appear as playable PC). */
export function isGmPresenceCharacterSummary(char: {
  readonly name: string;
  readonly class?: string | null;
}): boolean {
  if (isGmDefaultCharacterName(char.name)) return true;
  return (char.class ?? '').trim().toLowerCase() === GM_DEFAULT_CHARACTER_CLASS.toLowerCase();
}

/** Stable public portrait for the GM presence seat. */
export function gmDefaultCharacterPortraitUrl(): string {
  return GM_DEFAULT_CHARACTER_PORTRAIT_URL;
}

/**
 * Resolve GM presence portrait when the member is GM without a bound PC,
 * or when the bound/native id matches the Earthspirit presence.
 */
export function resolveGmDefaultPortraitUrl(input: {
  readonly isGamemaster: boolean;
  readonly characterName?: string | null;
  readonly nativeAssetId?: string | null;
}): string | null {
  if (input.nativeAssetId && isGmDefaultNativeAssetId(input.nativeAssetId)) {
    return GM_DEFAULT_CHARACTER_PORTRAIT_URL;
  }
  if (input.characterName && isGmDefaultCharacterName(input.characterName)) {
    return GM_DEFAULT_CHARACTER_PORTRAIT_URL;
  }
  if (input.isGamemaster && !input.characterName?.trim()) {
    return GM_DEFAULT_CHARACTER_PORTRAIT_URL;
  }
  return null;
}
