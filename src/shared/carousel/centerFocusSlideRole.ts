/**
 * centerFocusSlideRole — Loop-aware neighbor role for cover-flow / focus styling.
 * Location: src/shared/carousel/centerFocusSlideRole.ts
 */

export type CenterFocusSlideRole =
  | 'center'
  | 'side-left'
  | 'side-right'
  | 'far-left'
  | 'far-right'
  | 'far';

/**
 * Relative role of `index` vs `current` with circular distance (for loop carousels).
 * Pair (length === 2): only one neighbor role — circular ±1 is the same slide;
 * prefer side-right so cover-flow never paints the other card on BOTH sides.
 */
export function resolveCenterFocusSlideRole(
  index: number,
  current: number,
  length: number,
): CenterFocusSlideRole {
  if (length <= 0) return 'far';
  if (length === 2) {
    if (index === current) return 'center';
    // One neighbor only (never both sides of the same other card).
    return index < current ? 'side-left' : 'side-right';
  }
  let delta = index - current;
  if (length > 1) {
    delta = ((delta % length) + length) % length;
    if (delta > length / 2) delta -= length;
  }
  if (delta === 0) return 'center';
  if (delta === -1) return 'side-left';
  if (delta === 1) return 'side-right';
  if (delta === -2) return 'far-left';
  if (delta === 2) return 'far-right';
  return 'far';
}

/** Class fragments for a slide role (combine with your item class). */
export function centerFocusSlideRoleClass(role: CenterFocusSlideRole): string {
  if (role === 'center') return 'is-center';
  if (role === 'side-left') return 'is-side-left';
  if (role === 'side-right') return 'is-side-right';
  if (role === 'far-left') return 'is-far-left';
  if (role === 'far-right') return 'is-far-right';
  return 'is-far';
}
