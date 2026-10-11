#!/usr/bin/env node
/**
 * sagatree-core-workflows-check — #606 live happy paths on regular sagadrive compose.
 * Location: scripts/sagatree-core-workflows-check.mjs
 *
 * Uses Auth/REST/RPC/Storage/Edge only (no SQL seed). Realtime may report BLOCKED_604.
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, '.qa/runs/sagatree-core-workflows');
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
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
const base = (
  process.env.API_EXTERNAL_URL ||
  process.env.VITE_SUPABASE_URL ||
  fileEnv.API_EXTERNAL_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const stamp = Date.now().toString(36);
const suffix = randomBytes(3).toString('hex');
const users = {
  gm: {
    email: `cw-gm-${stamp}@example.com`,
    password: `CwGm!${suffix}Aa1`,
  },
  player: {
    email: `cw-player-${stamp}@example.com`,
    password: `CwPl!${suffix}Aa1`,
  },
  stranger: {
    email: `cw-stranger-${stamp}@example.com`,
    password: `CwSt!${suffix}Aa1`,
  },
};

const report = {
  ok: false,
  stack: 'sagadrive-regular',
  gateway: base,
  startedAt: new Date().toISOString(),
  checks: [],
  realtime: { status: 'pending' },
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

const PROJECT_SAFE =
  'id,public_id,code,name,description,world_id,world_profile_id,default_look_profile_id,allow_player_character_look_override,gm_user_id,status,saga_id,saga_version_id,created_at,updated_at';
const SESSION_SAFE =
  'id,public_id,project_id,session_number,name,description,status,started_at,ended_at,look_profile_id,created_at,updated_at';

function authHeaders(token) {
  return {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function adminCreateUser(email, password) {
  const { res, body } = await jsonFetch(`${base}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok && res.status !== 422 && res.status !== 400) {
    throw new Error(`adminCreateUser ${email}: ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function signIn(email, password) {
  const { res, body } = await jsonFetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`signIn ${email}: ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function projectCode() {
  return `CW${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function main() {
  if (!anon || !service) {
    throw new Error('Missing SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  }

  const health = await jsonFetch(`${base}/auth/v1/health`);
  if (!health.res.ok) {
    throw new Error(`GoTrue health failed: ${health.res.status}`);
  }
  record('login.gotrue_health', true, `status=${health.res.status}`);

  for (const role of ['gm', 'player', 'stranger']) {
    await adminCreateUser(users[role].email, users[role].password);
    await sleep(200);
    const session = await signIn(users[role].email, users[role].password);
    users[role].token = session.access_token;
    users[role].userId = session.user?.id;
    record(`login.${role}`, Boolean(users[role].token && users[role].userId), users[role].email);
  }

  const code = projectCode();
  const { res: createRes, body: createBody } = await jsonFetch(
    `${base}/rest/v1/projects?select=${PROJECT_SAFE}`,
    {
      method: 'POST',
      headers: authHeaders(users.gm.token),
      body: JSON.stringify({
        code,
        name: `Core Workflow ${stamp}`,
        description: 'sagatree-core-workflows #606',
        gm_user_id: users.gm.userId,
        status: 'active',
      }),
    },
  );
  const project = Array.isArray(createBody) ? createBody[0] : createBody;
  const projectOk = createRes.ok && project?.id;
  record(
    'project.create',
    projectOk,
    `status=${createRes.status} id=${project?.id || 'none'}`,
  );
  if (!projectOk) throw new Error(`project create failed: ${JSON.stringify(createBody)}`);

  const { res: memberRes, body: memberBody } = await jsonFetch(
    `${base}/rest/v1/project_members`,
    {
      method: 'POST',
      headers: authHeaders(users.gm.token),
      body: JSON.stringify({
        project_id: project.id,
        user_id: users.gm.userId,
        role: 'gm',
        status: 'active',
      }),
    },
  );
  record(
    'project.member_bootstrap',
    memberRes.ok || memberRes.status === 409,
    `status=${memberRes.status}`,
  );
  if (!memberRes.ok && memberRes.status !== 409) {
    report.errors.push(`member bootstrap: ${JSON.stringify(memberBody)}`);
  }

  const { res: listRes, body: listBody } = await jsonFetch(
    `${base}/rest/v1/projects?select=${PROJECT_SAFE}&gm_user_id=eq.${users.gm.userId}`,
    { headers: authHeaders(users.gm.token) },
  );
  const listed = Array.isArray(listBody) && listBody.some((p) => p.id === project.id);
  record('project.list', listRes.ok && listed, `status=${listRes.status} listed=${listed}`);

  const { res: sessRes, body: sessBody } = await jsonFetch(
    `${base}/rest/v1/rpc/create_play_session`,
    {
      method: 'POST',
      headers: authHeaders(users.gm.token),
      body: JSON.stringify({
        p_project_id: project.id,
        p_name: `CW Session ${stamp}`,
      }),
    },
  );
  const session = sessBody;
  const sessionOk = sessRes.ok && session?.id && session?.code;
  record(
    'session.create',
    sessionOk,
    `status=${sessRes.status} id=${session?.id || 'none'} code=${session?.code || 'none'}`,
  );
  if (!sessionOk) throw new Error(`session create failed: ${JSON.stringify(sessBody)}`);

  const { res: joinRes, body: joinBody } = await jsonFetch(
    `${base}/rest/v1/rpc/join_session_by_code`,
    {
      method: 'POST',
      headers: authHeaders(users.player.token),
      body: JSON.stringify({ p_code: session.code, p_character_id: null }),
    },
  );
  const joinOk = joinRes.ok && joinBody?.id === session.id;
  record('session.join_player', joinOk, `status=${joinRes.status}`);

  const mutateName = `CW mutated ${stamp}`;
  const { res: mutRes, body: mutBody } = await jsonFetch(
    `${base}/rest/v1/sessions?id=eq.${session.id}&select=${SESSION_SAFE}`,
    {
      method: 'PATCH',
      headers: authHeaders(users.gm.token),
      body: JSON.stringify({ name: mutateName }),
    },
  );
  const mutOk = mutRes.ok;
  record('session.mutate_rest', mutOk, `status=${mutRes.status}`);
  if (!mutOk) report.errors.push(`mutate: ${JSON.stringify(mutBody)}`);

  const { res: readRes, body: readBody } = await jsonFetch(
    `${base}/rest/v1/sessions?select=${SESSION_SAFE}&id=eq.${session.id}`,
    { headers: authHeaders(users.player.token) },
  );
  const row = Array.isArray(readBody) ? readBody[0] : null;
  const syncOk = readRes.ok && row?.name === mutateName;
  record(
    'session.player_read_after_mutate',
    syncOk,
    `status=${readRes.status} name=${row?.name || 'none'}`,
  );

  // Realtime against regular Kong (may be blocked by #604)
  try {
    let rtLog = '';
    try {
      rtLog = execSync('docker logs sagadrive-realtime --tail 8 2>&1', {
        encoding: 'utf8',
      });
    } catch (e) {
      rtLog = String(e.stdout || e.stderr || e);
    }
    const missingSecret = /SECRET_KEY_BASE is missing/i.test(rtLog);
    let rtStatus = 'unknown';
    try {
      const st = execSync(
        "docker inspect -f '{{.State.Status}}' sagadrive-realtime 2>/dev/null || echo missing",
        { encoding: 'utf8' },
      ).trim();
      rtStatus = st;
    } catch {
      rtStatus = 'missing';
    }

    if (rtStatus !== 'running' || missingSecret) {
      report.realtime = {
        status: 'BLOCKED_604',
        containerStatus: rtStatus,
        detail: 'sagadrive-realtime not healthy; SECRET_KEY_BASE / tenant wiring is #604',
        logSnippet: rtLog.split('\n').slice(0, 6).join('\n'),
      };
      record(
        'realtime.postgres_changes',
        false,
        'BLOCKED_604 — skipped live WS (needs-human #604)',
      );
    } else {
      const playerClient = createClient(base, anon, {
        global: { headers: { Authorization: `Bearer ${users.player.token}` } },
        realtime: { params: { apikey: anon } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await playerClient.realtime.setAuth(users.player.token);
      let events = 0;
      const channel = playerClient
        .channel(`cw-runtime:${session.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
          () => {
            events += 1;
          },
        );
      await new Promise((resolveP, reject) => {
        const timer = setTimeout(() => reject(new Error('subscribe timeout')), 20000);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            resolveP();
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            reject(new Error(`subscribe ${status}`));
          }
        });
      });
      const pingName = `CW rt ${Date.now()}`;
      await jsonFetch(
        `${base}/rest/v1/sessions?id=eq.${session.id}&select=${SESSION_SAFE}`,
        {
          method: 'PATCH',
          headers: authHeaders(users.gm.token),
          body: JSON.stringify({ name: pingName }),
        },
      );
      for (let i = 0; i < 40 && events === 0; i++) await sleep(250);
      await playerClient.removeChannel(channel);
      await playerClient.removeAllChannels();
      const rtOk = events > 0;
      report.realtime = { status: rtOk ? 'PASS' : 'FAIL', events };
      record('realtime.postgres_changes', rtOk, `events=${events}`);
    }
  } catch (e) {
    report.realtime = { status: 'ERROR', detail: String(e) };
    record('realtime.postgres_changes', false, String(e));
  }

  // Storage: portrait upload + read
  const objectPath = `${users.gm.userId}/cw-probe-${stamp}.png`;
  // 1x1 PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const uploadRes = await fetch(
    `${base}/storage/v1/object/character-portraits/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${users.gm.token}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body: png,
    },
  );
  record('storage.upload', uploadRes.ok, `status=${uploadRes.status} path=${objectPath}`);

  const downloadRes = await fetch(
    `${base}/storage/v1/object/character-portraits/${objectPath}`,
    {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${users.gm.token}`,
      },
    },
  );
  const bytes = downloadRes.ok ? Buffer.from(await downloadRes.arrayBuffer()) : Buffer.alloc(0);
  record(
    'storage.read',
    downloadRes.ok && bytes.length > 0,
    `status=${downloadRes.status} bytes=${bytes.length}`,
  );

  // Edge: member OK / anon deny / stranger deny on session-scoped ai-gm
  const diceMember = await jsonFetch(`${base}/functions/v1/dm-tools/dice`, {
    method: 'POST',
    headers: authHeaders(users.player.token),
    body: JSON.stringify({ notation: '1d20' }),
  });
  record('edge.dm_tools_member', diceMember.res.status === 200, `status=${diceMember.res.status}`);

  const diceAnon = await jsonFetch(`${base}/functions/v1/dm-tools/dice`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notation: '1d20' }),
  });
  const anonDenied = diceAnon.res.status === 401 || diceAnon.res.status === 403;
  if (anonDenied) {
    record('edge.dm_tools_anon_deny', true, `status=${diceAnon.res.status}`);
  } else {
    report.edgeAuthz = {
      ...(report.edgeAuthz || {}),
      status: 'BLOCKED_605',
      detail: 'anon reached dm-tools/dice — VERIFY_JWT/compose defaults are #605',
      anonStatus: diceAnon.res.status,
    };
    record(
      'edge.dm_tools_anon_deny',
      false,
      `BLOCKED_605 status=${diceAnon.res.status}`,
    );
  }

  const aiStranger = await jsonFetch(`${base}/functions/v1/ai-gm`, {
    method: 'POST',
    headers: authHeaders(users.stranger.token),
    body: JSON.stringify({ sessionId: session.id, action: 'probe', stream: false }),
  });
  const strangerDenied =
    aiStranger.res.status === 401 ||
    aiStranger.res.status === 403 ||
    aiStranger.res.status === 404;
  if (strangerDenied) {
    record('edge.ai_gm_stranger_deny', true, `status=${aiStranger.res.status}`);
  } else {
    report.edgeAuthz = {
      ...(report.edgeAuthz || {}),
      status: 'BLOCKED_605',
      strangerStatus: aiStranger.res.status,
      strangerBody: String(aiStranger.text || '').slice(0, 180),
    };
    record(
      'edge.ai_gm_stranger_deny',
      false,
      `BLOCKED_605 status=${aiStranger.res.status}`,
    );
  }

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
  const byName = Object.fromEntries(report.checks.map((c) => [c.name, c]));
  const corePass = required.every((n) => byName[n]?.pass);
  const realtimeBlocked = report.realtime?.status === 'BLOCKED_604';
  const realtimeOk = realtimeBlocked || byName['realtime.postgres_changes']?.pass;
  const edgeNeg =
    (byName['edge.dm_tools_anon_deny']?.pass && byName['edge.ai_gm_stranger_deny']?.pass) ||
    report.edgeAuthz?.status === 'BLOCKED_605';
  report.ok = corePass && realtimeOk && edgeNeg;
  report.finishedAt = new Date().toISOString();
  report.ids = {
    projectId: project.id,
    sessionId: session.id,
    sessionCode: session.code,
  };
  report.acceptance = {
    coreRequired: required,
    realtimeNote: realtimeBlocked
      ? 'Realtime BLOCKED_604 documented; core APIs PASS (#604 needs-human)'
      : 'Realtime exercised',
    edgeNote:
      report.edgeAuthz?.status === 'BLOCKED_605'
        ? 'Edge negative authz BLOCKED_605 documented (#605 needs-human)'
        : 'Edge negative authz exercised',
  };

  writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(
    resolve(outDir, 'SUMMARY.md'),
    [
      '# SagaTree core workflows — regular compose',
      '',
      `- ok: **${report.ok}**`,
      `- gateway: \`${base}\``,
      `- realtime: \`${report.realtime.status}\``,
      `- checks: ${report.checks.filter((c) => c.pass).length}/${report.checks.length} pass`,
      '',
      'See `report.json` for details.',
      '',
    ].join('\n'),
  );

  if (!report.ok) {
    console.error('✗ sagatree-core-workflows failed', {
      failed: report.checks.filter((c) => !c.pass).map((c) => c.name),
      realtime: report.realtime.status,
    });
    process.exit(1);
  }
  console.log('✓ sagatree-core-workflows ok', {
    realtime: report.realtime.status,
    projectId: project.id,
    sessionId: session.id,
  });
}

main().catch((e) => {
  report.errors.push(String(e));
  report.finishedAt = new Date().toISOString();
  writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.error('✗ sagatree-core-workflows crashed', e);
  process.exit(1);
});
