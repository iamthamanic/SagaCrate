/**
 * Generation / race helpers for media intake (#634).
 * Location: src/app/media/intake/intake-session.ts
 *
 * Prevents stale optimize/upload completions after replace, abort, or unmount.
 */

import type { MediaIntakeStatus } from './intake-types';
import { mediaIntakeCanRetry } from './intake-types';

export type IntakeGeneration = number;

export function nextGeneration(current: IntakeGeneration): IntakeGeneration {
  return current + 1;
}

export function isCurrentGeneration(
  active: IntakeGeneration,
  candidate: IntakeGeneration,
): boolean {
  return active === candidate;
}

/**
 * Whether a late async completion may apply state for this generation.
 * False after replace/abort/unmount bumped the generation.
 */
export function shouldApplyCompletion(
  active: IntakeGeneration,
  candidate: IntakeGeneration,
  disposed: boolean,
): boolean {
  if (disposed) return false;
  return isCurrentGeneration(active, candidate);
}

/** Status after a successful optimize for the current generation. */
export function statusAfterOptimizeSuccess(): MediaIntakeStatus {
  return 'ready';
}

/** Map optimizer terminal statuses that are not ready into intake status. */
export function statusAfterOptimizeTerminal(
  optimizeStatus: string,
): MediaIntakeStatus {
  if (optimizeStatus === 'aborted') return 'aborted';
  if (
    optimizeStatus === 'failed' ||
    optimizeStatus === 'unsupported' ||
    optimizeStatus === 'over-budget'
  ) {
    return 'failed';
  }
  if (optimizeStatus === 'optimized' || optimizeStatus === 'unchanged') {
    return 'ready';
  }
  return 'failed';
}

export function statusAfterAbort(previous: MediaIntakeStatus): MediaIntakeStatus {
  if (previous === 'complete' || previous === 'idle') return previous;
  return 'aborted';
}

export function assertRetryAllowed(status: MediaIntakeStatus): boolean {
  return mediaIntakeCanRetry(status);
}
