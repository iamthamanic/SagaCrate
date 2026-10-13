#!/usr/bin/env node
/**
 * sagatree-core-workflows-contract-check — static #606 contract (script + evidence shape).
 * Location: scripts/sagatree-core-workflows-contract-check.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error(`sagatree-core-workflows contract failed: ${msg}`);
  process.exit(1);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const scriptRel = 'scripts/sagatree-core-workflows-check.mjs';
const acceptanceRel = '.qa/acceptance/sagatree-core-workflows-real-apis.md';
const reportRel = '.qa/runs/sagatree-core-workflows/report.json';

if (!existsSync(join(root, scriptRel))) fail(`missing ${scriptRel}`);
if (!existsSync(join(root, acceptanceRel))) fail(`missing ${acceptanceRel}`);

const script = read(scriptRel);
for (const needle of [
  'auth/v1/token?grant_type=password',
  'create_play_session',
  'join_session_by_code',
  'character-portraits',
  'dm-tools/dice',
  'BLOCKED_604',
  'sagatree-regular',
  'PROJECT_SAFE',
  'select=${PROJECT_SAFE}',
]) {
  if (!script.includes(needle)) fail(`script missing ${JSON.stringify(needle)}`);
}

if (!existsSync(join(root, reportRel))) {
  fail(`missing live evidence ${reportRel} — run: node ${scriptRel}`);
}

let report;
try {
  report = JSON.parse(read(reportRel));
} catch (e) {
  fail(`report.json parse error: ${e}`);
}

if (report.stack !== 'sagatree-regular') fail('report.stack must be sagatree-regular');
if (report.ok !== true) fail('report.ok must be true');

const required = [
  'login.gm',
  'login.player',
  'project.create',
  'project.list',
  'session.create',
  'session.join_player',
  'session.mutate_rest',
  'session.player_read_after_mutate',
  'storage.upload',
  'storage.read',
  'edge.dm_tools_member',
];
const byName = Object.fromEntries((report.checks || []).map((c) => [c.name, c]));
for (const name of required) {
  if (!byName[name]?.pass) fail(`evidence missing pass for ${name}`);
}

const rt = report.realtime?.status;
if (rt !== 'PASS' && rt !== 'BLOCKED_604') {
  fail(`realtime.status must be PASS or BLOCKED_604 (got ${rt})`);
}

const edgeNegPass =
  byName['edge.dm_tools_anon_deny']?.pass && byName['edge.ai_gm_stranger_deny']?.pass;
if (!edgeNegPass) {
  fail('edge negative checks must PASS (anon deny + stranger deny; #607)');
}

console.log('✓ sagatree-core-workflows contract OK', {
  realtime: rt,
  checks: required.length,
});
