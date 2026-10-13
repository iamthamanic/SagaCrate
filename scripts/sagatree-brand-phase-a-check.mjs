#!/usr/bin/env node
/**
 * sagatree-brand-phase-a-check — #589 Phase A visible product brand.
 * Location: scripts/sagatree-brand-phase-a-check.mjs
 *
 * Locks login/shell/title/package to SagaTree. Does not require renaming
 * SagaDrive Core rules identifiers.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function fail(message) {
  console.error(`SagaTree brand Phase A check failed: ${message}`);
  process.exit(1);
}

function requireMatch(content, pattern, label) {
  if (!pattern.test(content)) fail(`missing ${label}`);
}

function forbidMatch(content, pattern, label) {
  if (pattern.test(content)) fail(`forbidden ${label}`);
}

const indexHtml = read('index.html');
requireMatch(indexHtml, /<title>SagaTree<\/title>/, 'index.html title');

const pkg = JSON.parse(read('package.json'));
if (pkg.name !== 'SagaTree') fail(`package.json name must be SagaTree, got ${pkg.name}`);

const surfaces = [
  'src/app/shell/auth/LoginScreen.tsx',
  'src/app/shell/auth/AuthGate.tsx',
  'src/app/shell/Layout.tsx',
  'src/app/shell/ViewLoadingFallback.tsx',
  'src/app/shell/SagaTreeLogo.tsx',
];
for (const file of surfaces) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
  const content = read(file);
  requireMatch(content, /SagaTree/, `${file} SagaTree`);
  forbidMatch(content, />\s*SagaDrive\s*</, `${file} product heading SagaDrive`);
  if (/\bas any\b|eslint-disable|@ts-ignore|@ts-expect-error/.test(content)) {
    fail(`${file} type escape hatch`);
  }
}

requireMatch(read('src/app/shell/auth/LoginScreen.tsx'), /<h1[^>]*>SagaTree<\/h1>/, 'login h1');
requireMatch(read('src/app/shell/Layout.tsx'), /SagaTree/, 'layout brand');
requireMatch(read('src/app/shell/SagaTreeLogo.tsx'), /alt = 'SagaTree Logo'/, 'logo default alt');
requireMatch(read('src/app/shell/index.ts'), /SagaTreeLogo/, 'shell barrel export');

const smoke = read('e2e/smoke.app-loads.spec.ts');
requireMatch(smoke, /toHaveTitle\(\/SagaTree\/\)/, 'smoke title');
requireMatch(smoke, /heading.*SagaTree/, 'smoke heading');

const lore = read('src/domains/character/use-cases/character-lore-examples.ts');
requireMatch(lore, /SagaTree-Setting|SagaTree-Welt/, 'lore world frame');
forbidMatch(lore, /SagaDrive-Setting|SagaDrive-Welt/, 'lore still SagaDrive product world');

requireMatch(read('README.md'), /^# SagaTree\s*$/m, 'README H1');
requireMatch(read('scripts/test-gate.mjs'), /sagatree-brand-phase-a-check\.mjs/, 'test-gate');

console.log('SagaTree brand Phase A check OK');
