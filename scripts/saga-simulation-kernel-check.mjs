#!/usr/bin/env node
/**
 * saga-simulation-kernel-check — #576 pure advanceTime + v1→v2 upgrade.
 * Location: scripts/saga-simulation-kernel-check.mjs
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function fail(message) {
  console.error(`Saga simulation kernel check failed: ${message}`);
  process.exit(1);
}

function requireMatch(content, pattern, label) {
  if (!pattern.test(content)) fail(`missing ${label}`);
}

const simDir = join(root, 'src/domains/saga/simulation');
if (!existsSync(simDir)) fail('missing src/domains/saga/simulation');

const simFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else if (name.name.endsWith('.ts')) simFiles.push(p);
  }
}
walk(simDir);

for (const file of simFiles) {
  const content = readFileSync(file, 'utf8');
  if (/from ['"]react['"]|from ['"]@supabase|supabase\.|useState|useEffect/.test(content)) {
    fail(`React/Supabase import in ${file}`);
  }
  if (/\bas any\b|eslint-disable|@ts-ignore|@ts-expect-error/.test(content)) {
    fail(`type escape hatch in ${file}`);
  }
}

const runtime = read('src/domains/session/contracts/adventure-runtime-state.ts');
requireMatch(runtime, /ADVENTURE_RUNTIME_SCHEMA_VERSION_V2/i, 'v2 constant');
requireMatch(runtime, /upgradeAdventureRuntimeV1toV2/i, 'upgrade export');
requireMatch(runtime, /AdventureRuntimeStateV2/i, 'v2 type');

const domain = read('src/domains/saga/contracts/saga-definition.ts');
requireMatch(domain, /simulation/i, 'definition simulation slice');

const advance = read('src/domains/saga/simulation/advance-time.ts');
requireMatch(advance, /export function advanceTime/i, 'advanceTime');
requireMatch(advance, /proposedEvents/i, 'proposedEvents');

const gate = read('scripts/test-gate.mjs');
if (!gate.includes('saga-simulation-kernel-check.mjs')) {
  fail('test-gate must invoke saga-simulation-kernel-check.mjs');
}

const esbuild = require('esbuild');
const cacheDir = join(root, 'node_modules/.cache/saga-simulation-kernel-check');
mkdirSync(cacheDir, { recursive: true });
const out = join(cacheDir, 'sim.mjs');
esbuild.buildSync({
  entryPoints: [join(root, 'src/domains/saga/simulation/index.ts')],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  packages: 'bundle',
});
const mod = await import(pathToFileURL(out).href);
const { advanceTime, MINI_SAGA_SIMULATION, miniSagaV1State, createSeededRng } = mod;
if (typeof advanceTime !== 'function') fail('advanceTime missing from bundle');
if (typeof createSeededRng !== 'function') fail('createSeededRng missing');

const stateV1 = miniSagaV1State();
const a = advanceTime({
  state: stateV1,
  definition: MINI_SAGA_SIMULATION,
  days: 3,
  seed: 42,
});
const b = advanceTime({
  state: stateV1,
  definition: MINI_SAGA_SIMULATION,
  days: 3,
  seed: 42,
});

if (a.nextState.schemaVersion !== 2) fail('expected schemaVersion 2');
if (a.nextState.time.day !== 3) fail(`expected day 3, got ${a.nextState.time.day}`);
if (JSON.stringify(a.proposedEvents) !== JSON.stringify(b.proposedEvents)) {
  fail('advanceTime not deterministic for same seed');
}

const zero = advanceTime({
  state: stateV1,
  definition: MINI_SAGA_SIMULATION,
  days: 0,
  seed: 7,
});
if (zero.nextState.time.day !== 0) fail('days=0 should not advance calendar');
if (zero.proposedEvents.length !== 0) fail('days=0 should emit no events');

const deadline = a.proposedEvents.find((e) => e.kind === 'deadline');
if (!deadline) fail('expected deadline event on day 3');
if (deadline.summaryPlayer !== 'Der Markttag ist da.') fail('deadline player summary');

const danger = a.nextState.threats.find((t) => t.id === 'danger');
if (!danger || danger.value !== 3) {
  fail(`expected danger value 3 after 3 ticks, got ${danger?.value}`);
}
if (a.proposedEvents.some((e) => e.kind === 'threat_doom')) {
  fail('doom must not fire before threat reaches max');
}

const four = advanceTime({
  state: stateV1,
  definition: MINI_SAGA_SIMULATION,
  days: 4,
  seed: 42,
});
const doom4 = four.proposedEvents.filter((e) => e.kind === 'threat_doom');
if (doom4.length !== 1) fail(`expected exactly one doom event, got ${doom4.length}`);
if (four.nextState.threats.find((t) => t.id === 'danger')?.impendingDoomFired !== true) {
  fail('impendingDoomFired should be true');
}
const five = advanceTime({
  state: four.nextState,
  definition: MINI_SAGA_SIMULATION,
  days: 1,
  seed: 42,
});
const doom5 = five.proposedEvents.filter((e) => e.kind === 'threat_doom');
if (doom5.length !== 0) fail('doom must fire only once');

const rngA = createSeededRng(99);
const rngB = createSeededRng(99);
if (rngA.next() !== rngB.next()) fail('rng not deterministic');

console.log('Saga simulation kernel check passed.');
