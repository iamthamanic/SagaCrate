/**
 * libraryNativeBadge — shared „SagaTree Native“ chip for first-party Library rows.
 * Location: src/app/library/libraryNativeBadge.ts
 */
import type { EntityBrowserChip } from './EntityBrowserCard';

export const SAGATREE_NATIVE_BADGE_LABEL = 'SagaTree Native';

export const SAGATREE_NATIVE_CHIP: EntityBrowserChip = {
  label: SAGATREE_NATIVE_BADGE_LABEL,
  tone: 'native',
};

/** Tailwind classes matching EntityBrowserChip tone `native` (for non-EntityBrowser badges). */
export const SAGATREE_NATIVE_BADGE_CLASS =
  'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300';
