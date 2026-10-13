#!/usr/bin/env node
/**
 * seed-realtime-tenant — migrate + seed Realtime public.tenants for self-host (#604).
 * Location: scripts/minimal-proof/seed-realtime-tenant.mjs
 *
 * Steps:
 * 1. `/app/bin/migrate` on the realtime container (creates public.tenants/extensions)
 * 2. `Realtime.Api.create_tenant` via `/app/bin/realtime rpc` when missing
 * 3. Verify row for Host-based external_id (default `localhost`)
 *
 * Never deletes volumes. DB password is read from the realtime container env only.
 *
 * Usage:
 *   node scripts/minimal-proof/seed-realtime-tenant.mjs
 *   REALTIME_SELF_HOST_TENANT=localhost DB_CONTAINER=<db-container> node …
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const externalId = process.env.REALTIME_SELF_HOST_TENANT || 'localhost';

function detectContainer(names) {
  for (const name of names) {
    try {
      const st = execFileSync('docker', ['inspect', '-f', '{{.State.Status}}', name], {
        encoding: 'utf8',
      }).trim();
      if (st === 'running') return name;
    } catch {
      /* next */
    }
  }
  for (const name of names) {
    try {
      execFileSync('docker', ['inspect', name], { encoding: 'utf8' });
      return name;
    } catch {
      /* next */
    }
  }
  return null;
}

const rtContainer =
  process.env.REALTIME_CONTAINER || detectContainer(['sagatree-realtime']);
const dbContainer = process.env.DB_CONTAINER || detectContainer(['sagatree-db']);

const report = {
  ok: false,
  externalId,
  rtContainer,
  dbContainer,
  steps: [],
  at: new Date().toISOString(),
};

function step(name, ok, detail) {
  report.steps.push({ name, ok, detail });
  console.log(`${ok ? 'ok' : 'FAIL'}: ${name} — ${detail}`);
}

function sh(args, opts = {}) {
  return execFileSync(args[0], args.slice(1), {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    ...opts,
  }).trim();
}

if (!rtContainer || !dbContainer) {
  step('containers', false, `rt=${rtContainer} db=${dbContainer}`);
} else {
  try {
    const rtStatus = sh(['docker', 'inspect', '-f', '{{.State.Status}}', rtContainer]);
    step('realtime.running', rtStatus === 'running', `status=${rtStatus}`);

    try {
      sh(['docker', 'exec', rtContainer, '/app/bin/migrate']);
      step('realtime.migrate', true, 'migrate completed');
    } catch (e) {
      const msg = String(e.stderr || e.stdout || e.message || e);
      // Already migrated is fine
      const ok = /Migrated|already|up to date|==/i.test(msg) || e.status === 0;
      step('realtime.migrate', ok, msg.split('\n').slice(-3).join(' | ').slice(0, 240));
      if (!ok) throw e;
    }

    const count = sh([
      'docker',
      'exec',
      dbContainer,
      'psql',
      '-U',
      'postgres',
      '-tAc',
      `SELECT count(*)::text FROM public.tenants WHERE external_id = '${externalId.replace(/'/g, "''")}'`,
    ]);

    if (Number(count.trim()) >= 1) {
      step('realtime.tenant_row', true, `external_id=${externalId} already present`);
    } else {
      // Escape for Elixir string — only inject external_id; secrets from container env
      const elixir = `
jwt = System.get_env("API_JWT_SECRET") || System.get_env("JWT_SECRET")
db_pass = System.get_env("DB_PASSWORD")
attrs = %{
  "external_id" => ${JSON.stringify(externalId)},
  "name" => ${JSON.stringify(externalId)},
  "jwt_secret" => jwt,
  "extensions" => [
    %{
      "type" => "postgres_cdc_rls",
      "settings" => %{
        "db_host" => "supabase-db",
        "db_name" => "postgres",
        "db_password" => db_pass,
        "db_port" => "5432",
        "db_user" => "postgres",
        "poll_interval_ms" => 100,
        "poll_max_changes" => 100,
        "poll_max_record_bytes" => 1_048_576,
        "publication" => "supabase_realtime",
        "region" => "us-east-1",
        "slot_name" => "supabase_realtime_replication_slot",
        "ssl_enforced" => false
      }
    }
  ]
}
case Realtime.Api.create_tenant(attrs) do
  {:ok, t} -> IO.puts("SEED_OK:" <> t.external_id)
  {:error, err} -> IO.puts("SEED_ERR:" <> inspect(err)); System.halt(1)
end
`;
      const out = sh(['docker', 'exec', rtContainer, '/app/bin/realtime', 'rpc', elixir]);
      const ok = /SEED_OK:/.test(out);
      step('realtime.create_tenant', ok, out.split('\n').filter((l) => l.includes('SEED_')).join(' | ') || out.slice(-200));
      if (!ok) throw new Error('create_tenant failed');
    }

    const again = sh([
      'docker',
      'exec',
      dbContainer,
      'psql',
      '-U',
      'postgres',
      '-tAc',
      `SELECT count(*)::text FROM public.tenants WHERE external_id = '${externalId.replace(/'/g, "''")}'`,
    ]);
    step('realtime.tenant_verify', Number(again.trim()) >= 1, `count=${again.trim()}`);
  } catch (e) {
    step('realtime.exception', false, String(e.message || e).slice(0, 400));
  }
}

report.ok = report.steps.length > 0 && report.steps.every((s) => s.ok);
mkdirSync(join(root, '.qa/runs'), { recursive: true });
const out = join(root, '.qa/runs/realtime-tenant-seed.json');
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`wrote ${out} ok=${report.ok}`);
process.exit(report.ok ? 0 : 1);
