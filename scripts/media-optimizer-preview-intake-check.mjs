#!/usr/bin/env node
/**
 * media-optimizer-preview-intake-check — preview-first intake hook (#634).
 * Location: scripts/media-optimizer-preview-intake-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
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
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  check(ok, `${message} (got ${JSON.stringify(actual)})`);
}

section('1 · files');

const paths = [
  'src/app/media/index.ts',
  'src/app/media/intake/useMediaOptimizeIntake.ts',
  'src/app/media/intake/intake-types.ts',
  'src/app/media/intake/intake-session.ts',
  'src/app/media/intake/object-url-registry.ts',
];
for (const p of paths) {
  check(existsSync(join(root, p)), `exists ${p}`);
}

section('2 · barrel + hook contracts');

const barrel = readFileSync(join(root, 'src/app/media/index.ts'), 'utf8');
const hook = readFileSync(join(root, 'src/app/media/intake/useMediaOptimizeIntake.ts'), 'utf8');
const types = readFileSync(join(root, 'src/app/media/intake/intake-types.ts'), 'utf8');

check(/export \{ useMediaOptimizeIntake \}/.test(barrel), 'barrel exports useMediaOptimizeIntake');
check(!/engines\/image/.test(barrel), 'barrel does not leak image engine');
check(/createObjectURL|registry\.create|ensureRegistry/.test(hook), 'hook creates Object URL');
check(/previewing/.test(hook) && /optimizing/.test(hook), 'hook uses previewing then optimizing');
check(
  ['ready', 'uploading', 'complete', 'aborted', 'failed'].every((s) => types.includes(`'${s}'`)),
  'intake statuses include ready/uploading/complete/aborted/failed',
);
check(/shouldApplyCompletion/.test(hook), 'hook guards stale completions');
check(/revokeAll|revokeObjectURL/.test(hook), 'hook revokes Object URLs');
check(/disposedRef/.test(hook), 'hook marks disposed on unmount');
check(/statusLabelDe|MEDIA_INTAKE_STATUS_LABEL_DE/.test(hook + types), 'German AU status labels');
check(/canRetry/.test(hook + types), 'retry capability exposed');
check(/optimizeMedia/.test(hook), 'hook calls optimizeMedia facade');
check(!/supabase/.test(hook), 'hook has no supabase');
check(
  !/\bany\b/.test(hook.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')),
  'hook: no any',
);
check(!/\bas\s+unknown\b/.test(hook), 'hook: no as unknown');
check(
  /setStatus\(['"]previewing['"]\)[\s\S]*Promise\.resolve\(\)[\s\S]*setStatus\(['"]optimizing['"]\)/.test(
    hook,
  ),
  'previewing before optimizing (Object URL first)',
);

section('3 · runtime unit (esbuild bundle of pure helpers)');

const outdir = join(root, 'node_modules', '.cache', 'media-optimizer-preview-intake-check');
mkdirSync(outdir, { recursive: true });
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');

const entry = join(outdir, 'entry.ts');
const { writeFileSync } = await import('node:fs');
writeFileSync(
  entry,
  `
export {
  createObjectUrlRegistry,
} from '../../../src/app/media/intake/object-url-registry.ts';
export {
  nextGeneration,
  shouldApplyCompletion,
  statusAfterOptimizeTerminal,
  statusAfterAbort,
} from '../../../src/app/media/intake/intake-session.ts';
export {
  mediaIntakeCanRetry,
  mediaIntakeIsBusy,
  mediaIntakeStatusLabelDe,
  MEDIA_INTAKE_STATUSES,
} from '../../../src/app/media/intake/intake-types.ts';
`,
);

execFileSync(
  esbuild,
  [entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${join(outdir, 'intake.mjs')}`],
  { stdio: 'inherit' },
);

const mod = await import(pathToFileURL(join(outdir, 'intake.mjs')).href);

const created = [];
const revoked = [];
const reg = mod.createObjectUrlRegistry({
  create: () => {
    const u = `blob:${created.length}`;
    created.push(u);
    return u;
  },
  revoke: (u) => {
    revoked.push(u);
  },
});
const u1 = reg.create({});
const u2 = reg.create({});
check(created.length === 2, 'registry creates two urls');
reg.revokeAll();
check(revoked.includes(u1) && revoked.includes(u2), 'revokeAll revokes both');

let g = 0;
g = mod.nextGeneration(g);
equal(g, 1, 'nextGeneration');
check(mod.shouldApplyCompletion(1, 1, false) === true, 'same gen applies');
check(mod.shouldApplyCompletion(2, 1, false) === false, 'stale gen ignored');
check(mod.shouldApplyCompletion(1, 1, true) === false, 'disposed ignored');
equal(mod.statusAfterOptimizeTerminal('optimized'), 'ready', 'optimized→ready');
equal(mod.statusAfterOptimizeTerminal('unchanged'), 'ready', 'unchanged→ready');
equal(mod.statusAfterOptimizeTerminal('failed'), 'failed', 'failed');
equal(mod.statusAfterOptimizeTerminal('aborted'), 'aborted', 'aborted');
equal(mod.statusAfterOptimizeTerminal('over-budget'), 'failed', 'over-budget→failed');
equal(mod.statusAfterAbort('optimizing'), 'aborted', 'abort busy');
equal(mod.statusAfterAbort('complete'), 'complete', 'abort ignores complete');
check(mod.mediaIntakeCanRetry('failed') && mod.mediaIntakeCanRetry('aborted'), 'retry');
check(mod.mediaIntakeIsBusy('optimizing') && !mod.mediaIntakeIsBusy('ready'), 'busy');
check(
  typeof mod.mediaIntakeStatusLabelDe('optimizing') === 'string' &&
    mod.mediaIntakeStatusLabelDe('optimizing').length > 0,
  'DE label',
);
check(mod.MEDIA_INTAKE_STATUSES.includes('previewing'), 'previewing in statuses');

if (failures > 0) {
  console.error(`\nmedia-optimizer-preview-intake-check: ${failures} failure(s)`);
  process.exit(1);
}

console.log('media-optimizer-preview-intake-check: OK');
