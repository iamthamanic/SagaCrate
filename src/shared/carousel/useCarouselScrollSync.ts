/**
 * useCarouselScrollSync — Selection-synced Embla hook for creation/progression pickers.
 * Same center-focus Embla motion as useCenterFocusCarousel (incl. soft center pulse CSS);
 * adds external selection sync, skipSelect guard, optional scroll-phase debounce for connectors.
 * Location: src/shared/carousel/useCarouselScrollSync.ts
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CarouselApi } from '../ui/carousel';
import {
  CENTER_FOCUS_CONTENT_CLASS,
  CENTER_FOCUS_EMBLA_OPTS,
  CENTER_FOCUS_SLIDE_BASIS_CLASS,
} from './centerFocusCarousel.opts';
import {
  centerFocusCarouselCss,
  type CenterFocusVisualMode,
} from './centerFocusCarousel.styles';
import {
  centerFocusSlideRoleClass,
  resolveCenterFocusSlideRole,
} from './centerFocusSlideRole';
import { cn } from '../ui/utils';

export type CarouselScrollPhase = 'scrolling' | 'settled';

const SCROLL_SETTLE_MS = 120;

export interface UseCarouselScrollSyncOptions<TValue> {
  /** Number of carousel slides (stable count). */
  optionsLength: number;
  /** Resolve external selection to slide index; return -1 when not found. */
  getSelectedIndex: () => number;
  /** Read the value emitted for a slide index. */
  getValueAtIndex: (index: number) => TValue | undefined;
  /** True while no external selection exists yet (auto-select centered slide on mount). */
  isSelectionUnset: () => boolean;
  /** Gate programmatic scrollTo when external selection changes. */
  shouldSyncScrollToSelection: () => boolean;
  /** External selection identity — re-runs scroll sync when this changes. */
  selectionSyncKey: unknown;
  /** Whether a user-driven select at index should call onSelect. */
  shouldEmitSelect: (index: number, value: TValue) => boolean;
  onSelect: (value: TValue) => void;
  /** Connector overlays: freeze geometry while scrolling, remeasure on settled. */
  onScrollPhaseChange?: (phase: CarouselScrollPhase) => void;
  /** BackgroundCarousel: center click confirms; ArchetypeCarousel: center click is no-op. */
  selectOnCenterClick?: boolean;
  /**
   * CSS class prefix for scoped carousel styles (pulse + focus/coverflow).
   * Markup uses `{prefix}-carousel-item` and `{prefix}-carousel-card`.
   */
  prefix?: string;
  /** Visual treatment for off-center slides. Default `focus` (creation pickers). */
  visualMode?: CenterFocusVisualMode;
  /** Extra Tailwind basis classes for each slide. */
  slideBasisClassName?: string;
}

export function useCarouselScrollSync<TValue>({
  optionsLength,
  getSelectedIndex,
  getValueAtIndex,
  isSelectionUnset,
  shouldSyncScrollToSelection,
  selectionSyncKey,
  shouldEmitSelect,
  onSelect,
  onScrollPhaseChange,
  selectOnCenterClick = false,
  prefix = 'center-focus',
  visualMode = 'focus',
  slideBasisClassName = CENTER_FOCUS_SLIDE_BASIS_CLASS,
}: UseCarouselScrollSyncOptions<TValue>) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const skipSelectRef = useRef(false);

  const getSelectedIndexRef = useRef(getSelectedIndex);
  const getValueAtIndexRef = useRef(getValueAtIndex);
  const isSelectionUnsetRef = useRef(isSelectionUnset);
  const shouldSyncScrollRef = useRef(shouldSyncScrollToSelection);
  const shouldEmitSelectRef = useRef(shouldEmitSelect);
  const onSelectRef = useRef(onSelect);
  const onScrollPhaseChangeRef = useRef(onScrollPhaseChange);

  getSelectedIndexRef.current = getSelectedIndex;
  getValueAtIndexRef.current = getValueAtIndex;
  isSelectionUnsetRef.current = isSelectionUnset;
  shouldSyncScrollRef.current = shouldSyncScrollToSelection;
  shouldEmitSelectRef.current = shouldEmitSelect;
  onSelectRef.current = onSelect;
  onScrollPhaseChangeRef.current = onScrollPhaseChange;

  // Rebuild each render so HMR picks up shared coverflow/focus style tweaks.
  const carouselCss = centerFocusCarouselCss(prefix, visualMode);
  const itemBaseClass = `${prefix}-carousel-item`;
  const cardClass = `${prefix}-carousel-card`;
  const dotsClass = `${prefix}-carousel-dots`;
  const dotClass = `${prefix}-carousel-dot`;
  const navClass = `${prefix}-nav-buttons`;
  const navButtonClass = `${prefix}-nav-button`;

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
    if (!api || !onScrollPhaseChangeRef.current) return;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    const onScrolling = () => {
      if (quietTimer) clearTimeout(quietTimer);
      onScrollPhaseChangeRef.current?.('scrolling');
    };
    const onScrollActivity = () => {
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(() => onScrollPhaseChangeRef.current?.('settled'), SCROLL_SETTLE_MS);
    };
    api.on('select', onScrolling);
    api.on('scroll', onScrollActivity);
    return () => {
      api.off('select', onScrolling);
      api.off('scroll', onScrollActivity);
      if (quietTimer) clearTimeout(quietTimer);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !isSelectionUnsetRef.current()) return;
    const value = getValueAtIndexRef.current(api.selectedScrollSnap());
    if (value !== undefined) onSelectRef.current(value);
  }, [api, optionsLength]);

  useEffect(() => {
    if (!api || !shouldSyncScrollRef.current()) return;
    const index = getSelectedIndexRef.current();
    if (index < 0 || index === api.selectedScrollSnap()) return;
    skipSelectRef.current = true;
    api.scrollTo(index);
  }, [api, optionsLength, selectionSyncKey]);

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => {
      if (skipSelectRef.current) {
        skipSelectRef.current = false;
        return;
      }
      const index = api.selectedScrollSnap();
      const value = getValueAtIndexRef.current(index);
      if (value === undefined) return;
      if (shouldEmitSelectRef.current(index, value)) onSelectRef.current(value);
    };
    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
    };
  }, [api, optionsLength]);

  const handleCardClick = useCallback((index: number) => {
    if (index === current) {
      if (!selectOnCenterClick) return;
      const value = getValueAtIndexRef.current(index);
      if (value !== undefined && shouldEmitSelectRef.current(index, value)) {
        onSelectRef.current(value);
      }
      return;
    }
    api?.scrollTo(index);
  }, [api, current, selectOnCenterClick]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollToIndex = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const getItemClassName = useCallback(
    (index: number, extraClassName?: string) => {
      if (visualMode === 'coverflow') {
        const role = resolveCenterFocusSlideRole(index, current, optionsLength);
        return cn(
          itemBaseClass,
          slideBasisClassName,
          centerFocusSlideRoleClass(role),
          extraClassName,
        );
      }
      return cn(
        itemBaseClass,
        slideBasisClassName,
        index === current && 'is-center',
        extraClassName,
      );
    },
    [current, itemBaseClass, optionsLength, slideBasisClassName, visualMode],
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
    handleCardClick,
    scrollPrev,
    scrollNext,
    scrollToIndex,
    /** Inject once near the carousel root: `<style>{carouselCss}</style>` */
    carouselCss,
    emblaOpts: CENTER_FOCUS_EMBLA_OPTS,
    contentClassName: CENTER_FOCUS_CONTENT_CLASS,
    itemBaseClass,
    cardClass,
    dotsClass,
    dotClass,
    navClass,
    navButtonClass,
    getItemClassName,
    getCardClassName,
    getDotClassName,
  };
}
