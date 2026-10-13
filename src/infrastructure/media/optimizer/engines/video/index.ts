/**
 * Video optimizer engine stub — explicit unsupported (#628).
 * Location: src/infrastructure/media/optimizer/engines/video/index.ts
 *
 * TODO(media-optimizer-v2): evaluate Mediabunny / container remux under CPU/RAM budgets.
 * V1 must never claim a successful encode.
 */

import type {
  MediaOptimizeInputMeta,
  MediaOptimizeResult,
} from '../../../../../domains/media';

export type VideoEngineRequest = {
  readonly input: MediaOptimizeInputMeta;
  readonly signal?: AbortSignal;
};

export async function optimizeVideo(
  request: VideoEngineRequest,
): Promise<MediaOptimizeResult> {
  if (request.signal?.aborted) {
    return {
      status: 'aborted',
      kind: 'video',
      profileId: request.input.profileId,
      input: { ...request.input, kind: 'video' },
      code: 'aborted',
      message: 'Video-Optimierung abgebrochen.',
    };
  }

  return {
    status: 'unsupported',
    kind: 'video',
    profileId: request.input.profileId,
    input: { ...request.input, kind: 'video' },
    code: 'unsupported-kind',
    message:
      'Video-Transcoding ist in V1 nicht verfügbar (Ausbau-TODO: Mediabunny / geprüfte Runtime).',
  };
}
