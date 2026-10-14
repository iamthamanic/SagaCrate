/**
 * useCenterFocusCarousel — Browse-mode Embla hook (Library EntityBrowser pattern).
 * Smooth scrollPrev/Next/scrollTo (21st/shadcn), center snap sync, one-shot mount jump,
 * plus scoped cover-flow/focus CSS with soft center-card pulse.
 * For selection-synced pickers use `useCarouselScrollSync` (same Embla opts).
 * Location: src/shared/carousel/useCenterFocusCarousel.ts
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CarouselApi } from '../ui/carousel';
import {
  CENTER_FOCUS_CONTENT_CLASS,
  CENTER_FOCUS_EMBLA_OPTS,
  CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS,
} from './centerFocusCarousel.opts';
import {
  centerFocusCarouselCss,
  type CenterFocusVisualMode,
} from './centerFocusCarousel.styles';
import {
  centerFocusSlideRoleClass,
  resolveCenterFocusSlideDelta,
  resolveCenterFocusSlideRole,
} from './centerFocusSlideRole';
import { cn } from '../ui/utils';

export type UseCenterFocusCarouselOptions = {
  /** Slide count — re-centers when this changes. */
  itemCount: number;
  /** When false, skips mount centering (e.g. list view active). Default true. */
  enabled?: boolean;
  /**
   * CSS class prefix for scoped carousel styles (pulse + cover-flow/focus).
   * Markup uses `{prefix}-carousel-item` and `{prefix}-carousel-card`.
   */
  prefix?: string;
  /** Visual treatment for off-center slides. Default `coverflow`. */
  visualMode?: CenterFocusVisualMode;
  /** Extra Tailwind basis classes for each slide. */
  slideBasisClassName?: string;
  /**
   * Embla loop (clones slides in the engine). Default true (picker kits).
   * Pair lists (N=2) should pass false — Embla loop peeks the other card on
   * BOTH sides and looks like 3 copies. Use `wrap` instead for endless swap.
   */
  loop?: boolean;
  /**
   * When Embla loop is off: Prev on first → last, Next on last → first.
   * Keeps endless navigation without a third visible clone peek.
   */
  wrap?: boolean;
  /**
   * One-shot mount/re-init snap index (e.g. middle clone of first source item
   * so cover-flow has left+right neighbors). Default 0.
   */
  initialSlideIndex?: number;
};

export function useCenterFocusCarousel({
  itemCount,
  enabled = true,
  prefix = 'center-focus',
  visualMode = 'coverflow',
  slideBasisClassName = CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS,
  loop = true,
  wrap = false,
  initialSlideIndex = 0,
}: UseCenterFocusCarouselOptions) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const didCenterRef = useRef(false);
  const itemCountRef = useRef(itemCount);
  const initialSlideIndexRef = useRef(initialSlideIndex);
  initialSlideIndexRef.current = initialSlideIndex;

  // Rebuild each render so HMR picks up style tweaks (string template is cheap).
  const carouselCss = centerFocusCarouselCss(prefix, visualMode);

  const itemBaseClass = `${prefix}-carousel-item`;
  const cardClass = `${prefix}-carousel-card`;
  const dotsClass = `${prefix}-carousel-dots`;
  const dotClass = `${prefix}-carousel-dot`;
  const navClass = `${prefix}-nav-buttons`;
  const navButtonClass = `${prefix}-nav-button`;

  useEffect(() => {
    if (!enabled) {
      setCurrent(0);
      didCenterRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!api) return;
    const syncIndex = () => setCurrent(api.selectedScrollSnap());
    syncIndex();
    api.on('select', syncIndex);
    api.on('reInit', syncIndex);
    return () => {
      api.off('select', syncIndex);
      api.off('reInit', syncIndex);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !enabled || itemCount === 0) return;
    if (itemCountRef.current !== itemCount) {
      itemCountRef.current = itemCount;
      didCenterRef.current = false;
    }
    if (didCenterRef.current) return;
    didCenterRef.current = true;
    const target = Math.max(
      0,
      Math.min(itemCount - 1, initialSlideIndexRef.current),
    );
    api.scrollTo(target, true);
    setCurrent(target);
  }, [api, enabled, itemCount, initialSlideIndex]);

  const scrollPrev = useCallback(() => {
    if (!api) return;
    if (wrap && !loop && !api.canScrollPrev()) {
      api.scrollTo(Math.max(0, itemCount - 1));
      return;
    }
    api.scrollPrev();
  }, [api, wrap, loop, itemCount]);

  const scrollNext = useCallback(() => {
    if (!api) return;
    if (wrap && !loop && !api.canScrollNext()) {
      api.scrollTo(0);
      return;
    }
    api.scrollNext();
  }, [api, wrap, loop]);

  const scrollToIndex = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const handleCardClick = useCallback(
    (index: number, onCenterActivate?: () => void) => {
      if (index === current) {
        onCenterActivate?.();
        return;
      }
      api?.scrollTo(index);
    },
    [api, current],
  );

  const getItemClassName = useCallback(
    (index: number, extraClassName?: string) => {
      const role = resolveCenterFocusSlideRole(index, current, itemCount);
      return cn(
        itemBaseClass,
        slideBasisClassName,
        centerFocusSlideRoleClass(role),
        extraClassName,
      );
    },
    [current, itemBaseClass, itemCount, slideBasisClassName],
  );

  /** Coverflow tuck distance: `--cf-delta` drives a linear translate so wide viewports keep equal gaps. */
  const getItemStyle = useCallback(
    (index: number): CSSProperties =>
      ({
        '--cf-delta': resolveCenterFocusSlideDelta(index, current, itemCount),
      }) as CSSProperties,
    [current, itemCount],
  );

  const getCardClassName = useCallback(
    (extraClassName?: string) => cn(cardClass, 'w-full', extraClassName),
    [cardClass],
  );

  const getDotClassName = useCallback(
    (index: number) => cn(dotClass, index === current && 'active'),
    [current, dotClass],
  );

  return {
    api,
    setApi,
    current,
    scrollPrev,
    scrollNext,
    scrollToIndex,
    handleCardClick,
    /** Inject once near the carousel root: `<style>{carouselCss}</style>` */
    carouselCss,
    emblaOpts: loop ? CENTER_FOCUS_EMBLA_OPTS : { ...CENTER_FOCUS_EMBLA_OPTS, loop: false },
    contentClassName: CENTER_FOCUS_CONTENT_CLASS,
    itemBaseClass,
    cardClass,
    dotsClass,
    dotClass,
    navClass,
    navButtonClass,
    getItemClassName,
    getItemStyle,
    getCardClassName,
    getDotClassName,
  };
}
