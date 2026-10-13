/**
 * Lazy WebP worker client with abort + main-thread fallback (#632).
 * Location: src/infrastructure/media/optimizer/engines/image/webp-worker-client.ts
 */

import { encodeWebpUnderBudget } from './webp-budget';
import { scaleImageData } from './raster-decode';
import type {
  ImageWorkerEncodeRequest,
  ImageWorkerResponse,
} from './image.worker';
import type { WebpBudgetResult } from './webp-budget';

export type WorkerEncodeParams = {
  readonly imageData: ImageData;
  readonly targetBytes: number;
  readonly maxUploadBytes: number;
  readonly maxOutputBytes: number;
  readonly minQuality: number;
  readonly minEdgePx?: number;
  readonly signal?: AbortSignal;
};

let workerSupported: boolean | null = null;

export function isImageWorkerSupported(): boolean {
  if (workerSupported !== null) return workerSupported;
  workerSupported =
    typeof Worker !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined';
  return workerSupported;
}

function createImageWorker(): Worker {
  return new Worker(new URL('./image.worker.ts', import.meta.url), {
    type: 'module',
  });
}

async function encodeOnMainThread(params: WorkerEncodeParams): Promise<WebpBudgetResult> {
  const { encode } = await import('@jsquash/webp');
  return encodeWebpUnderBudget({
    imageData: params.imageData,
    encode: async (data, opts) => {
      const buf = await encode(data, opts);
      return buf as ArrayBuffer;
    },
    scaleImageData,
    targetBytes: params.targetBytes,
    maxUploadBytes: params.maxUploadBytes,
    maxOutputBytes: params.maxOutputBytes,
    minQuality: params.minQuality,
    minEdgePx: params.minEdgePx,
    signal: params.signal,
  });
}

/**
 * Prefer Worker encode; fall back to main thread when Worker/OffscreenCanvas
 * unavailable. Abort terminates the worker (no storage side effects).
 */
export async function encodeWebpWithWorkerFallback(
  params: WorkerEncodeParams,
): Promise<WebpBudgetResult> {
  if (params.signal?.aborted) {
    return {
      ok: false,
      reason: 'aborted',
      message: 'Bildoptimierung abgebrochen.',
    };
  }

  if (!isImageWorkerSupported()) {
    return encodeOnMainThread(params);
  }

  return new Promise<WebpBudgetResult>((resolve) => {
    let settled = false;
    const requestId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let worker: Worker;
    try {
      worker = createImageWorker();
    } catch {
      void encodeOnMainThread(params).then(resolve);
      return;
    }

    const finish = (result: WebpBudgetResult) => {
      if (settled) return;
      settled = true;
      params.signal?.removeEventListener('abort', onAbort);
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const onAbort = () => {
      finish({
        ok: false,
        reason: 'aborted',
        message: 'Bildoptimierung abgebrochen.',
      });
    };

    params.signal?.addEventListener('abort', onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<ImageWorkerResponse>) => {
      const msg = event.data;
      if (!msg || msg.requestId !== requestId) return;
      if (msg.ok === true) {
        finish({
          ok: true,
          buffer: msg.buffer,
          width: msg.width,
          height: msg.height,
        });
        return;
      }
      if (msg.ok === false) {
        finish({
          ok: false,
          reason: msg.reason,
          message: msg.message,
          attemptedByteSize: msg.attemptedByteSize,
        });
      }
    };

    worker.onerror = () => {
      // Worker failed to boot — fall back once.
      if (settled) return;
      settled = true;
      params.signal?.removeEventListener('abort', onAbort);
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      void encodeOnMainThread(params).then(resolve);
    };

    const rgbaCopy = params.imageData.data.buffer.slice(
      params.imageData.data.byteOffset,
      params.imageData.data.byteOffset + params.imageData.data.byteLength,
    );

    const request: ImageWorkerEncodeRequest = {
      type: 'encode',
      requestId,
      width: params.imageData.width,
      height: params.imageData.height,
      rgba: rgbaCopy,
      targetBytes: params.targetBytes,
      maxUploadBytes: params.maxUploadBytes,
      maxOutputBytes: params.maxOutputBytes,
      minQuality: params.minQuality,
      minEdgePx: params.minEdgePx,
    };

    worker.postMessage(request, [rgbaCopy]);
  });
}
