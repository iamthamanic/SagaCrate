/**
 * world-atlas.types — Hierarchical Leaflet atlas domain model (#702).
 * Location: src/domains/world/atlas/world-atlas.types.ts
 */

export type WorldAtlasMapKind =
  | 'world'
  | 'region'
  | 'settlement'
  | 'scene'
  | 'legacy_tiles';

export type WorldAtlasBounds = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

/** GeoJSON FeatureCollection stored as layers (validated separately). */
export type WorldAtlasFeatureCollection = {
  readonly type: 'FeatureCollection';
  readonly features: readonly unknown[];
};

export type WorldAtlasMapSummary = {
  readonly id: string;
  readonly worldProfileId: string;
  readonly parentMapId: string | null;
  readonly kind: WorldAtlasMapKind;
  readonly title: string;
  readonly sortOrder: number;
  readonly revision: number;
  readonly updatedAt: string | null;
  readonly hasAzgaarMap: boolean;
  readonly hasBasemap: boolean;
};

export type WorldAtlasMapVm = {
  readonly id: string;
  readonly worldProfileId: string;
  readonly parentMapId: string | null;
  readonly kind: WorldAtlasMapKind;
  readonly title: string;
  readonly sortOrder: number;
  readonly bounds: WorldAtlasBounds;
  readonly layers: WorldAtlasFeatureCollection;
  readonly basemapStoragePath: string | null;
  readonly azgaarMapStoragePath: string | null;
  readonly generatorMeta: Readonly<Record<string, unknown>>;
  readonly revision: number;
  readonly updatedAt: string | null;
};

export const EMPTY_ATLAS_LAYERS: WorldAtlasFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export const DEFAULT_ATLAS_BOUNDS: WorldAtlasBounds = {
  minX: 0,
  minY: 0,
  maxX: 1000,
  maxY: 1000,
};

export function isWorldAtlasMapKind(value: unknown): value is WorldAtlasMapKind {
  return (
    value === 'world'
    || value === 'region'
    || value === 'settlement'
    || value === 'scene'
    || value === 'legacy_tiles'
  );
}
