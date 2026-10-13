#!/usr/bin/env node
/**
 * media-optimizer-user-avatar-check — account avatar intake (#682).
 * Location: scripts/media-optimizer-user-avatar-check.mjs
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
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

section('1 · files');

const paths = [
  'src/app/profile/AccountAvatarSection.tsx',
  'src/infrastructure/user-profile/user-profile-service.ts',
  'src/infrastructure/user-profile/supabase-user-profile.repository.ts',
  'src/domains/user-profile/display-name.ts',
  'supabase/migrations/081_user_profiles_and_avatars.sql',
];
for (const p of paths) {
  check(existsSync(join(root, p)), `exists ${p}`);
}

section('2 · intake + alreadyOptimized + no silent original');

const ui = readFileSync(join(root, 'src/app/profile/AccountAvatarSection.tsx'), 'utf8');
const service = readFileSync(
  join(root, 'src/infrastructure/user-profile/user-profile-service.ts'),
  'utf8',
);
const repo = readFileSync(
  join(root, 'src/infrastructure/user-profile/supabase-user-profile.repository.ts'),
  'utf8',
);
const contract = readFileSync(
  join(root, 'src/domains/media/optimization-contract.ts'),
  'utf8',
);
const policy = readFileSync(join(root, 'src/domains/media/optimization-policy.ts'), 'utf8');
const lobbyHook = readFileSync(join(root, 'src/app/session/hooks/useSessionLobby.ts'), 'utf8');
const lobbyUi = readFileSync(join(root, 'src/app/session/SessionLobbyScreen.tsx'), 'utf8');
const migration = readFileSync(
  join(root, 'supabase/migrations/081_user_profiles_and_avatars.sql'),
  'utf8',
);

check(/useMediaOptimizeIntake/.test(ui), 'UI uses intake hook');
check(/profileId:\s*['"]user-avatar['"]/.test(ui), 'intake profile user-avatar');
check(/alreadyOptimized:\s*true/.test(ui), 'upload skips double-optimize after intake');
check(/previewUrl \|\| remoteUrl/.test(ui), 'immediate preview before remote URL');
check(/aria-live/.test(ui), 'UI aria-live for status');
check(/Erneut|Abbrechen|Bestehendes Avatar bleibt erhalten/.test(ui), 'retry/abort/keep prior');
check(/data-account-avatar-dropzone/.test(ui), 'clickable dropzone box');
check(/onDrop|onDragOver/.test(ui), 'drag-and-drop handlers');
check(/role:\s*['"]button['"]|role=\"button\"/.test(ui), 'dropzone keyboard button role');
check(/prepareUserAvatarFile/.test(service), 'service prepare helper');
check(/profileId:\s*['"]user-avatar['"]/.test(service), 'service prepare uses user-avatar');
check(/optimizeMedia/.test(service), 'service calls optimizeMedia');
check(/alreadyOptimized/.test(service), 'service respects alreadyOptimized');
check(/kein stilles Original|no silent/.test(service), 'service fails closed on empty optimize');
check(/sniffUserAvatarMime/.test(repo), 'repository magic-byte sniff');
check(/image\/webp/.test(repo), 'repository accepts webp');
check(/user-avatars/.test(repo), 'repository uses user-avatars bucket');
check(/'user-avatar'/.test(contract), 'contract lists user-avatar');
check(/profileId:\s*['"]user-avatar['"]/.test(policy), 'policy defines user-avatar');
check(/gifAnimation:\s*['"]reject['"]/.test(policy) && /USER_AVATAR/.test(policy), 'avatar rejects gif');

section('3 · lobby batch + account identity');

check(/getProfilesByUserIds/.test(lobbyHook), 'lobby batches profiles');
check(/accountDisplayName/.test(lobbyHook), 'lobby maps accountDisplayName');
check(/data-lobby-account-name/.test(lobbyUi), 'lobby renders account name');
check(/data-lobby-user-id/.test(lobbyUi), 'lobby renders user id');
check(/data-lobby-member-avatar/.test(lobbyUi), 'lobby renders avatar');

section('4 · migration RLS');

check(/user_profiles/.test(migration), 'migration creates user_profiles');
check(/user-avatars/.test(migration), 'migration creates user-avatars bucket');
check(/user_profiles_select_authenticated/.test(migration), 'authenticated select profiles');
check(/user_profiles_update_own/.test(migration), 'own update profiles');
check(/Authenticated can read user avatars/.test(migration), 'peer-readable avatars');
check(/handle_new_user_profile/.test(migration), 'signup ensure trigger');

section('5 · typed-strict on touched');

for (const [rel, text] of [
  ['AccountAvatarSection.tsx', ui],
  ['user-profile-service.ts', service],
  ['supabase-user-profile.repository.ts', repo],
]) {
  const codeOnly = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check(!/\bany\b/.test(codeOnly), `${rel}: no any`);
  check(!/\bas\s+unknown\b/.test(codeOnly), `${rel}: no as unknown`);
}

section('6 · display-name helpers');

const outdir = join(root, 'node_modules', '.cache', 'media-optimizer-user-avatar-check');
mkdirSync(outdir, { recursive: true });
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');
execFileSync(
  esbuild,
  [
    join(root, 'src/domains/user-profile/index.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${join(outdir, 'user-profile.mjs')}`,
  ],
  { stdio: 'inherit' },
);
const domain = await import(pathToFileURL(join(outdir, 'user-profile.mjs')).href);
check(
  domain.resolveAccountDisplayName({
    profileDisplayName: ' Profile ',
    authDisplayName: 'Auth',
  }) === 'Profile',
  'profile display name wins',
);
check(
  domain.resolveAccountDisplayName({ email: 'admin@example.com' }) === 'admin',
  'email local-part fallback',
);
check(domain.initialsFromDisplayName('Ada Lovelace') === 'AL', 'two initials');
check(domain.initialsFromDisplayName('') === '?', 'empty initials fallback');

if (failures > 0) {
  console.error(`\nmedia-optimizer-user-avatar-check: ${failures} failure(s)`);
  process.exit(1);
}

console.log('media-optimizer-user-avatar-check: OK');
