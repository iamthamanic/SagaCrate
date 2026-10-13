/**
 * shared/carousel — SagaTree center-focus Embla carousel kit (21st/shadcn motion).
 * Location: src/shared/carousel/index.ts
 */
export {
  CENTER_FOCUS_CONTENT_CLASS,
  CENTER_FOCUS_EMBLA_OPTS,
  CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS,
  CENTER_FOCUS_SLIDE_BASIS_CLASS,
} from './centerFocusCarousel.opts';
export {
  centerFocusCarouselCss,
  type CenterFocusVisualMode,
} from './centerFocusCarousel.styles';
export {
  centerFocusSlideRoleClass,
  resolveCenterFocusSlideRole,
  type CenterFocusSlideRole,
} from './centerFocusSlideRole';
export {
  expandSlidesForEmblaLoop,
  type EmblaLoopSlidePack,
} from './expandSlidesForEmblaLoop';
export {
  useCenterFocusCarousel,
  type UseCenterFocusCarouselOptions,
} from './useCenterFocusCarousel';
export {
  useCarouselScrollSync,
  type CarouselScrollPhase,
  type UseCarouselScrollSyncOptions,
} from './useCarouselScrollSync';
