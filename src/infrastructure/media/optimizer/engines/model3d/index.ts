/**
 * 3D model optimizer engine stub — explicit unsupported (#628).
 * Location: src/infrastructure/media/optimizer/engines/model3d/index.ts
 *
 * TODO(media-optimizer-v2): evaluate glTF Transform / meshopt under CPU/RAM budgets.
 * V1 must never claim a successful encode or silent pass-through as optimized.
 */

import type {
  MediaOptimizeInputMeta,
  MediaOptimizeResult,
} from '../../../../../domains/media';

export type Model3dEngineRequest = {
  readonly input: MediaOptimizeInputMeta;
  readonly signal?: AbortSignal;
};

export async function optimizeModel3d(
  request: Model3dEngineRequest,
): Promise<MediaOptimizeResult> {
  if (request.signal?.aborted) {
    return {
      status: 'aborted',
      kind: 'model3d',
      profileId: request.input.profileId,
      input: { ...request.input, kind: 'model3d' },
      code: 'aborted',
      message: '3D-Optimierung abgebrochen.',
    };
  }

  return {
    status: 'unsupported',
    kind: 'model3d',
    profileId: request.input.profileId,
    input: { ...request.input, kind: 'model3d' },
    code: 'unsupported-kind',
    message:
      '3D-Optimierung ist in V1 nicht verfügbar (Ausbau-TODO: glTF Transform / meshopt).',
  };
}
