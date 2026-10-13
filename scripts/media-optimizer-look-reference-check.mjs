#!/usr/bin/env node
/**
 * media-optimizer-look-reference-check — look-reference optimize before Base64 (#639).
 * Location: scripts/media-optimizer-look-reference-check.mjs
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
const paths = [
  'src/app/look/create/LookReferenceAdaptionFlow.tsx',
  'src/app/look/create/look-reference-adaption.ts',
  'src/infrastructure/look/look-reference-analysis-service.ts',
];
for (const p of paths) check(existsSync(join(root, p)), `exists ${p}`);

const flow = readFileSync(join(root, paths[0]), 'utf8');
const adapt = readFileSync(join(root, paths[1]), 'utf8');
const svc = readFileSync(join(root, paths[2]), 'utf8');

section('2 · optimize before base64 + aggregate 12 MiB');
check(/prepareLookReferenceFileForAnalysis/.test(adapt), 'prepare helper');
check(/profileId:\s*['"]look-reference['"]/.test(adapt), 'look-reference profile');
check(/LOOK_ADAPTION_AGGREGATE_MAX_BYTES\s*=\s*12\s*\*\s*1024/.test(adapt), '12 MiB constant');
check(/createObjectURL\(file\)/.test(flow), 'immediate Object URL');
check(/prepareLookReferenceFileForAnalysis/.test(flow), 'flow calls prepare');
check(/LOOK_ADAPTION_AGGREGATE_MAX_BYTES/.test(flow), 'flow enforces aggregate');
check(/LOOK_REFERENCE_AGGREGATE_MAX_BYTES\s*=\s*12\s*\*\s*1024/.test(svc), 'service aggregate guard');
check(/contentBase64/.test(svc), 'still sends base64 to edge');

section('3 · failure keeps prior refs');
check(/Bisherige Referenzen bleiben erhalten/.test(flow), 'prior refs message');
check(/setReferences\(next\)/.test(flow), 'rolls back provisional on fail');

section('4 · typed-strict');
for (const [rel, text] of [
  [paths[0], flow],
  [paths[1], adapt],
  [paths[2], svc],
]) {
  const codeOnly = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check(!/\bany\b/.test(codeOnly), `${rel}: no any`);
  check(!/\bas\s+unknown\b/.test(codeOnly), `${rel}: no as unknown`);
}

if (failures > 0) {
  console.error(`\nmedia-optimizer-look-reference-check: ${failures} failure(s)`);
  process.exit(1);
}
console.log('media-optimizer-look-reference-check: OK');
