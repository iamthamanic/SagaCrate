/**
 * centerFocusCarousel.opts — Canonical Embla options for SagaTree center-focus carousels.
 * Loop + center align; containScroll false so every slide can reach true center.
 * Note: Embla disables loop when total slide width ≤ viewport — use
 * `expandSlidesForEmblaLoop` for short lists (Library).
 * Location: src/shared/carousel/centerFocusCarousel.opts.ts
 */

/** Shared Embla opts — use on every SagaTree Carousel for consistent motion. */
export const CENTER_FOCUS_EMBLA_OPTS = {
  align: 'center' as const,
  loop: true,
  skipSnaps: false,
  dragFree: false,
  containScroll: false as const,
  duration: 28,
  watchDrag: true,
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
 * Fixed rem slots (same at every breakpoint step) + pl-0; equal tuck is CSS-linear.
 */
export const CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS =
  'basis-[10rem] pl-0 sm:basis-[10.5rem] md:basis-[11rem] lg:basis-[11.5rem]';
