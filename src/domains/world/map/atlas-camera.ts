/**
 * atlas-camera — pure hierarchical camera / LOD math for Unified Atlas.
 * Location: src/domains/world/map/atlas-camera.ts
 * Each nested anchor maps a local detail coordinate space into its parent.
 */
export type AtlasPoint = Readonly<{ x: number; y: number }>;
export type AtlasSize = Readonly<{ width: number; height: number }>;
export type AtlasRect = Readonly<AtlasPoint & AtlasSize>;
export type AtlasCamera = Readonly<{ center: AtlasPoint; pixelsPerUnit: number }>;
export type AtlasAnchor = Readonly<{
  parentRect: AtlasRect;
  localSize: AtlasSize;
}>;

const positive = (number: number): boolean => Number.isFinite(number) && number > 0;
const finitePoint = (point: AtlasPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);
const validSize = (size: AtlasSize): boolean => positive(size.width) && positive(size.height);
const validCamera = (camera: AtlasCamera): boolean =>
  finitePoint(camera.center) && positive(camera.pixelsPerUnit);

export function atlasFitCamera(rect: AtlasRect, viewport: AtlasSize, padding = 24): AtlasCamera {
  if (!validSize(rect) || !validSize(viewport)) {
    return { center: { x: 0, y: 0 }, pixelsPerUnit: 1 };
  }
  const inset = Math.max(0, Number.isFinite(padding) ? padding : 0);
  const usableWidth = Math.max(1, viewport.width - inset * 2);
  const usableHeight = Math.max(1, viewport.height - inset * 2);
  return {
    center: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    pixelsPerUnit: Math.min(usableWidth / rect.width, usableHeight / rect.height),
  };
}

export function atlasWorldToScreen(point: AtlasPoint, camera: AtlasCamera, viewport: AtlasSize): AtlasPoint {
  return {
    x: (point.x - camera.center.x) * camera.pixelsPerUnit + viewport.width / 2,
    y: (point.y - camera.center.y) * camera.pixelsPerUnit + viewport.height / 2,
  };
}

export function atlasScreenToWorld(point: AtlasPoint, camera: AtlasCamera, viewport: AtlasSize): AtlasPoint {
  return {
    x: (point.x - viewport.width / 2) / camera.pixelsPerUnit + camera.center.x,
    y: (point.y - viewport.height / 2) / camera.pixelsPerUnit + camera.center.y,
  };
}

/** Keep the exact root/world point under a cursor stationary when zooming. */
export function atlasZoomAt(
  camera: AtlasCamera,
  viewport: AtlasSize,
  cursor: AtlasPoint,
  requestedScale: number,
  minScale = 1,
  maxScale = 1024,
): AtlasCamera {
  if (!validCamera(camera) || !validSize(viewport) || !finitePoint(cursor)) return camera;
  if (!positive(requestedScale) || !positive(minScale) || !positive(maxScale) || maxScale < minScale) return camera;
  const scale = Math.max(minScale, Math.min(maxScale, requestedScale));
  const atCursor = atlasScreenToWorld(cursor, camera, viewport);
  return {
    pixelsPerUnit: scale,
    center: {
      x: atCursor.x - (cursor.x - viewport.width / 2) / scale,
      y: atCursor.y - (cursor.y - viewport.height / 2) / scale,
    },
  };
}

export function atlasPanBy(camera: AtlasCamera, screenDelta: AtlasPoint): AtlasCamera {
  if (!validCamera(camera) || !finitePoint(screenDelta)) return camera;
  return {
    ...camera,
    center: {
      x: camera.center.x - screenDelta.x / camera.pixelsPerUnit,
      y: camera.center.y - screenDelta.y / camera.pixelsPerUnit,
    },
  };
}

/** The anchors are ordered root-to-leaf. */
export function atlasLocalToRoot(point: AtlasPoint, anchors: readonly AtlasAnchor[]): AtlasPoint {
  let result = point;
  for (let i = anchors.length - 1; i >= 0; i -= 1) {
    const { parentRect, localSize } = anchors[i];
    if (!validSize(parentRect) || !validSize(localSize)) return { x: NaN, y: NaN };
    result = {
      x: parentRect.x + (result.x / localSize.width) * parentRect.width,
      y: parentRect.y + (result.y / localSize.height) * parentRect.height,
    };
  }
  return result;
}

export function atlasRootToLocal(point: AtlasPoint, anchors: readonly AtlasAnchor[]): AtlasPoint {
  let result = point;
  for (const { parentRect, localSize } of anchors) {
    if (!validSize(parentRect) || !validSize(localSize)) return { x: NaN, y: NaN };
    result = {
      x: ((result.x - parentRect.x) / parentRect.width) * localSize.width,
      y: ((result.y - parentRect.y) / parentRect.height) * localSize.height,
    };
  }
  return result;
}

export function atlasOpacity(scale: number, begin: number, full: number): number {
  if (!Number.isFinite(scale) || !positive(begin) || !positive(full) || full <= begin) return 0;
  const t = Math.max(0, Math.min(1, (scale - begin) / (full - begin)));
  return t * t * (3 - 2 * t);
}

/** Apply different entry/exit thresholds so zoom jitter does not toggle the active layer. */
export function atlasDetailActive(
  wasActive: boolean,
  scale: number,
  insideDetail: boolean,
  enterScale: number,
  exitScale: number,
): boolean {
  if (!insideDetail || !positive(scale) || !positive(exitScale) || !positive(enterScale) || exitScale >= enterScale) return false;
  return wasActive ? scale >= exitScale : scale >= enterScale;
}
