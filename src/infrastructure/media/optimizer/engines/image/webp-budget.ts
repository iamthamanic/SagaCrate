/**
 * WebP size-budget encode ladder — lossless → quality → downscale (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/webp-budget.ts
 *
 * Pure relative to DOM except optional scale helper injection. No silent
 * oversized “success”: callers map encode failure to over-budget/failed.
 */

export type WebpEncodeOptions = {
  readonly lossless?: number;
  readonly exact?: number;
  readonly quality?: number;
  readonly method?: number;
  readonly alpha_quality?: number;
};

export type WebpEncodeFn = (
  data: ImageData,
  opts: WebpEncodeOptions,
) => Promise<ArrayBuffer>;

export type ScaleImageDataFn = (
  source: ImageData,
  targetW: number,
  targetH: number,
) => Promise<ImageData>;

export type WebpBudgetParams = {
  readonly imageData: ImageData;
  readonly encode: WebpEncodeFn;
  readonly scaleImageData: ScaleImageDataFn;
  /** Soft goal for the ladder (preferred encoded size). */
  readonly targetBytes: number;
  /** Hard ceiling — failure if nothing ≤ this. */
  readonly maxUploadBytes: number;
  /** Reject candidates larger than the original payload (kein Dateiwachstum). */
  readonly maxOutputBytes: number;
  readonly minQuality: number;
  readonly minEdgePx?: number;
  readonly signal?: AbortSignal;
};

export type WebpBudgetSuccess = {
  readonly ok: true;
  readonly buffer: ArrayBuffer;
  readonly width: number;
  readonly height: number;
};

export type WebpBudgetFailure = {
  readonly ok: false;
  readonly reason: 'over-budget' | 'aborted' | 'encode-failed';
  readonly message: string;
  readonly attemptedByteSize?: number;
};

export type WebpBudgetResult = WebpBudgetSuccess | WebpBudgetFailure;

const DEFAULT_QUALITIES = [92, 85, 78, 70, 62, 55, 48, 42, 36] as const;

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    const err = new Error('aborted');
    err.name = 'AbortError';
    throw err;
  }
}

function isAcceptable(
  byteLength: number,
  maxUploadBytes: number,
  maxOutputBytes: number,
): boolean {
  return byteLength > 0 && byteLength <= maxUploadBytes && byteLength <= maxOutputBytes;
}

/**
 * Encode ImageData to WebP under budget. Prefers ≤ targetBytes when possible;
 * accepts any candidate ≤ maxUploadBytes (and ≤ original size).
 */
export async function encodeWebpUnderBudget(
  params: WebpBudgetParams,
): Promise<WebpBudgetResult> {
  const {
    encode,
    scaleImageData,
    targetBytes,
    maxUploadBytes,
    maxOutputBytes,
    minQuality,
    signal,
  } = params;
  const minEdge = params.minEdgePx ?? 320;
  let imageData = params.imageData;
  let bestUnderMax: { buffer: ArrayBuffer; width: number; height: number } | null =
    null;

  const consider = (
    buffer: ArrayBuffer,
    width: number,
    height: number,
  ): WebpBudgetSuccess | null => {
    const size = buffer.byteLength;
    if (!isAcceptable(size, maxUploadBytes, maxOutputBytes)) {
      return null;
    }
    if (!bestUnderMax || size < bestUnderMax.buffer.byteLength) {
      bestUnderMax = { buffer, width, height };
    }
    if (size <= targetBytes) {
      return { ok: true, buffer, width, height };
    }
    return null;
  };

  try {
    throwIfAborted(signal);

    // 1) Lossless
    {
      const buffer = await encode(imageData, { lossless: 1, exact: 1 });
      const hit = consider(buffer, imageData.width, imageData.height);
      if (hit) return hit;
    }

    // 2) Lossy qualities (respect profile minQuality floor)
    const qualities = DEFAULT_QUALITIES.filter((q) => q >= minQuality);
    const ladder = qualities.length > 0 ? qualities : [minQuality];
    for (const quality of ladder) {
      throwIfAborted(signal);
      const buffer = await encode(imageData, {
        lossless: 0,
        quality,
        method: 6,
        alpha_quality: 100,
      });
      const hit = consider(buffer, imageData.width, imageData.height);
      if (hit) return hit;
    }

    // 3) Downscale + mid quality
    let w = imageData.width;
    let h = imageData.height;
    let scale = 0.9;
    while (scale > 0.35 && (w > minEdge || h > minEdge)) {
      throwIfAborted(signal);
      const nw = Math.max(1, Math.floor(w * scale));
      const nh = Math.max(1, Math.floor(h * scale));
      imageData = await scaleImageData(imageData, nw, nh);
      w = nw;
      h = nh;
      const q = Math.max(minQuality, 78);
      const buffer = await encode(imageData, {
        lossless: 0,
        quality: q,
        method: 6,
        alpha_quality: 100,
      });
      const hit = consider(buffer, w, h);
      if (hit) return hit;
      scale *= 0.88;
    }

    if (bestUnderMax) {
      return {
        ok: true,
        buffer: bestUnderMax.buffer,
        width: bestUnderMax.width,
        height: bestUnderMax.height,
      };
    }

    return {
      ok: false,
      reason: 'over-budget',
      message: `Bild konnte nicht unter ${(maxUploadBytes / (1024 * 1024)).toFixed(0)} MiB komprimiert werden.`,
      attemptedByteSize: maxOutputBytes,
    };
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'aborted')) {
      return {
        ok: false,
        reason: 'aborted',
        message: 'Bildoptimierung abgebrochen.',
      };
    }
    return {
      ok: false,
      reason: 'encode-failed',
      message: `WebP-Encoder-Fehler: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
