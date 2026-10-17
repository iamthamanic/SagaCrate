/**
 * validate-world-atlas — Parse/validate atlas RPC payloads (#702).
 * Location: src/domains/world/atlas/validate-world-atlas.ts
 */

import {
  DEFAULT_ATLAS_BOUNDS,
  EMPTY_ATLAS_LAYERS,
  isWorldAtlasMapKind,
  type WorldAtlasBounds,
  type WorldAtlasFeatureCollection,
  type WorldAtlasMapSummary,
  type WorldAtlasMapVm,
} from './world-atlas.types';

const MAX_FEATURES = 2000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseWorldAtlasBounds(raw: unknown): WorldAtlasBounds {
  const o = asRecord(raw);
  if (!o) return DEFAULT_ATLAS_BOUNDS;
  const minX = Number(o.minX);
  const minY = Number(o.minY);
  const maxX = Number(o.maxX);
  const maxY = Number(o.maxY);
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return DEFAULT_ATLAS_BOUNDS;
  if (maxX <= minX || maxY <= minY) return DEFAULT_ATLAS_BOUNDS;
  return { minX, minY, maxX, maxY };
}

export function parseWorldAtlasLayers(raw: unknown): WorldAtlasFeatureCollection {
  const o = asRecord(raw);
  if (!o || o.type !== 'FeatureCollection' || !Array.isArray(o.features)) {
    return EMPTY_ATLAS_LAYERS;
  }
  if (o.features.length > MAX_FEATURES) {
    throw new Error(`Zu viele Features (max. ${MAX_FEATURES}).`);
  }
  return { type: 'FeatureCollection', features: o.features };
}

export function parseWorldAtlasMapSummary(raw: unknown): WorldAtlasMapSummary | null {
  const o = asRecord(raw);
  if (!o || typeof o.id !== 'string' || typeof o.worldProfileId !== 'string') return null;
  if (!isWorldAtlasMapKind(o.kind)) return null;
  return {
    id: o.id,
    worldProfileId: o.worldProfileId,
    parentMapId: typeof o.parentMapId === 'string' ? o.parentMapId : null,
    kind: o.kind,
    title: typeof o.title === 'string' && o.title.trim() ? o.title.trim() : 'Weltkarte',
    sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : 0,
    revision: typeof o.revision === 'number' ? o.revision : 0,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : null,
    hasAzgaarMap: o.hasAzgaarMap === true,
    hasBasemap: o.hasBasemap === true,
  };
}

export function parseWorldAtlasMapList(raw: unknown): WorldAtlasMapSummary[] {
  const o = asRecord(raw);
  const maps = o && Array.isArray(o.maps) ? o.maps : Array.isArray(raw) ? raw : [];
  return maps
    .map(parseWorldAtlasMapSummary)
    .filter((m): m is WorldAtlasMapSummary => m !== null);
}

export function parseWorldAtlasMapVm(raw: unknown): WorldAtlasMapVm {
  const o = asRecord(raw);
  if (!o || typeof o.id !== 'string' || typeof o.worldProfileId !== 'string') {
    throw new Error('Ungültige Atlas-Kartenantwort.');
  }
  if (!isWorldAtlasMapKind(o.kind)) {
    throw new Error('Ungültiger Kartentyp.');
  }
  const meta = asRecord(o.generatorMeta) ?? {};
  return {
    id: o.id,
    worldProfileId: o.worldProfileId,
    parentMapId: typeof o.parentMapId === 'string' ? o.parentMapId : null,
    kind: o.kind,
    title: typeof o.title === 'string' && o.title.trim() ? o.title.trim() : 'Weltkarte',
    sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : 0,
    bounds: parseWorldAtlasBounds(o.bounds),
    layers: parseWorldAtlasLayers(o.layers),
    basemapStoragePath: typeof o.basemapStoragePath === 'string' ? o.basemapStoragePath : null,
    azgaarMapStoragePath:
      typeof o.azgaarMapStoragePath === 'string' ? o.azgaarMapStoragePath : null,
    generatorMeta: meta,
    revision: typeof o.revision === 'number' ? o.revision : 0,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : null,
  };
}
