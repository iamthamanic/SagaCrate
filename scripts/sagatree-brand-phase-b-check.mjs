#!/usr/bin/env node
/**
 * sagatree-brand-phase-b-check — visible SagaTree Core ruleset label (#589 Phase B).
 * Location: scripts/sagatree-brand-phase-b-check.mjs
 *
 * Locks user-facing "SagaTree Core" copy. Canonical ruleset key `sagatree-core`.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function fail(message) {
  console.error(`SagaTree brand Phase B check failed: ${message}`);
  process.exit(1);
}

function requireMatch(content, pattern, label) {
  if (!pattern.test(content)) fail(`missing ${label}`);
}

function forbidMatch(content, pattern, label) {
  if (pattern.test(content)) fail(`forbidden ${label}`);
}

const creation = read('src/domains/rules/sagatree/character-creation/index.ts');
requireMatch(
  creation,
  /value:\s*'sagatree-core',\s*label:\s*'SagaTree Core'/,
  'ruleset option label SagaTree Core',
);
forbidMatch(creation, /label:\s*'SagaTree Core'/, 'ruleset still labeled SagaTree Core');

const readme = read('README.md');
requireMatch(readme, /### Elevator Pitch/, 'README Elevator Pitch section');
requireMatch(readme, /\*\*Für Spielleitung\*\*/, 'README pitch for DMs');
requireMatch(readme, /\*\*Für Spieler\*\*/, 'README pitch for players');
requireMatch(readme, /SagaTree Core/, 'README SagaTree Core');
forbidMatch(readme, /heißt weiterhin \*\*SagaTree Core\*\*/, 'README still keeps SagaTree Core');
forbidMatch(readme, /## SagaTree Core Character Editor/, 'README section still SagaTree Core Character Editor');
forbidMatch(readme, /\*\*SagaTree Core Editor\*\*/, 'README features still SagaTree Core Editor');

const pitchBlock = (readme.match(/### Elevator Pitch\n([\s\S]*?)(?=\n### |\n## )/) || [])[1] || '';
if (!pitchBlock) fail('could not isolate Elevator Pitch block');
if (/React|Vite|Supabase|Postgres/i.test(pitchBlock)) {
  fail('Elevator Pitch must stay product-first (no stack jargon in pitch block)');
}

const editor = read('src/app/character/edit/CharacterEditor.tsx');
forbidMatch(editor, /Wähle SagaTree Core/, 'editor toast still SagaTree Core');
requireMatch(editor, /Wähle SagaTree Core/, 'editor toast SagaTree Core');

const e2e = read('e2e/character-editor.spec.ts');
requireMatch(e2e, /SagaTree Core/, 'e2e expects SagaTree Core');
forbidMatch(e2e, /getByText\('SagaTree Core'\)/, 'e2e still asserts SagaTree Core');

requireMatch(read('scripts/test-gate.mjs'), /sagatree-brand-phase-b-check\.mjs/, 'test-gate');

console.log('SagaTree brand Phase B check OK');
