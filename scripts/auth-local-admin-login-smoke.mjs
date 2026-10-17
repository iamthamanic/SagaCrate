#!/usr/bin/env node
/**
 * Smoke: Local Admin GoTrue password grant must succeed when the stack is up.
 * Location: scripts/auth-local-admin-login-smoke.mjs
 *
 * Skips (exit 0) when Kong/GoTrue is unreachable — does not fail offline laptops.
 * When reachable: requires HTTP 200 + access_token for admin@sagatree.local / 1234.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

function readEnv(key) {
  if (!fs.existsSync(envPath)) return null;
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(key.length + 1).trim();
}

const base = (readEnv('VITE_SUPABASE_URL') || 'http://localhost:8000').replace(/\/$/, '');
const anon = readEnv('VITE_SUPABASE_ANON_KEY');

if (!anon) {
  console.log('auth-local-admin-login-smoke: SKIP (no VITE_SUPABASE_ANON_KEY)');
  process.exit(0);
}

const healthUrl = `${base}/auth/v1/health`;
let healthOk = false;
try {
  const h = await fetch(healthUrl, { signal: AbortSignal.timeout(2_000) });
  healthOk = h.ok;
} catch {
  healthOk = false;
}

if (!healthOk) {
  console.log('auth-local-admin-login-smoke: SKIP (GoTrue unreachable)');
  process.exit(0);
}

const tokenUrl = `${base}/auth/v1/token?grant_type=password`;
const res = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@sagatree.local',
    password: '1234',
  }),
  signal: AbortSignal.timeout(5_000),
});

const body = await res.json().catch(() => ({}));
if (res.status !== 200 || !body.access_token || body.user?.email !== 'admin@sagatree.local') {
  console.error('auth-local-admin-login-smoke: FAIL', {
    status: res.status,
    error: body.error || body.msg,
    email: body.user?.email,
    hasToken: Boolean(body.access_token),
  });
  process.exit(1);
}

console.log('auth-local-admin-login-smoke: OK (GoTrue admin/1234 → JWT)');
