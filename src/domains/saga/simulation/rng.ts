/**
 * rng — Deterministic mulberry32 for simulation kernel (#576).
 * Location: src/domains/saga/simulation/rng.ts
 */

export type SeededRng = {
  next: () => number;
  nextInt: (maxExclusive: number) => number;
};

/** Mulberry32 — same seed → same sequence. */
export function createSeededRng(seed: number): SeededRng {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    nextInt: (maxExclusive: number) => {
      if (maxExclusive <= 0) return 0;
      return Math.floor(next() * maxExclusive);
    },
  };
}
