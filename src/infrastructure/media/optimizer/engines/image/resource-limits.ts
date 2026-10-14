/**
 * Image engine resource guards — pixel / byte ceilings (#632).
 * Location: src/infrastructure/media/optimizer/engines/image/resource-limits.ts
 */

/** Hard decode/input ceiling before raster work (protects RAM). */
export const IMAGE_ENGINE_MAX_INPUT_BYTES = 40 * 1024 * 1024;

/** Absolute max dimension on either edge after policy maxEdge. */
export const IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX = 8192;

/** Absolute max pixel count (width * height). */
export const IMAGE_ENGINE_MAX_PIXELS = 16_777_216; // 4096²

/**
 * Scale factor (≤1) so decoded raster fits maxEdge and maxPixels.
 * Used to auto-downscale before hard reject (large phone photos → avatar/portrait).
 */
export function computeImageDownscaleFactor(
  width: number,
  height: number,
  maxEdgePx: number,
  maxPixels: number = IMAGE_ENGINE_MAX_PIXELS,
): number {
  if (width < 1 || height < 1) return 1;
  let scale = 1;
  const longest = Math.max(width, height);
  if (maxEdgePx > 0 && longest > maxEdgePx) {
    scale = Math.min(scale, maxEdgePx / longest);
  }
  const pixels = width * height;
  if (maxPixels > 0 && pixels * scale * scale > maxPixels) {
    scale = Math.min(scale, Math.sqrt(maxPixels / pixels));
  }
  return scale;
}

export type ResourceLimitFailure = {
  readonly ok: false;
  readonly code: 'invalid-input' | 'over-max-upload';
  readonly message: string;
};

export type ResourceLimitSuccess = { readonly ok: true };

export function assertImageInputByteLimit(
  byteSize: number,
): ResourceLimitSuccess | ResourceLimitFailure {
  if (byteSize <= 0) {
    return {
      ok: false,
      code: 'invalid-input',
      message: 'Bildbytes ungültig (Größe 0).',
    };
  }
  if (byteSize > IMAGE_ENGINE_MAX_INPUT_BYTES) {
    return {
      ok: false,
      code: 'over-max-upload',
      message: `Eingabe ${byteSize} Bytes überschreitet Engine-Limit ${IMAGE_ENGINE_MAX_INPUT_BYTES}.`,
    };
  }
  return { ok: true };
}

export function assertImagePixelLimit(
  width: number,
  height: number,
): ResourceLimitSuccess | ResourceLimitFailure {
  if (width < 1 || height < 1) {
    return {
      ok: false,
      code: 'invalid-input',
      message: `Ungültige Abmessungen (${width}×${height}).`,
    };
  }
  if (
    width > IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX ||
    height > IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX
  ) {
    return {
      ok: false,
      code: 'invalid-input',
      message: `Kante überschreitet ${IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX}px (${width}×${height}).`,
    };
  }
  const pixels = width * height;
  if (pixels > IMAGE_ENGINE_MAX_PIXELS) {
    return {
      ok: false,
      code: 'over-max-upload',
      message: `Pixelanzahl ${pixels} überschreitet Limit ${IMAGE_ENGINE_MAX_PIXELS}.`,
    };
  }
  return { ok: true };
}
