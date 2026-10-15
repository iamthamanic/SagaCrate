/**
 * Decode raster Blob/File to ImageData (first frame for GIF) (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/raster-decode.ts
 *
 * Browser APIs only — createImageBitmap + Canvas 2D with alpha.
 */

import {
  computeImageDownscaleFactor,
  IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX,
  IMAGE_ENGINE_MAX_PIXELS,
} from './resource-limits';

const MAX_DIMENSION = IMAGE_ENGINE_ABSOLUTE_MAX_EDGE_PX;

export async function blobToImageData(blob: Blob): Promise<ImageData> {
  return blobToImageDataFittingLimits(blob, {
    maxEdgePx: MAX_DIMENSION,
    maxPixels: IMAGE_ENGINE_MAX_PIXELS,
  });
}

/**
 * Decode and draw into a canvas that already fits maxEdge / maxPixels —
 * avoids allocating a full-resolution ImageData then rejecting it.
 */
export async function blobToImageDataFittingLimits(
  blob: Blob,
  limits: { readonly maxEdgePx: number; readonly maxPixels: number },
): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    if (w < 1 || h < 1) {
      throw new Error(`Bildabmessungen nicht unterstützt (${w}×${h})`);
    }
    // Cap policy edge by absolute engine edge; oversize edges scale down instead of reject.
    const effectiveMaxEdge = Math.min(
      limits.maxEdgePx > 0 ? limits.maxEdgePx : MAX_DIMENSION,
      MAX_DIMENSION,
    );
    const scale = computeImageDownscaleFactor(w, h, effectiveMaxEdge, limits.maxPixels);
    const tw = Math.max(1, Math.floor(w * scale));
    const th = Math.max(1, Math.floor(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      throw new Error('Canvas 2D nicht verfügbar');
    }
    ctx.drawImage(bitmap, 0, 0, tw, th);
    return ctx.getImageData(0, 0, tw, th);
  } finally {
    bitmap.close();
  }
}

export async function scaleImageData(
  source: ImageData,
  targetW: number,
  targetH: number,
): Promise<ImageData> {
  const bmp = await createImageBitmap(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D nicht verfügbar');
    ctx.drawImage(bmp, 0, 0, targetW, targetH);
    return ctx.getImageData(0, 0, targetW, targetH);
  } finally {
    bmp.close();
  }
}
