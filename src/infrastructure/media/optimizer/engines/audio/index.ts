/**
 * Audio optimizer engine stub — explicit unsupported (#628).
 * Location: src/infrastructure/media/optimizer/engines/audio/index.ts
 *
 * TODO(media-optimizer-v2): evaluate Opus/AAC pipeline under self-host budgets.
 * V1 must never claim a successful encode.
 */

import type {
  MediaOptimizeInputMeta,
  MediaOptimizeResult,
} from '../../../../../domains/media';

export type AudioEngineRequest = {
  readonly input: MediaOptimizeInputMeta;
  readonly signal?: AbortSignal;
};

export async function optimizeAudio(
  request: AudioEngineRequest,
): Promise<MediaOptimizeResult> {
  if (request.signal?.aborted) {
    return {
      status: 'aborted',
      kind: 'audio',
      profileId: request.input.profileId,
      input: { ...request.input, kind: 'audio' },
      code: 'aborted',
      message: 'Audio-Optimierung abgebrochen.',
    };
  }

  return {
    status: 'unsupported',
    kind: 'audio',
    profileId: request.input.profileId,
    input: { ...request.input, kind: 'audio' },
    code: 'unsupported-kind',
    message:
      'Audio-Transcoding ist in V1 nicht verfügbar (Ausbau-TODO: geprüfte Codec-Pipeline).',
  };
}
