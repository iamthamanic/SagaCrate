/**
 * Image optimizer engine — Scriptony-style WebP budget (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/index.ts
 *
 * `@jsquash/webp` is loaded only inside the encode path (lazy). Facade still
 * dynamic-imports this module so initial facade import stays codec-free until
 * an image optimize runs.
 */

import type { MediaOptimizeResult } from '../../../../../domains/media';
import { runOptimizeImage } from './optimize-image';
import type { ImageEngineRequest } from './types';

export type { ImageEngineRequest } from './types';
export { encodeWebpUnderBudget } from './webp-budget';
export type {
  WebpBudgetParams,
  WebpBudgetResult,
  WebpEncodeFn,
  ScaleImageDataFn,
} from './webp-budget';

export async function optimizeImage(
  request: ImageEngineRequest,
): Promise<MediaOptimizeResult> {
  return runOptimizeImage(request);
}
