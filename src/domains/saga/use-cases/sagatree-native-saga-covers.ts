/**
 * sagatree-native-saga-covers — Stable public cover URLs for native Saga definitions.
 * Art lives under public/assets/marketplace/dornhain/ (Bibliothek Sagas carousel/list).
 * Location: src/domains/saga/use-cases/sagatree-native-saga-covers.ts
 */

export const SAGATREE_NATIVE_SAGA_COVER_URLS = {
  // v2: Netflix-style title treatment baked into art (Das Flüstern unter Dornhain)
  'dornhain.whisper': '/assets/marketplace/dornhain/saga-cover.png?v=2',
} as const;

export type SagatreeNativeSagaSlug = keyof typeof SAGATREE_NATIVE_SAGA_COVER_URLS;

const COVER_BY_TITLE: Record<string, SagatreeNativeSagaSlug> = {
  'das flüstern unter dornhain': 'dornhain.whisper',
};

export function isSagatreeNativeSagaSlug(value: string): value is SagatreeNativeSagaSlug {
  return Object.prototype.hasOwnProperty.call(SAGATREE_NATIVE_SAGA_COVER_URLS, value);
}

/** Resolve cover path from saga_definitions.slug (e.g. dornhain.whisper). */
export function sagatreeNativeSagaCoverUrl(slug: string): string | null {
  const key = slug.trim();
  if (!isSagatreeNativeSagaSlug(key)) return null;
  return SAGATREE_NATIVE_SAGA_COVER_URLS[key];
}

/** Resolve cover from display title when slug is unavailable. */
export function sagatreeNativeSagaCoverUrlByTitle(title: string): string | null {
  const slug = COVER_BY_TITLE[title.trim().toLowerCase()];
  return slug ? SAGATREE_NATIVE_SAGA_COVER_URLS[slug] : null;
}
