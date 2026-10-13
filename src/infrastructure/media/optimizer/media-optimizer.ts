/**
 * Media optimizer facade — deterministic kind dispatch (#628).
 * Location: src/infrastructure/media/optimizer/media-optimizer.ts
 *
 * Engines are loaded lazily per kind so importing this facade never pulls codecs.
 * AuthZ / MIME / magic-byte / RLS stay in existing upload services.
 */

import type {
  AssetProfileId,
  MediaKind,
  MediaOptimizeInputMeta,
  MediaOptimizeResult,
} from '../../../domains/media';
import {
  assertMediaOptimizeResultInvariants,
  isMediaKind,
} from '../../../domains/media';

export type OptimizeMediaRequest = {
  readonly kind: MediaKind;
  readonly profileId: AssetProfileId;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly width?: number;
  readonly height?: number;
  readonly hasAnimation?: boolean;
  readonly hasAlpha?: boolean;
  readonly signal?: AbortSignal;
};

function toInputMeta(request: OptimizeMediaRequest): MediaOptimizeInputMeta {
  return {
    kind: request.kind,
    profileId: request.profileId,
    mimeType: request.mimeType,
    byteSize: request.byteSize,
    width: request.width,
    height: request.height,
    hasAnimation: request.hasAnimation,
    hasAlpha: request.hasAlpha,
  };
}

/**
 * Dispatch to the engine for `request.kind`. Never fabricates `optimized`/`unchanged`
 * for stub engines.
 */
export async function optimizeMedia(
  request: OptimizeMediaRequest,
): Promise<MediaOptimizeResult> {
  if (!isMediaKind(request.kind)) {
    const input = toInputMeta({ ...request, kind: 'image' });
    return {
      status: 'unsupported',
      kind: 'image',
      profileId: request.profileId,
      input,
      code: 'unsupported-kind',
      message: `Unbekannte MediaKind: ${String(request.kind)}`,
    };
  }

  if (request.signal?.aborted) {
    const input = toInputMeta(request);
    return {
      status: 'aborted',
      kind: request.kind,
      profileId: request.profileId,
      input,
      code: 'aborted',
      message: 'Media-Optimierung abgebrochen.',
    };
  }

  const input = toInputMeta(request);
  let result: MediaOptimizeResult;

  switch (request.kind) {
    case 'image': {
      const { optimizeImage } = await import('./engines/image/index');
      result = await optimizeImage({ input, signal: request.signal });
      break;
    }
    case 'video': {
      const { optimizeVideo } = await import('./engines/video/index');
      result = await optimizeVideo({ input, signal: request.signal });
      break;
    }
    case 'audio': {
      const { optimizeAudio } = await import('./engines/audio/index');
      result = await optimizeAudio({ input, signal: request.signal });
      break;
    }
    case 'model3d': {
      const { optimizeModel3d } = await import('./engines/model3d/index');
      result = await optimizeModel3d({ input, signal: request.signal });
      break;
    }
    default: {
      const _exhaustive: never = request.kind;
      result = {
        status: 'unsupported',
        kind: 'image',
        profileId: request.profileId,
        input,
        code: 'unsupported-kind',
        message: `Unbehandelte MediaKind: ${String(_exhaustive)}`,
      };
    }
  }

  const invariants = assertMediaOptimizeResultInvariants(result);
  if (invariants.ok === false) {
    return {
      status: 'failed',
      kind: request.kind,
      profileId: request.profileId,
      input,
      code: 'invalid-input',
      message: `Optimizer-Ergebnis verletzt Invarianten: ${invariants.reason}`,
    };
  }

  return result;
}
