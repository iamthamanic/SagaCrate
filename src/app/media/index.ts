/**
 * media app area — public barrel for preview-first intake (#634).
 * Location: src/app/media/index.ts
 *
 * Other app areas consume intake only via this barrel (no private nested imports).
 */

export { useMediaOptimizeIntake } from './intake/useMediaOptimizeIntake';
export type {
  MediaIntakeSelectOutcome,
  UseMediaOptimizeIntakeConfig,
  UseMediaOptimizeIntakeResult,
} from './intake/useMediaOptimizeIntake';

export type {
  MediaIntakeOptions,
  MediaIntakeReadyPayload,
  MediaIntakeSource,
  MediaIntakeStatus,
} from './intake/intake-types';

export {
  MEDIA_INTAKE_STATUSES,
  MEDIA_INTAKE_STATUS_LABEL_DE,
  isMediaIntakeStatus,
  mediaIntakeCanRetry,
  mediaIntakeIsBusy,
  mediaIntakeStatusLabelDe,
} from './intake/intake-types';
