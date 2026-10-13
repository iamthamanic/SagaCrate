/**
 * expandSlidesForEmblaLoop — Embla disables `loop` when total slide width ≤ viewport.
 * Duplicate source items until we have enough slides for reliable endless scroll.
 * Location: src/shared/carousel/expandSlidesForEmblaLoop.ts
 */

export type EmblaLoopSlidePack<T> = {
  slides: T[];
  sourceCount: number;
  /** Map Embla snap index → original item index. */
  toSourceIndex: (slideIndex: number) => number;
  /**
   * Prefer the clone of `sourceIndex` nearest to `fromSlideIndex`
   * so scrollTo stays short (important with duplicated slides).
   */
  nearestSlideIndex: (sourceIndex: number, fromSlideIndex: number) => number;
};

/** Enough copies that total slide width exceeds typical desktop viewports. */
const DEFAULT_MIN_SLIDES = 10;

/**
 * Expand `items` for Embla loop. Single-item lists are left as-is (nothing to loop).
 */
export function expandSlidesForEmblaLoop<T>(
  items: readonly T[],
  minSlides: number = DEFAULT_MIN_SLIDES,
): EmblaLoopSlidePack<T> {
  const sourceCount = items.length;
  if (sourceCount <= 1) {
    return {
      slides: [...items],
      sourceCount,
      toSourceIndex: (slideIndex) => slideIndex,
      nearestSlideIndex: (sourceIndex) => sourceIndex,
    };
  }

  const slides: T[] = [];
  while (slides.length < Math.max(minSlides, sourceCount)) {
    for (const item of items) {
      slides.push(item);
    }
  }

  const toSourceIndex = (slideIndex: number) =>
    ((slideIndex % sourceCount) + sourceCount) % sourceCount;

  const nearestSlideIndex = (sourceIndex: number, fromSlideIndex: number) => {
    const target = ((sourceIndex % sourceCount) + sourceCount) % sourceCount;
    let best = target;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < slides.length; i += 1) {
      if (toSourceIndex(i) !== target) continue;
      const dist = Math.abs(i - fromSlideIndex);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  return { slides, sourceCount, toSourceIndex, nearestSlideIndex };
}
