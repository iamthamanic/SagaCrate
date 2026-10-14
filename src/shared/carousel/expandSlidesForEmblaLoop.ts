/**
 * expandSlidesForEmblaLoop — Embla disables `loop` when total slide width ≤ viewport.
 * Pad with the fewest full item cycles needed — never invent a long fake shelf.
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

/**
 * Library EntityBrowser slide basis is ~42cqw (`CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS`).
 * Embla loop needs scrollWidth > viewport → ceil(1/0.42)+1 ≈ 4 slides is enough.
 * Old default of 10 made 2 sagas look like a long fake stack.
 */
export const EMBLA_LOOP_MIN_SLIDES_LIBRARY = 4;

/**
 * Expand `items` for Embla loop with minimal padding.
 * - 0–1 items: unchanged (nothing to loop)
 * - Already enough real slides (≥ minSlides): unchanged
 * - Otherwise: repeat full cycles until ≥ minSlides (e.g. 2→4 = A,B,A,B)
 */
export function expandSlidesForEmblaLoop<T>(
  items: readonly T[],
  minSlides: number = EMBLA_LOOP_MIN_SLIDES_LIBRARY,
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

  const target = Math.max(minSlides, sourceCount);
  const slides: T[] = [];
  if (sourceCount >= target) {
    slides.push(...items);
  } else {
    while (slides.length < target) {
      for (const item of items) {
        slides.push(item);
        if (slides.length >= target) break;
      }
    }
  }

  const toSourceIndex = (slideIndex: number) =>
    ((slideIndex % sourceCount) + sourceCount) % sourceCount;

  const nearestSlideIndex = (sourceIndex: number, fromSlideIndex: number) => {
    const targetSource = ((sourceIndex % sourceCount) + sourceCount) % sourceCount;
    let best = targetSource;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < slides.length; i += 1) {
      if (toSourceIndex(i) !== targetSource) continue;
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
