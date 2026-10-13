/**
 * Image optimizer engine slot — no codec import in this slice (#628).
 * Location: src/infrastructure/media/optimizer/engines/image/index.ts
 *
 * Real WebP pipeline lands in media-opt-order-03 (#630). This module must stay
 * free of jSquash / WASM imports so the facade initial bundle stays codec-free.
 */

import type {
  MediaOptimizeInputMeta,
  MediaOptimizeResult,
} from '../../../../../domains/media';

export type ImageEngineRequest = {
  readonly input: MediaOptimizeInputMeta;
  readonly signal?: AbortSignal;
};

/**
 * Placeholder image engine — interchangeable via the shared MediaOptimizeResult contract.
 * Does not encode; later slice replaces this body without changing the facade dispatch.
 */
export async function optimizeImage(
  request: ImageEngineRequest,
): Promise<MediaOptimizeResult> {
  if (request.signal?.aborted) {
    return {
      status: 'aborted',
      kind: request.input.kind,
      profileId: request.input.profileId,
      input: request.input,
      code: 'aborted',
      message: 'Bildoptimierung abgebrochen.',
    };
  }

  return {
    status: 'failed',
    kind: 'image',
    profileId: request.input.profileId,
    input: { ...request.input, kind: 'image' },
    code: 'encode-failed',
    message:
      'Image-Engine noch nicht verdrahtet (folgt in Media Optimizer 03/13 / WebP-Port).',
  };
}
