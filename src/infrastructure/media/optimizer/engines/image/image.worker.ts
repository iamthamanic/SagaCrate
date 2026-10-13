/**
 * WebP encode worker — isolates @jsquash/webp WASM off the UI thread (#632).
 * Location: src/infrastructure/media/optimizer/engines/image/image.worker.ts
 */

import { encodeWebpUnderBudget } from './webp-budget';
import type { WebpEncodeOptions } from './webp-budget';

export type ImageWorkerEncodeRequest = {
  readonly type: 'encode';
  readonly requestId: string;
  readonly width: number;
  readonly height: number;
  /** RGBA pixel buffer (transferred). */
  readonly rgba: ArrayBuffer;
  readonly targetBytes: number;
  readonly maxUploadBytes: number;
  readonly maxOutputBytes: number;
  readonly minQuality: number;
  readonly minEdgePx?: number;
};

export type ImageWorkerResponse =
  | {
      readonly type: 'result';
      readonly requestId: string;
      readonly ok: true;
      readonly buffer: ArrayBuffer;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly type: 'result';
      readonly requestId: string;
      readonly ok: false;
      readonly reason: 'over-budget' | 'encode-failed' | 'aborted';
      readonly message: string;
      readonly attemptedByteSize?: number;
    };

async function scaleImageData(
  source: ImageData,
  targetW: number,
  targetH: number,
): Promise<ImageData> {
  const bmp = await createImageBitmap(source);
  try {
    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('OffscreenCanvas 2D nicht verfügbar');
    ctx.drawImage(bmp, 0, 0, targetW, targetH);
    return ctx.getImageData(0, 0, targetW, targetH);
  } finally {
    bmp.close();
  }
}

self.onmessage = async (event: MessageEvent<ImageWorkerEncodeRequest>) => {
  const msg = event.data;
  if (!msg || msg.type !== 'encode') return;

  try {
    const { encode } = await import('@jsquash/webp');
    const imageData = new ImageData(
      new Uint8ClampedArray(msg.rgba),
      msg.width,
      msg.height,
    );

    const budgeted = await encodeWebpUnderBudget({
      imageData,
      encode: async (data, opts: WebpEncodeOptions) => {
        const buf = await encode(data, opts);
        return buf as ArrayBuffer;
      },
      scaleImageData,
      targetBytes: msg.targetBytes,
      maxUploadBytes: msg.maxUploadBytes,
      maxOutputBytes: msg.maxOutputBytes,
      minQuality: msg.minQuality,
      minEdgePx: msg.minEdgePx,
    });

    if (budgeted.ok === false) {
      const response: ImageWorkerResponse = {
        type: 'result',
        requestId: msg.requestId,
        ok: false,
        reason: budgeted.reason,
        message: budgeted.message,
        attemptedByteSize: budgeted.attemptedByteSize,
      };
      postWorkerMessage(response);
      return;
    }

    const response: ImageWorkerResponse = {
      type: 'result',
      requestId: msg.requestId,
      ok: true,
      buffer: budgeted.buffer,
      width: budgeted.width,
      height: budgeted.height,
    };
    postWorkerMessage(response, [budgeted.buffer]);
  } catch (error) {
    const response: ImageWorkerResponse = {
      type: 'result',
      requestId: msg.requestId,
      ok: false,
      reason: 'encode-failed',
      message: `Worker-Encoder-Fehler: ${error instanceof Error ? error.message : String(error)}`,
    };
    postWorkerMessage(response);
  }
};

declare function postMessage(
  message: ImageWorkerResponse,
  transfer?: Transferable[],
): void;

function postWorkerMessage(
  response: ImageWorkerResponse,
  transfer?: Transferable[],
): void {
  if (transfer) {
    postMessage(response, transfer);
  } else {
    postMessage(response);
  }
}
