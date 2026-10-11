#!/usr/bin/env node
/**
 * saga-editor-v2-check — #579 simulation templates in editor draft.
 * Location: scripts/saga-editor-v2-check.mjs
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
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
  console.error(`Saga editor v2 check failed: ${message}`);
  process.exit(1);
}

function requireMatch(content, pattern, label) {
  if (!pattern.test(content)) fail(`missing ${label}`);
}

const domain = read('src/domains/saga/contracts/saga-definition.ts');
requireMatch(domain, /emptySagaDefinitionSimulation/i, 'empty sim');
requireMatch(domain, /dornhainSimulationDefaults/i, 'dornhain defaults');
requireMatch(domain, /factions/i, 'factions');
requireMatch(domain, /whenThreatId/i, 'whenThreatId');
requireMatch(domain, /simulation:\s*\{/i, 'draftToPayload simulation object');
if (/simulation:\s*null/.test(domain) && /draftToPayload/.test(domain)) {
  // allow null only outside draftToPayload return — ensure return is not null
  const fn = domain.slice(domain.indexOf('export function draftToPayload'));
  if (/simulation:\s*null/.test(fn.slice(0, 800))) fail('draftToPayload must not force simulation null');
}

const nav = read('src/app/saga/editor/saga-editor-sections.ts');
for (const id of ['threats', 'deadlines', 'rules', 'factions']) {
  requireMatch(nav, new RegExp(`'${id}'`), `nav ${id}`);
}

const screen = read('src/app/saga/editor/SagaEditorScreen.tsx');
requireMatch(screen, /SagaEditorThreatsSection/i, 'threats section');
requireMatch(screen, /SagaEditorDeadlinesSection/i, 'deadlines section');
requireMatch(screen, /SagaEditorRulesSection/i, 'rules section');
requireMatch(screen, /SagaEditorFactionsSection/i, 'factions section');

const hook = read('src/app/saga/editor/useSagaDefinitionEditor.ts');
requireMatch(hook, /simulation:/i, 'cloneDraft simulation');

for (const file of [
  'src/app/saga/editor/SagaEditorThreatsSection.tsx',
  'src/app/saga/editor/SagaEditorDeadlinesSection.tsx',
  'src/app/saga/editor/SagaEditorRulesSection.tsx',
  'src/app/saga/editor/SagaEditorFactionsSection.tsx',
]) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
  requireMatch(read(file), /min-h-11/i, `${file} Fitts`);
  requireMatch(read(file), /data-saga-editor-section/i, `${file} section marker`);
}

const gate = read('scripts/test-gate.mjs');
if (!gate.includes('saga-editor-v2-check.mjs')) fail('test-gate must wire v2 check');

const touched = [
  domain,
  nav,
  screen,
  hook,
  read('src/app/saga/editor/SagaEditorThreatsSection.tsx'),
  read('src/app/saga/editor/SagaEditorDeadlinesSection.tsx'),
  read('src/app/saga/editor/SagaEditorRulesSection.tsx'),
  read('src/app/saga/editor/SagaEditorFactionsSection.tsx'),
];
for (const content of touched) {
  if (/\bas any\b|eslint-disable|@ts-ignore|@ts-expect-error/.test(content)) {
    fail('type escape hatch');
  }
}

const esbuild = require('esbuild');
const cacheDir = join(root, 'node_modules/.cache/saga-editor-v2-check');
mkdirSync(cacheDir, { recursive: true });
const out = join(cacheDir, 'def.mjs');
esbuild.buildSync({
  entryPoints: [join(root, 'src/domains/saga/contracts/saga-definition.ts')],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  packages: 'bundle',
});
const mod = await import(pathToFileURL(out).href);

const draft = {
  sagaId: 's',
  sagaSlug: 'dornhain-copy',
  origin: 'user',
  canEdit: true,
  title: 'T',
  blurb: 'b',
  locations: [],
  knowledgeFacts: [],
  pregens: [],
  packageId: 'package:dornhain.whisper.v1',
  simulation: mod.emptySagaDefinitionSimulation(),
};
const payload = mod.draftToPayload(draft);
if (!payload.simulation || payload.simulation === null) fail('payload must include simulation');

const bad = {
  ...draft,
  simulation: {
    ...mod.emptySagaDefinitionSimulation(),
    threats: [
      {
        id: 'danger',
        label: 'D',
        max: 4,
        tickPerDay: 1,
        visibility: 'shared',
        doomSummaryPlayer: '',
        doomSummaryGm: '',
      },
    ],
    rules: [
      {
        id: 'r1',
        label: 'R',
        whenKind: 'threat-at-least',
        whenThreatId: 'missing',
        thenKinds: ['emit-event'],
      },
    ],
  },
};
const errs = mod.validateSagaDefinitionDraft(bad);
if (!errs.simulation) fail('expected rule threat id validation');

const vm = {
  sagaId: 's',
  sagaSlug: 'dornhain',
  title: 'D',
  synopsis: 's',
  origin: 'native',
  versionId: 'v',
  versionLabel: 'draft',
  status: 'draft',
  revision: 1,
  canEdit: false,
  payload: {
    packageId: 'package:dornhain.whisper.v1',
    title: 'D',
    blurb: 'b',
    synopsis: 'b',
    knowledgeFacts: [],
    locations: [],
    pregens: [],
    simulation: null,
  },
};
const seeded = mod.editorVmToDraft(vm);
if (seeded.simulation.threats.length < 2) fail('dornhain draft should seed threats');

console.log('Saga editor v2 check passed.');
