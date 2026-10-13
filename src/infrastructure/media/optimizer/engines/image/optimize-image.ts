/**
 * Image optimize orchestration — policy + WebP budget (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/optimize-image.ts
 */

import type { MediaOptimizeResult } from '../../../../../domains/media';
import {
  evaluateImageAgainstPolicy,
  normalizeImageMime,
} from '../../../../../domains/media';
import { blobToImageData, scaleImageData } from './raster-decode';
import { encodeWebpUnderBudget } from './webp-budget';
import type { ImageEngineRequest } from './types';

function abortedResult(request: ImageEngineRequest): MediaOptimizeResult {
  return {
    status: 'aborted',
    kind: 'image',
    profileId: request.input.profileId,
    input: { ...request.input, kind: 'image' },
    code: 'aborted',
    message: 'Bildoptimierung abgebrochen.',
  };
}

function toBlob(bytes: Blob | ArrayBuffer | Uint8Array, mimeType: string): Blob {
  if (bytes instanceof ArrayBuffer) {
    return new Blob([bytes], { type: mimeType });
  }
  if (ArrayBuffer.isView(bytes)) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    return new Blob([copy], { type: mimeType });
  }
  return bytes;
}

/**
 * Optimize one image against its asset profile.
 * Without `bytes`, returns failed (facade may call for metadata-only probes).
 */
export async function runOptimizeImage(
  request: ImageEngineRequest,
): Promise<MediaOptimizeResult> {
  const input = { ...request.input, kind: 'image' as const };

  if (request.signal?.aborted) {
    return abortedResult(request);
  }

  if (!request.bytes) {
    return {
      status: 'failed',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'invalid-input',
      message: 'Bildbytes fehlen für die Image-Engine.',
    };
  }

  const policyEval = evaluateImageAgainstPolicy(input, {
    imageCountInRequest: request.imageCountInRequest,
    aggregateRequestBytes: request.aggregateRequestBytes,
  });
  if (policyEval.ok === false) {
    if (
      policyEval.reason === 'over-max-upload' ||
      policyEval.reason === 'over-aggregate-budget'
    ) {
      return {
        status: 'over-budget',
        kind: 'image',
        profileId: input.profileId,
        input,
        code: policyEval.reason,
        message: policyEval.message,
        attemptedByteSize: input.byteSize,
      };
    }
    return {
      status: 'unsupported',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'unsupported-mime',
      message: policyEval.message,
    };
  }

  const policy = policyEval.policy;
  const mime = normalizeImageMime(input.mimeType);

  // Animated GIF keep is only valid when policy allows animation without convert.
  if (mime === 'image/gif' && input.hasAnimation === true && policy.gifAnimation === 'allow') {
    if (input.byteSize <= policy.budget.maxUploadBytes) {
      return {
        status: 'unchanged',
        kind: 'image',
        profileId: input.profileId,
        input,
        outputMimeType: input.mimeType,
        outputByteSize: input.byteSize,
      };
    }
  }

  // Small valid originals: unchanged (no Dateiwachstum / no unnecessary encode).
  const needsGifConvert =
    mime === 'image/gif' && policy.gifAnimation === 'convert-static-required';
  const withinTarget = input.byteSize <= policy.budget.targetBytes;
  if (!needsGifConvert && withinTarget && input.byteSize <= policy.budget.maxUploadBytes) {
    return {
      status: 'unchanged',
      kind: 'image',
      profileId: input.profileId,
      input,
      outputMimeType: input.mimeType,
      outputByteSize: input.byteSize,
    };
  }

  if (!policy.allowWebpOutput) {
    if (input.byteSize <= policy.budget.maxUploadBytes) {
      return {
        status: 'unchanged',
        kind: 'image',
        profileId: input.profileId,
        input,
        outputMimeType: input.mimeType,
        outputByteSize: input.byteSize,
      };
    }
    return {
      status: 'over-budget',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'over-max-upload',
      message:
        'Item-Thumbnail überschreitet maxUploadBytes; WebP-Ausgabe ist für dieses Profil noch nicht freigeschaltet.',
      attemptedByteSize: input.byteSize,
    };
  }

  if (request.signal?.aborted) {
    return abortedResult(request);
  }

  let imageData: ImageData;
  try {
    const blob = toBlob(request.bytes, mime);
    imageData = await blobToImageData(blob);
  } catch (error) {
    return {
      status: 'failed',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'encode-failed',
      message: `Raster-Decode fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Optional max-edge pre-scale before budget ladder
  if (
    Math.max(imageData.width, imageData.height) > policy.maxEdgePx
  ) {
    const edge = policy.maxEdgePx;
    const scale = edge / Math.max(imageData.width, imageData.height);
    const nw = Math.max(1, Math.floor(imageData.width * scale));
    const nh = Math.max(1, Math.floor(imageData.height * scale));
    imageData = await scaleImageData(imageData, nw, nh);
  }

  const { encode } = await import('@jsquash/webp');
  const budgeted = await encodeWebpUnderBudget({
    imageData,
    encode: async (data, opts) => {
      const buf = await encode(data, opts);
      return buf as ArrayBuffer;
    },
    scaleImageData,
    targetBytes: policy.budget.targetBytes,
    maxUploadBytes: policy.budget.maxUploadBytes,
    maxOutputBytes: input.byteSize,
    minQuality: policy.minQuality,
    signal: request.signal,
  });

  if (budgeted.ok === false) {
    if (budgeted.reason === 'aborted') {
      return abortedResult(request);
    }
    if (budgeted.reason === 'over-budget') {
      return {
        status: 'over-budget',
        kind: 'image',
        profileId: input.profileId,
        input,
        code: 'over-max-upload',
        message: budgeted.message,
        attemptedByteSize: budgeted.attemptedByteSize,
      };
    }
    return {
      status: 'failed',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'encode-failed',
      message: budgeted.message,
    };
  }

  // Guard: never claim optimized if we grew the file
  if (budgeted.buffer.byteLength > input.byteSize) {
    return {
      status: 'failed',
      kind: 'image',
      profileId: input.profileId,
      input,
      code: 'encode-failed',
      message: 'WebP-Ausgabe wäre größer als das Original — abgelehnt.',
    };
  }

  const outputBytes = new Uint8Array(budgeted.buffer);
  if (request.onOptimizedBytes) {
    request.onOptimizedBytes(outputBytes);
  }

  return {
    status: 'optimized',
    kind: 'image',
    profileId: input.profileId,
    input,
    outputMimeType: 'image/webp',
    outputByteSize: budgeted.buffer.byteLength,
    width: budgeted.width,
    height: budgeted.height,
  };
}
