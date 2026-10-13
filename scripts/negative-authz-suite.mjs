#!/usr/bin/env node
/**
 * negative-authz-suite — live #607 deny paths on regular sagatree compose.
 * Location: scripts/negative-authz-suite.mjs
 *
 * Proves: anon / invalid JWT / foreign session (stranger) / non-member REST.
 * Writes evidence to `.qa/runs/negative-authz-suite/`.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, '.qa/runs/negative-authz-suite');
mkdirSync(outDir, { recursive: true });

function loadEnvFile(rel) {
  const path = resolve(root, rel);
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

const fileEnv = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local') };
const anon = process.env.SUPABASE_ANON_KEY || fileEnv.SUPABASE_ANON_KEY;
const base = (
  process.env.API_EXTERNAL_URL ||
  process.env.VITE_SUPABASE_URL ||
  fileEnv.API_EXTERNAL_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const stamp = Date.now().toString(36);
const suffix = randomBytes(3).toString('hex');

const report = {
  ok: false,
  suite: 'negative-authz-suite',
  gateway: base,
  startedAt: new Date().toISOString(),
  checks: [],
  errors: [],
};

function record(name, pass, detail = '') {
  report.checks.push({ name, pass, detail });
  console.log(pass ? '✓' : '✗', name, detail);
}

async function jsonFetch(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body, text };
}

function authHeaders(token) {
  return {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function isDenied(status) {
  return status === 401 || status === 403 || status === 404;
}

async function signup(email, password) {
  const { res, body, text } = await jsonFetch(`${base}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signup ${email}: ${res.status} ${text.slice(0, 160)}`);
  const token = body?.access_token;
  const userId = body?.user?.id;
  if (!token || !userId) throw new Error(`signup ${email}: missing access_token/user.id`);
  return { token, userId };
}

function projectCode() {
  return `NZ${suffix}`.slice(0, 8).toUpperCase();
}

async function main() {
  if (!anon) {
    report.errors.push('SUPABASE_ANON_KEY missing');
    writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const anonDice = await jsonFetch(`${base}/functions/v1/dm-tools/dice`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ notation: '1d20' }),
  });
  record(
    'edge.anon_no_bearer_deny',
    isDenied(anonDice.res.status),
    `status=${anonDice.res.status} body=${String(anonDice.text || '').slice(0, 120)}`,
  );

  const badJwt = await jsonFetch(`${base}/functions/v1/dm-tools/dice`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: 'Bearer not.a.valid.jwt',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notation: '1d20' }),
  });
  record(
    'edge.invalid_jwt_deny',
    isDenied(badJwt.res.status),
    `status=${badJwt.res.status} body=${String(badJwt.text || '').slice(0, 120)}`,
  );

  const gmEmail = `naz-gm-${stamp}@example.com`;
  const strangerEmail = `naz-stranger-${stamp}@example.com`;
  const password = `Naz!${suffix}Aa1`;
  let gm;
  let stranger;
  try {
    gm = await signup(gmEmail, password);
    stranger = await signup(strangerEmail, password);
    record('auth.signup_gm_stranger', true, 'ok');
  } catch (e) {
    record('auth.signup_gm_stranger', false, String(e.message || e));
    report.finishedAt = new Date().toISOString();
    writeEvidence();
    process.exit(1);
  }

  const memberDice = await jsonFetch(`${base}/functions/v1/dm-tools/dice`, {
    method: 'POST',
    headers: authHeaders(gm.token),
    body: JSON.stringify({ notation: '1d20' }),
  });
  record(
    'edge.member_jwt_allow',
    memberDice.res.status === 200,
    `status=${memberDice.res.status}`,
  );

  const projectRes = await jsonFetch(`${base}/rest/v1/projects?select=id,name,gm_user_id`, {
    method: 'POST',
    headers: authHeaders(gm.token),
    body: JSON.stringify({
      code: projectCode(),
      name: `naz-${stamp}`,
      description: 'negative-authz-suite #607',
      gm_user_id: gm.userId,
      status: 'active',
    }),
  });
  const project = Array.isArray(projectRes.body) ? projectRes.body[0] : projectRes.body;
  record(
    'rest.project_create',
    projectRes.res.status < 300 && Boolean(project?.id),
    `status=${projectRes.res.status}`,
  );

  if (project?.id) {
    await jsonFetch(`${base}/rest/v1/project_members`, {
      method: 'POST',
      headers: authHeaders(gm.token),
      body: JSON.stringify({
        project_id: project.id,
        user_id: gm.userId,
        role: 'gm',
        status: 'active',
      }),
    });
  }

  let sessionId = null;
  if (project?.id) {
    const sessionRpc = await jsonFetch(`${base}/rest/v1/rpc/create_play_session`, {
      method: 'POST',
      headers: authHeaders(gm.token),
      body: JSON.stringify({ p_project_id: project.id, p_name: `naz-sess-${stamp}` }),
    });
    sessionId = sessionRpc.body?.id || null;
    record(
      'rpc.session_create',
      sessionRpc.res.status < 300 && Boolean(sessionId),
      `status=${sessionRpc.res.status}`,
    );
  } else {
    record('rpc.session_create', false, 'skipped — no project');
  }

  if (sessionId) {
    const strangerAi = await jsonFetch(`${base}/functions/v1/ai-gm`, {
      method: 'POST',
      headers: authHeaders(stranger.token),
      body: JSON.stringify({ sessionId, action: 'probe', stream: false }),
    });
    record(
      'edge.ai_gm_foreign_session_deny',
      isDenied(strangerAi.res.status),
      `status=${strangerAi.res.status} body=${String(strangerAi.text || '').slice(0, 140)}`,
    );
  } else {
    record('edge.ai_gm_foreign_session_deny', false, 'skipped — no session');
  }

  if (project?.id) {
    const strangerRead = await jsonFetch(
      `${base}/rest/v1/projects?id=eq.${project.id}&select=id,name`,
      { headers: authHeaders(stranger.token) },
    );
    const rows = Array.isArray(strangerRead.body) ? strangerRead.body : [];
    const deniedOrEmpty =
      isDenied(strangerRead.res.status) ||
      (strangerRead.res.status === 200 && rows.length === 0);
    record(
      'rest.non_member_project_deny',
      deniedOrEmpty,
      `status=${strangerRead.res.status} rows=${rows.length}`,
    );
  } else {
    record('rest.non_member_project_deny', false, 'skipped — no project');
  }

  const required = [
    'edge.anon_no_bearer_deny',
    'edge.invalid_jwt_deny',
    'edge.member_jwt_allow',
    'edge.ai_gm_foreign_session_deny',
    'rest.non_member_project_deny',
  ];
  const byName = Object.fromEntries(report.checks.map((c) => [c.name, c]));
  report.ok = required.every((n) => byName[n]?.pass);
  report.finishedAt = new Date().toISOString();
  writeEvidence();
  if (!report.ok) process.exit(1);
}

function writeEvidence() {
  writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(
    resolve(outDir, 'SUMMARY.md'),
    [
      '# Negative authz suite (#607)',
      '',
      `- ok: **${report.ok}**`,
      `- gateway: \`${base}\``,
      `- checks: ${report.checks.filter((c) => c.pass).length}/${report.checks.length} pass`,
      '',
      'See `report.json`.',
      '',
    ].join('\n'),
  );
  console.log(report.ok ? 'negative-authz-suite: PASS' : 'negative-authz-suite: FAIL');
}

main().catch((e) => {
  report.errors.push(String(e?.stack || e));
  report.finishedAt = new Date().toISOString();
  writeEvidence();
  console.error(e);
  process.exit(1);
});
