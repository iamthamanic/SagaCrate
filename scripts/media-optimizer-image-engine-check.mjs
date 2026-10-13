#!/usr/bin/env node
/**
 * media-optimizer-image-engine-check — WebP budget ladder + image engine (#630).
 * Location: scripts/media-optimizer-image-engine-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

section('1 · sources');

const imageIndex = readFileSync(
  join(root, 'src/infrastructure/media/optimizer/engines/image/index.ts'),
  'utf8',
);
const budgetSrc = readFileSync(
  join(root, 'src/infrastructure/media/optimizer/engines/image/webp-budget.ts'),
  'utf8',
);
const optimizeSrc = readFileSync(
  join(root, 'src/infrastructure/media/optimizer/engines/image/optimize-image.ts'),
  'utf8',
);
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

check(Boolean(pkg.dependencies?.['@jsquash/webp']), '@jsquash/webp in package.json');
check(/encodeWebpUnderBudget/.test(budgetSrc), 'budget ladder exported');
check(/lossless/.test(budgetSrc) && /quality/.test(budgetSrc) && /scale/.test(budgetSrc), 'ladder steps');
check(/maxOutputBytes/.test(budgetSrc), 'kein Dateiwachstum guard param');
check(/@jsquash\/webp/.test(optimizeSrc), 'jsquash lazy in optimize-image');
check(!/from ['"]@jsquash\/webp['"]/.test(imageIndex), 'index has no static jsquash import');
check(/allowWebpOutput/.test(optimizeSrc), 'respects allowWebpOutput');
check(/over-budget/.test(optimizeSrc), 'over-budget path');
check(/unchanged/.test(optimizeSrc), 'unchanged path');

section('2 · pure budget ladder (mocked encode)');

const outdir = join(root, 'node_modules', '.cache', 'media-optimizer-image-engine-check');
mkdirSync(outdir, { recursive: true });
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');
const entry = join(outdir, 'budget-entry.ts');
writeFileSync(
  entry,
  `export { encodeWebpUnderBudget } from '${join(root, 'src/infrastructure/media/optimizer/engines/image/webp-budget.ts').replace(/\\/g, '/')}';\n`,
);

execFileSync(
  esbuild,
  [entry, '--bundle', '--format=esm', `--outfile=${join(outdir, 'budget.mjs')}`],
  { stdio: 'inherit' },
);

const { encodeWebpUnderBudget } = await import(pathToFileURL(join(outdir, 'budget.mjs')).href);

function makeImageData(w, h) {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}

async function scaleImageData(source, tw, th) {
  return makeImageData(tw, th);
}

// Encode mock: lossless huge, quality ladder shrinks, downscale shrinks more
async function mockEncode(data, opts) {
  const pixels = data.width * data.height;
  if (opts.lossless === 1) {
    return new ArrayBuffer(Math.max(2_000_000, pixels));
  }
  const q = typeof opts.quality === 'number' ? opts.quality : 80;
  const size = Math.max(100, Math.floor(pixels * (q / 20)));
  return new ArrayBuffer(size);
}

{
  const imageData = makeImageData(100, 100);
  const hit = await encodeWebpUnderBudget({
    imageData,
    encode: mockEncode,
    scaleImageData,
    targetBytes: 50_000,
    maxUploadBytes: 5 * 1024 * 1024,
    maxOutputBytes: 5 * 1024 * 1024,
    minQuality: 42,
  });
  check(hit.ok === true, 'ladder finds acceptable encode');
  if (hit.ok) check(hit.buffer.byteLength <= 50_000 || hit.buffer.byteLength <= 5 * 1024 * 1024, 'size ok');
}

{
  const imageData = makeImageData(800, 800);
  const fail = await encodeWebpUnderBudget({
    imageData,
    encode: async () => new ArrayBuffer(9 * 1024 * 1024),
    scaleImageData,
    targetBytes: 1024,
    maxUploadBytes: 1024,
    maxOutputBytes: 1024,
    minQuality: 42,
  });
  check(fail.ok === false && fail.reason === 'over-budget', 'over-budget when cannot shrink');
}

{
  const imageData = makeImageData(50, 50);
  const ac = new AbortController();
  ac.abort();
  const aborted = await encodeWebpUnderBudget({
    imageData,
    encode: mockEncode,
    scaleImageData,
    targetBytes: 10_000,
    maxUploadBytes: 10_000,
    maxOutputBytes: 10_000,
    minQuality: 42,
    signal: ac.signal,
  });
  check(aborted.ok === false && aborted.reason === 'aborted', 'abort');
}

{
  // Reject growth vs original
  const imageData = makeImageData(10, 10);
  const noGrow = await encodeWebpUnderBudget({
    imageData,
    encode: async () => new ArrayBuffer(5000),
    scaleImageData,
    targetBytes: 100,
    maxUploadBytes: 10_000,
    maxOutputBytes: 200,
    minQuality: 42,
  });
  check(noGrow.ok === false && noGrow.reason === 'over-budget', 'rejects growth over maxOutputBytes');
}

section('3 · facade still codec-free on static import graph of media-optimizer.ts');

const facade = readFileSync(
  join(root, 'src/infrastructure/media/optimizer/media-optimizer.ts'),
  'utf8',
);
check(!/from ['"]@jsquash\/webp['"]/.test(facade), 'facade no static jsquash');
check(/await import\('\.\/engines\/image\/index'\)/.test(facade), 'facade lazy image');

section('4 · optimize-image policy paths (bundled, no browser decode)');

const optEntry = join(outdir, 'opt-entry.ts');
writeFileSync(
  optEntry,
  `
import { evaluateImageAgainstPolicy, normalizeImageMime } from '${join(root, 'src/domains/media/index.ts').replace(/\\/g, '/')}';
export { evaluateImageAgainstPolicy, normalizeImageMime };
`,
);
execFileSync(
  esbuild,
  [optEntry, '--bundle', '--format=esm', `--outfile=${join(outdir, 'policy.mjs')}`],
  { stdio: 'inherit' },
);
const policy = await import(pathToFileURL(join(outdir, 'policy.mjs')).href);

const small = policy.evaluateImageAgainstPolicy({
  kind: 'image',
  profileId: 'character-portrait',
  mimeType: 'image/png',
  byteSize: 1000,
});
check(small.ok === true, 'small portrait ok');

const gifMap = policy.evaluateImageAgainstPolicy({
  kind: 'image',
  profileId: 'map-pin',
  mimeType: 'image/gif',
  byteSize: 1000,
});
check(gifMap.ok === false, 'map gif rejected');

check(policy.normalizeImageMime('image/jpg') === 'image/jpeg', 'jpg normalize');

if (failures > 0) {
  console.error(`media-optimizer-image-engine-check: ${failures} failure(s)`);
  process.exit(1);
}
console.log('media-optimizer-image-engine-check: ok');
