/**
 * centerFocusCarousel.styles — Shared CSS for SagaTree center-focus carousels.
 * `coverflow`: neighbors tuck under the center card (Library EntityBrowser).
 * `focus`: scale + opacity without horizontal tuck (creation pickers).
 * Cross-browser: blur only on overflow-clipped cards (no paint-halo layout bugs).
 * Location: src/shared/carousel/centerFocusCarousel.styles.ts
 */

export type CenterFocusVisualMode = 'coverflow' | 'focus';

/**
 * Scoped CSS for a carousel root. Pass a unique `prefix` (e.g. `entity-browser`, `species`).
 * Markup classes: `{prefix}-carousel-item`, `{prefix}-carousel-card`,
 * `{prefix}-carousel-dots/dot`, `{prefix}-nav-buttons/button`.
 */
export function centerFocusCarouselCss(
  prefix: string,
  mode: CenterFocusVisualMode = 'coverflow',
): string {
  const item = `.${prefix}-carousel-item`;
  const card = `.${prefix}-carousel-card`;
  const dots = `.${prefix}-carousel-dots`;
  const dot = `.${prefix}-carousel-dot`;
  const nav = `.${prefix}-nav-buttons`;
  const navBtn = `.${prefix}-nav-button`;
  const pulseName = `${prefix}-center-glow`;
  const overlayName = `${prefix}-center-glow-overlay`;

  const blueGold = (pct: number) =>
    `color-mix(in srgb, color-mix(in srgb, var(--primary) 78%, #d4a017) ${pct}%, transparent)`;
  const blue = (pct: number) => `color-mix(in srgb, var(--primary) ${pct}%, transparent)`;
  const gold = (pct: number) => `color-mix(in srgb, #d4a017 ${pct}%, transparent)`;

  const pulseKeyframes = `
    @keyframes ${pulseName} {
      0%, 100% {
        border-color: ${blue(48)};
        box-shadow:
          inset 0 0 0 1px ${blue(36)},
          inset 0 0 18px 1px ${blue(14)},
          inset 0 0 28px 2px ${gold(6)};
      }
      50% {
        border-color: ${blueGold(72)};
        box-shadow:
          inset 0 0 0 1px ${blue(55)},
          inset 0 0 24px 3px ${blue(22)},
          inset 0 0 36px 4px ${gold(12)};
      }
    }
    @keyframes ${overlayName} {
      0%, 100% {
        opacity: 0.38;
        box-shadow:
          inset 0 0 0 1px ${blue(48)},
          inset 0 0 22px 2px ${blue(16)},
          inset 0 0 34px 4px ${gold(8)};
      }
      50% {
        opacity: 0.68;
        box-shadow:
          inset 0 0 0 2px ${blue(65)},
          inset 0 0 28px 4px ${blue(24)},
          inset 0 0 40px 6px ${gold(12)};
      }
    }
  `;

  const pulseOnCenter = `
    ${item}.is-center > ${card},
    ${item}.is-center > div {
      position: relative;
      border-radius: var(--radius-xl, 0.75rem);
    }
    ${item}.is-center > ${card}::after,
    ${item}.is-center > div::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 30;
      border-radius: inherit;
      pointer-events: none;
      animation: ${overlayName} 2.8s ease-in-out infinite;
    }
    ${item}.is-center > ${card} [data-slot="card"],
    ${item}.is-center > ${card} > [data-slot="card"],
    ${item}.is-center > div > [data-slot="card"] {
      animation: ${pulseName} 2.8s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      ${item}.is-center > ${card}::after,
      ${item}.is-center > div::after {
        animation: none;
        opacity: 0.5;
        box-shadow:
          inset 0 0 0 1px ${blue(52)},
          inset 0 0 22px 2px ${blue(18)},
          inset 0 0 30px 3px ${gold(8)};
      }
      ${item}.is-center > ${card} [data-slot="card"],
      ${item}.is-center > ${card} > [data-slot="card"],
      ${item}.is-center > div > [data-slot="card"] {
        animation: none;
        border-color: ${blue(55)};
        box-shadow:
          inset 0 0 0 1px ${blue(40)},
          inset 0 0 18px 2px ${gold(8)};
      }
    }
  `;

  // Equal visual gaps: tuck steps are linear (translate = -delta * T) so every
  // adjacent pair keeps the same spacing at every breakpoint (% of own width).
  // Blur sits on the card with overflow:hidden so Safari/Firefox don't paint halos.
  const coverflowBody = `
    ${item} {
      position: relative;
      z-index: 1;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ${item} > ${card} {
      overflow: hidden;
      border-radius: var(--radius-xl, 0.75rem);
      isolation: isolate;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      will-change: transform, filter;
      transition: -webkit-transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        -webkit-filter 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-transform-origin: center center;
      transform-origin: center center;
    }
    ${item}.is-center {
      opacity: 1;
      z-index: 30;
    }
    ${item}.is-center > ${card} {
      -webkit-transform: translate3d(0, 0, 0) scale(1);
      transform: translate3d(0, 0, 0) scale(1);
      -webkit-filter: none;
      filter: none;
    }
    ${item}.is-side-left,
    ${item}.is-side-right {
      opacity: 0.68;
      z-index: 2;
    }
    /* Linear tuck: translate = -delta * 40% of card, for every distance.
       --cf-delta is set per slide (signed circular distance from center), so
       wide viewports with 3+ visible neighbors per side keep equal gaps. */
    ${item}.is-side-left > ${card},
    ${item}.is-side-right > ${card} {
      -webkit-transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.9);
      transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.9);
      -webkit-filter: blur(3px);
      filter: blur(3px);
    }
    ${item}.is-far-left,
    ${item}.is-far-right {
      opacity: 0.42;
      z-index: 1;
    }
    ${item}.is-far-left > ${card},
    ${item}.is-far-right > ${card} {
      -webkit-transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.9);
      transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.9);
      -webkit-filter: blur(5px);
      filter: blur(5px);
    }
    ${item}.is-far {
      opacity: 0.2;
      z-index: 0;
      pointer-events: none;
    }
    ${item}.is-far > ${card} {
      -webkit-transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.86);
      transform: translate3d(calc(var(--cf-delta, 0) * -40%), 0, 0) scale(0.86);
      -webkit-filter: blur(6px);
      filter: blur(6px);
    }
    @media (prefers-reduced-motion: reduce) {
      ${item}:not(.is-center) > ${card} {
        -webkit-filter: none;
        filter: none;
      }
    }
    ${pulseOnCenter}
  `;

  const focusBody = `
    ${item} {
      position: relative;
      z-index: 1;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ${item}:not(.is-center) {
      opacity: 0.62;
    }
    ${item}:not(.is-center) > ${card},
    ${item}:not(.is-center) > div {
      -webkit-transform: translate3d(0, 0, 0) scale(0.92);
      transform: translate3d(0, 0, 0) scale(0.92);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ${item}.is-center {
      opacity: 1;
      z-index: 10;
    }
    ${item}.is-center > ${card},
    ${item}.is-center > div {
      -webkit-transform: translate3d(0, 0, 0) scale(1);
      transform: translate3d(0, 0, 0) scale(1);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ${pulseOnCenter}
  `;

  const chrome = `
    ${dots} {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }
    ${dot} {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary);
      opacity: 0.3;
      transition: opacity 0.3s ease;
      cursor: pointer;
      padding: 0;
      border: 0;
    }
    ${dot}.active {
      opacity: 1;
    }
    ${nav} {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 40;
    }
    ${navBtn} {
      pointer-events: auto;
      position: absolute;
      cursor: pointer;
    }
  `;

  return `${pulseKeyframes}${mode === 'coverflow' ? coverflowBody : focusBody}${chrome}`;
}
