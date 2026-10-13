#!/usr/bin/env node
/**
 * media-optimizer-item-intake-check — item thumbnail optimize before upload (#643).
 * Location: scripts/media-optimizer-item-intake-check.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
let group = '';

function section(name) {
  group = name;
}

function check(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL [${group}]: ${message}`);
  }
}

section('1 · files');
const hook = 'src/app/items/visuals/useItemAssets.ts';
const service = 'src/infrastructure/inventory/item-thumbnail-service.ts';
check(existsSync(join(root, hook)), `exists ${hook}`);
check(existsSync(join(root, service)), `exists ${service}`);

const h = readFileSync(join(root, hook), 'utf8');
const s = readFileSync(join(root, service), 'utf8');

section('2 · optimize before upload + preview');
check(/prepareItemThumbnailFile/.test(s), 'prepare helper');
check(/profileId:\s*['"]item-thumbnail['"]/.test(s), 'item-thumbnail profile');
check(/alreadyOptimized/.test(s), 'alreadyOptimized option');
check(/prepareItemThumbnailFile\(file/.test(s) || /await prepareItemThumbnailFile/.test(s), 'upload prepares');
check(/createObjectURL\(file\)/.test(h), 'Object URL preview');
check(/uploadThumbnail\(id, file\)/.test(h), 'hook calls upload');
check(/Bestehendes Thumbnail bleibt erhalten|prior signedUrl/.test(h), 'keeps prior asset');
check(/revokeObjectURL/.test(h), 'revokes provisional preview on fail');

section('3 · typed-strict');
for (const [rel, text] of [
  [hook, h],
  [service, s],
]) {
  const codeOnly = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check(!/\bany\b/.test(codeOnly), `${rel}: no any`);
  check(!/\bas\s+unknown\b/.test(codeOnly), `${rel}: no as unknown`);
}

if (failures > 0) {
  console.error(`\nmedia-optimizer-item-intake-check: ${failures} failure(s)`);
  process.exit(1);
}
console.log('media-optimizer-item-intake-check: OK');
