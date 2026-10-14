/**
 * centerFocusCarousel.opts — Canonical Embla options for SagaTree center-focus carousels.
 * Loop + center align; containScroll false so every slide can reach true center.
 * Library: 1 exact; 2 = wrap without Embla clones; ≥3 minimal expand + Embla loop.
 * Location: src/shared/carousel/centerFocusCarousel.opts.ts
 */

/**
 * Embla uses native pointer listeners (before React stopPropagation).
 * Ignore drag when the gesture starts on buttons/menus/links so Dropdowns open.
 */
export function emblaWatchDragIgnoreInteractive(
  _api: unknown,
  event: Event,
): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return true;
  return !target.closest(
    'button, a, input, textarea, select, [role="button"], [data-entity-browser-corner-action], [data-library-saga-menu]',
  );
}

/** Shared Embla opts — use on every SagaTree Carousel for consistent motion. */
export const CENTER_FOCUS_EMBLA_OPTS = {
  align: 'center' as const,
  loop: true,
  skipSnaps: false,
  dragFree: false,
  containScroll: false as const,
  duration: 28,
  watchDrag: emblaWatchDragIgnoreInteractive,
  watchResize: true,
  watchSlides: true,
};

/** Content gutter matching tight slide padding (overrides shadcn -ml-4). */
export const CENTER_FOCUS_CONTENT_CLASS = '-ml-0';

/** Default responsive slide basis (creation pickers). */
export const CENTER_FOCUS_SLIDE_BASIS_CLASS =
  'basis-[64%] pl-0 sm:basis-[52%] md:basis-[40%] lg:basis-[34%]';

/**
 * Library EntityBrowser cover-flow slide basis.
 * Width follows the available main-pane width (`@container` on EntityBrowser):
 * ~42% of the pane, clamped to 13.5–17rem — wide enough for actions, narrow enough
 * for portrait cards. Tuck offsets are % of own width, so spacing stays equal.
 */
export const CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS =
  'basis-[clamp(13.5rem,42cqw,17rem)] pl-0';
