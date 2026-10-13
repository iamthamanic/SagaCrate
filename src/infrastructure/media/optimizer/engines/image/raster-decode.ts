/**
 * Decode raster Blob/File to ImageData (first frame for GIF) (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/raster-decode.ts
 *
 * Browser APIs only — createImageBitmap + Canvas 2D with alpha.
 */

const MAX_DIMENSION = 8192;

export async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    if (w < 1 || h < 1 || w > MAX_DIMENSION || h > MAX_DIMENSION) {
      throw new Error(`Bildabmessungen nicht unterstützt (${w}×${h})`);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      throw new Error('Canvas 2D nicht verfügbar');
    }
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, w, h);
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
