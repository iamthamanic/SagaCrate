#!/usr/bin/env node
/**
 * world-atlas-editor-check — dual nav + shared workbench + atlas domain (#702).
 * Location: scripts/world-atlas-editor-check.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing ${rel}`);
  return readFileSync(path, 'utf8');
}

function mustInclude(rel, needles, label) {
  const text = read(rel);
  for (const n of needles) {
    if (!text.includes(n)) throw new Error(`${label}: missing ${n} in ${rel}`);
  }
}

mustInclude(
  'supabase/migrations/094_world_atlas.sql',
  ['world_atlas_maps', 'list_world_atlas_maps', 'get_world_atlas_map', 'upsert_world_atlas_map', 'legacy_tiles'],
  'atlas migration',
);

mustInclude(
  'src/app/world/atlas/WorldAtlasWorkbench.tsx',
  ['data-world-atlas-workbench', 'WorldAtlasLeafletMap', 'Azgaar'],
  'shared workbench',
);

mustInclude(
  'src/app/shell/routing/routes.ts',
  ['pathForWorldAtlas', '/library/worlds/', '/world/map', "section === 'map'"],
  'dual deep links',
);

mustInclude(
  'src/app/project/SagaWorldMapPanel.tsx',
  ['data-saga-world-map', 'WorldAtlasWorkbench'],
  'saga map panel',
);

mustInclude(
  'src/app/project/SagaWorldSubNav.tsx',
  ["id: 'map'", "label: 'Karte'"],
  'saga welt subnav Karte',
);

mustInclude(
  'package.json',
  ['"leaflet"', '"react-leaflet"', '"@geoman-io/leaflet-geoman-free"'],
  'OSS deps',
);

console.log('world-atlas-editor-check: OK (#702)');
