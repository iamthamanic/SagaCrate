#!/usr/bin/env node
/**
 * media-optimizer-contracts-check — domain contracts/policies for #625.
 * Location: scripts/media-optimizer-contracts-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

function equal(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    failures += 1;
    console.error(`FAIL [${group}]: ${message} — expected ${b}, got ${a}`);
  }
}

function mustInclude(file, needles, label) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) {
      failures += 1;
      console.error(`FAIL [${label}]: missing ${JSON.stringify(needle)} in ${file}`);
    }
  }
}

function mustNotInclude(file, needles, label) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const needle of needles) {
    if (text.includes(needle)) {
      failures += 1;
      console.error(`FAIL [${label}]: forbidden ${JSON.stringify(needle)} in ${file}`);
    }
  }
}

function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const MiB = 1024 * 1024;

section('1 · ownership & structure');

mustInclude(
  'src/domains/media/index.ts',
  [
    'MediaKind',
    'MediaOptimizeStatus',
    'AssetProfileId',
    'assertMediaOptimizeResultInvariants',
    'getImageAssetPolicy',
    'evaluateImageAgainstPolicy',
  ],
  'media barrel',
);

mustInclude(
  '.qa/design/universal-media-optimizer.md',
  ['targetBytes', 'maxUploadBytes', 'look-reference', '12 MiB', '@jsquash/webp'],
  'design doc',
);

mustNotInclude('src/domains/media/index.ts', ["from 'react'", 'supabase'], 'no react/supabase in barrel');

const mediaDir = join(root, 'src/domains/media');
for (const file of walkFiles(mediaDir)) {
  const text = readFileSync(file, 'utf8');
  const rel = file.slice(root.length + 1);
  check(!/\bfrom\s+['"]react(?:\/|$)/.test(text), `${rel}: no React import`);
  check(!/from\s+['"][^'"]*supabase[^'"]*['"]/i.test(text), `${rel}: no Supabase import`);
  check(!/\bdocument\b|\bwindow\b|\bFile\b|\bBlob\b|\bImageData\b/.test(text), `${rel}: no browser globals`);
  const codeOnly = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check(!/\bany\b/.test(codeOnly), `${rel}: no any`);
  check(!/\bas\s+unknown\b/.test(codeOnly), `${rel}: no as unknown`);
  check(!/\bas\s+any\b/.test(codeOnly), `${rel}: no as any`);
}

section('2 · runtime policies & invariants');

const outdir = join(root, 'node_modules', '.cache', 'media-optimizer-contracts-check');
mkdirSync(outdir, { recursive: true });
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');

execFileSync(
  esbuild,
  [
    join(root, 'src/domains/media/index.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${join(outdir, 'media.mjs')}`,
  ],
  { stdio: 'inherit' },
);

const media = await import(pathToFileURL(join(outdir, 'media.mjs')).href);

equal(media.MEDIA_KINDS.slice().sort(), ['audio', 'image', 'model3d', 'video'].sort(), 'kinds');
equal(
  media.MEDIA_OPTIMIZE_STATUSES.slice().sort(),
  ['aborted', 'failed', 'optimized', 'over-budget', 'unchanged', 'unsupported'].sort(),
  'statuses',
);

const portrait = media.getImageAssetPolicy('character-portrait');
equal(portrait.budget.maxUploadBytes, 5 * MiB, 'portrait maxUpload');
check(portrait.allowedMimeTypes.includes('image/gif'), 'portrait allows gif');
check(portrait.allowWebpOutput === true, 'portrait webp out');

const mapPin = media.getImageAssetPolicy('map-pin');
equal(mapPin.budget.maxUploadBytes, 5 * MiB, 'map maxUpload');
check(!mapPin.allowedMimeTypes.includes('image/gif'), 'map rejects gif mime list');

const look = media.getImageAssetPolicy('look-reference');
equal(look.budget.maxUploadBytes, 8 * MiB, 'look per-image max');
equal(look.maxAggregateRequestBytes, 12 * MiB, 'look aggregate 12 MiB');
equal(look.maxImagesPerRequest, 10, 'look max images');

const item = media.getImageAssetPolicy('item-thumbnail');
equal(item.budget.maxUploadBytes, 10 * MiB, 'item maxUpload');
equal(
  item.allowedMimeTypes.slice().sort(),
  ['image/jpeg', 'image/png', 'image/webp'].sort(),
  'item mime',
);
check(item.allowWebpOutput === true, 'item webp enabled (#641)');

const userAvatar = media.getImageAssetPolicy('user-avatar');
equal(userAvatar.budget.maxUploadBytes, 5 * MiB, 'user-avatar maxUpload');
equal(userAvatar.maxEdgePx, 768, 'user-avatar maxEdge');
check(!userAvatar.allowedMimeTypes.includes('image/gif'), 'user-avatar rejects gif mime');
check(userAvatar.allowWebpOutput === true, 'user-avatar webp out');
check(
  userAvatar.budget.targetBytes < userAvatar.budget.maxUploadBytes,
  'target < max user-avatar',
);

check(portrait.budget.targetBytes < portrait.budget.maxUploadBytes, 'target < max portrait');
check(look.budget.targetBytes < look.budget.maxUploadBytes, 'target < max look');

const baseInput = {
  kind: 'image',
  profileId: 'character-portrait',
  mimeType: 'image/png',
  byteSize: 1000,
};

const okEval = media.evaluateImageAgainstPolicy(baseInput);
check(okEval.ok === true, 'valid portrait png');

const badMime = media.evaluateImageAgainstPolicy({
  ...baseInput,
  profileId: 'map-pin',
  mimeType: 'image/gif',
});
check(badMime.ok === false && badMime.reason === 'unsupported-mime', 'map gif rejected');

const overMax = media.evaluateImageAgainstPolicy({
  ...baseInput,
  byteSize: 6 * MiB,
});
check(overMax.ok === false && overMax.reason === 'over-max-upload', 'over maxUpload');

const lookAgg = media.evaluateImageAgainstPolicy(
  { ...baseInput, profileId: 'look-reference', mimeType: 'image/webp' },
  { imageCountInRequest: 11, aggregateRequestBytes: 1000 },
);
check(lookAgg.ok === false && lookAgg.reason === 'too-many-images', 'look too many');

const lookBytes = media.evaluateImageAgainstPolicy(
  { ...baseInput, profileId: 'look-reference', mimeType: 'image/webp' },
  { imageCountInRequest: 2, aggregateRequestBytes: 13 * MiB },
);
check(lookBytes.ok === false && lookBytes.reason === 'over-aggregate-budget', 'look aggregate');

equal(media.classifyAgainstByteBudget(100, { targetBytes: 200, maxUploadBytes: 500 }), 'within-target', 'within');
equal(media.classifyAgainstByteBudget(300, { targetBytes: 200, maxUploadBytes: 500 }), 'over-target', 'over target');
equal(
  media.classifyAgainstByteBudget(600, { targetBytes: 200, maxUploadBytes: 500 }),
  'over-max-upload',
  'over max class',
);

const goodUnchanged = media.assertMediaOptimizeResultInvariants({
  status: 'unchanged',
  kind: 'image',
  profileId: 'character-portrait',
  input: baseInput,
  outputMimeType: 'image/png',
  outputByteSize: 1000,
});
check(goodUnchanged.ok === true, 'unchanged ok');

const badUnchanged = media.assertMediaOptimizeResultInvariants({
  status: 'unchanged',
  kind: 'image',
  profileId: 'character-portrait',
  input: baseInput,
  outputMimeType: 'image/webp',
  outputByteSize: 1000,
});
check(badUnchanged.ok === false, 'unchanged mime must match');

const optimized = media.assertMediaOptimizeResultInvariants({
  status: 'optimized',
  kind: 'image',
  profileId: 'character-portrait',
  input: baseInput,
  outputMimeType: 'image/webp',
  outputByteSize: 800,
});
check(optimized.ok === true, 'optimized ok');

const failed = media.assertMediaOptimizeResultInvariants({
  status: 'failed',
  kind: 'image',
  profileId: 'character-portrait',
  input: baseInput,
  code: 'encode-failed',
  message: 'Encoderfehler',
});
check(failed.ok === true, 'failed ok');

if (failures > 0) {
  console.error(`media-optimizer-contracts-check: ${failures} failure(s)`);
  process.exit(1);
}

console.log('media-optimizer-contracts-check: ok');
