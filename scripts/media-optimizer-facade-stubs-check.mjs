#!/usr/bin/env node
/**
 * media-optimizer-facade-stubs-check — facade + engine stubs for #628.
 * Location: scripts/media-optimizer-facade-stubs-check.mjs
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

function mustExist(rel) {
  try {
    statSync(join(root, rel));
  } catch {
    failures += 1;
    console.error(`FAIL [${group}]: missing ${rel}`);
  }
}

section('1 · files & codec-free source');

const files = [
  'src/infrastructure/media/optimizer/index.ts',
  'src/infrastructure/media/optimizer/media-optimizer.ts',
  'src/infrastructure/media/optimizer/engines/image/index.ts',
  'src/infrastructure/media/optimizer/engines/video/index.ts',
  'src/infrastructure/media/optimizer/engines/model3d/index.ts',
  'src/infrastructure/media/optimizer/engines/audio/index.ts',
];
files.forEach(mustExist);

const optDir = join(root, 'src/infrastructure/media/optimizer');
for (const file of walkFiles(optDir)) {
  const text = readFileSync(file, 'utf8');
  const rel = file.slice(root.length + 1);
  const isImageEngine = rel.includes('/engines/image/');
  // Image engine (#630) may reference @jsquash/webp lazily; facade + stubs must not.
  if (!isImageEngine) {
    check(!/@jsquash\/webp/.test(text), `${rel}: no @jsquash/webp in facade/stubs`);
  }
  check(!/ffmpeg/i.test(text), `${rel}: no ffmpeg`);
  check(!/\bany\b/.test(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), `${rel}: no any`);
  check(!/\bas\s+unknown\b/.test(text), `${rel}: no as unknown`);
}
check(
  !/@jsquash\/webp/.test(
    readFileSync(join(root, 'src/infrastructure/media/optimizer/media-optimizer.ts'), 'utf8'),
  ),
  'facade source codec-free',
);

check(
  /await import\('\.\/engines\/image\/index'\)/.test(
    readFileSync(join(root, 'src/infrastructure/media/optimizer/media-optimizer.ts'), 'utf8'),
  ),
  'image engine lazy-imported',
);
check(
  /TODO\(media-optimizer-v2\).*Mediabunny|Mediabunny/.test(
    readFileSync(join(root, 'src/infrastructure/media/optimizer/engines/video/index.ts'), 'utf8'),
  ),
  'video Ausbau-TODO Mediabunny',
);
check(
  /glTF Transform/.test(
    readFileSync(join(root, 'src/infrastructure/media/optimizer/engines/model3d/index.ts'), 'utf8'),
  ),
  'model3d Ausbau-TODO glTF Transform',
);

section('2 · runtime dispatch');

const outdir = join(root, 'node_modules', '.cache', 'media-optimizer-facade-stubs-check');
mkdirSync(outdir, { recursive: true });
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');

execFileSync(
  esbuild,
  [
    join(root, 'src/infrastructure/media/optimizer/index.ts'),
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--external:@jsquash/webp',
    `--outfile=${join(outdir, 'optimizer.mjs')}`,
  ],
  { stdio: 'inherit' },
);

const bundled = readFileSync(join(outdir, 'optimizer.mjs'), 'utf8');
check(!/ffmpeg/i.test(bundled), 'facade bundle has no ffmpeg');
check(
  !/from\s+['"]@jsquash\/webp['"]/.test(
    readFileSync(join(root, 'src/infrastructure/media/optimizer/media-optimizer.ts'), 'utf8'),
  ),
  'facade has no static jsquash import',
);

const { optimizeMedia } = await import(pathToFileURL(join(outdir, 'optimizer.mjs')).href);

const base = {
  profileId: 'character-portrait',
  mimeType: 'image/png',
  byteSize: 1024,
};

const image = await optimizeMedia({ ...base, kind: 'image' });
check(image.status === 'failed', `image placeholder status=${image.status}`);
check(image.status !== 'optimized' && image.status !== 'unchanged', 'image no fake success');

const video = await optimizeMedia({
  ...base,
  kind: 'video',
  mimeType: 'video/mp4',
  profileId: 'character-portrait',
});
check(video.status === 'unsupported', `video status=${video.status}`);
check(/Mediabunny|nicht verfügbar/.test(video.message), 'video message');

const audio = await optimizeMedia({
  ...base,
  kind: 'audio',
  mimeType: 'audio/mpeg',
});
check(audio.status === 'unsupported', `audio status=${audio.status}`);

const model3d = await optimizeMedia({
  ...base,
  kind: 'model3d',
  mimeType: 'model/gltf-binary',
});
check(model3d.status === 'unsupported', `model3d status=${model3d.status}`);
check(/glTF Transform|nicht verfügbar/.test(model3d.message), 'model3d message');

const ac = new AbortController();
ac.abort();
const aborted = await optimizeMedia({ ...base, kind: 'video', signal: ac.signal });
check(aborted.status === 'aborted', `abort status=${aborted.status}`);

if (failures > 0) {
  console.error(`media-optimizer-facade-stubs-check: ${failures} failure(s)`);
  process.exit(1);
}
console.log('media-optimizer-facade-stubs-check: ok');
