#!/usr/bin/env node
/**
 * realtime-compose-boot-check — evidence that regular-stack Realtime boots (#604).
 * Location: scripts/realtime-compose-boot-check.mjs
 *
 * Checks: container running, no SECRET_KEY_BASE crash, Kong /realtime path,
 * optional WS subscribe when SUPABASE URL + anon + user JWT available.
 */
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost:8000';
const anon =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

function detectRt() {
  for (const name of [process.env.REALTIME_CONTAINER, 'sagatree-realtime'].filter(Boolean)) {
    try {
      const st = execFileSync('docker', ['inspect', '-f', '{{.State.Status}}', name], {
        encoding: 'utf8',
      }).trim();
      if (st) return { name, status: st };
    } catch {
      /* next */
    }
  }
  return { name: 'sagatree-realtime', status: 'missing' };
}

function logs(name) {
  try {
    return execFileSync('docker', ['logs', name, '--tail', '60'], {
      encoding: 'utf8',
    });
  } catch (e) {
    return String(e.stderr || e.stdout || e);
  }
}

const report = {
  feature: 'realtime-compose-boot',
  issue: 604,
  at: new Date().toISOString(),
  base,
  checks: [],
  ok: false,
};

function check(name, ok, detail) {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'ok' : 'FAIL'}: ${name} — ${detail}`);
}

const rt = detectRt();
check('container.running', rt.status === 'running', `${rt.name} status=${rt.status}`);

const rtLog = logs(rt.name);
const missingSecret = /SECRET_KEY_BASE is missing/i.test(rtLog);
check('container.secret_key_base', !missingSecret, missingSecret ? 'SECRET_KEY_BASE missing' : 'boot past SECRET_KEY_BASE');

// Kong health / realtime route (HTTP upgrade will 400/401 without WS — not 503 DNS)
let kongCode = 0;
try {
  const out = execFileSync(
    'curl',
    ['-sS', '-o', '/dev/null', '-w', '%{http_code}', `${base}/realtime/v1/websocket?vsn=2.0.0`],
    { encoding: 'utf8' },
  ).trim();
  kongCode = Number(out);
} catch (e) {
  kongCode = 0;
  check('kong.realtime_route', false, String(e.message || e));
}
// 400/401/403/426 = reached upstream or Kong; 502/503 = broken upstream/DNS
const kongOk = kongCode > 0 && kongCode !== 502 && kongCode !== 503;
check('kong.realtime_route', kongOk, `HTTP ${kongCode} (expect not 502/503)`);

// Optional authenticated subscribe when token provided
const userJwt = process.env.REALTIME_CHECK_USER_JWT || '';
if (anon && userJwt) {
  try {
    const client = createClient(base, anon, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
      realtime: { params: { apikey: anon } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await client.realtime.setAuth(userJwt);
    const channel = client.channel(`boot-check-${Date.now()}`);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('subscribe timeout')), 20000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          resolve();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          reject(new Error(status));
        }
      });
    });
    await channel.unsubscribe();
    await client.removeAllChannels();
    check('ws.subscribe', true, 'SUBSCRIBED then unsubscribe');
  } catch (e) {
    check('ws.subscribe', false, String(e.message || e));
  }
} else {
  check(
    'ws.subscribe',
    true,
    'skipped (set REALTIME_CHECK_USER_JWT + anon for live subscribe); container+Kong gates required',
  );
}

report.ok = report.checks.every((c) => c.ok);
report.logSnippet = rtLog.split('\n').slice(-12).join('\n');

mkdirSync(join(root, '.qa/runs'), { recursive: true });
const outPath = join(root, '.qa/runs/realtime-compose-boot.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
writeFileSync(
  join(root, '.qa/runs/realtime-compose-boot.md'),
  `# Realtime compose boot (#604)\n\n- ok: ${report.ok}\n- container: ${rt.name} (${rt.status})\n- kong HTTP: ${kongCode}\n- at: ${report.at}\n\nSee \`realtime-compose-boot.json\`.\n`,
);
console.log(`wrote ${outPath} ok=${report.ok}`);
process.exit(report.ok ? 0 : 1);
