/**
 * world/atlas domain public API (#702).
 * Location: src/domains/world/atlas/index.ts
 */

export {
  DEFAULT_ATLAS_BOUNDS,
  EMPTY_ATLAS_LAYERS,
  isWorldAtlasMapKind,
  type WorldAtlasBounds,
  type WorldAtlasFeatureCollection,
  type WorldAtlasMapKind,
  type WorldAtlasMapSummary,
  type WorldAtlasMapVm,
} from './world-atlas.types';

export {
  parseWorldAtlasBounds,
  parseWorldAtlasLayers,
  parseWorldAtlasMapList,
  parseWorldAtlasMapSummary,
  parseWorldAtlasMapVm,
} from './validate-world-atlas';
