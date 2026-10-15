#!/usr/bin/env node
/**
 * session-lobby-media-preview-check — Meet-style lobby device bar (#678 → cover device bar).
 * Location: scripts/session-lobby-media-preview-check.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
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

function read(relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

function mustExist(relPath) {
  check(existsSync(join(root, relPath)), `missing ${relPath}`);
}

section('1 · files exist');
[
  'src/domains/session/contracts/session-lobby.ts',
  'src/app/session/hooks/useLobbyMediaPreview.ts',
  'src/app/session/LobbyDeviceBar.tsx',
  'src/app/session/LobbyMediaPreviewSection.tsx',
  'src/app/session/SessionLobbyScreen.tsx',
  '.qa/acceptance/session-lobby-media-preview.md',
  '.qa/acceptance/session-lobby-cover-device-bar.md',
].forEach(mustExist);

section('2 · domain prefs + descriptors');
{
  const domain = read('src/domains/session/contracts/session-lobby.ts');
  check(!/from ['"]react['"]/.test(domain), 'domain React-free');
  check(!/supabase/.test(domain), 'domain Supabase-free');
  check(/LobbyMediaDeviceDescriptor/.test(domain), 'device descriptor type');
  check(/LOBBY_MEDIA_PREFS_STORAGE_KEY/.test(domain), 'prefs storage key');
  check(/parseLobbyMediaDevicePrefs/.test(domain), 'prefs parser');
  check(/LobbyLiveActPreviewOption/.test(domain), 'liveact preview option');
}

section('3 · hook holds streams, no mount auto-start');
{
  const hook = read('src/app/session/hooks/useLobbyMediaPreview.ts');
  check(/getUserMedia/.test(hook), 'getUserMedia in preview hook');
  check(/enumerateDevices/.test(hook), 'enumerateDevices');
  check(/AnalyserNode|createAnalyser/.test(hook), 'mic analyser');
  check(/devicechange/.test(hook), 'devicechange listener');
  check(/track\.stop|getTracks\(\)\.forEach/.test(hook), 'track stop cleanup');
  check(!/useEffect\(\(\) => \{[^}]*getUserMedia/s.test(hook), 'no auto getUserMedia on mount');
  check(!/useSessionMediaPlane/.test(hook), 'no LiveKit media plane');
}

section('4 · device bar in Am Tisch + cover stage');
{
  const screen = read('src/app/session/SessionLobbyScreen.tsx');
  const barUi = read('src/app/session/LobbyDeviceBar.tsx');
  const compat = read('src/app/session/LobbyMediaPreviewSection.tsx');
  check(/LobbyDeviceBar/.test(screen), 'screen mounts LobbyDeviceBar');
  check(/cover-stage|data-session-lobby-cover-meta/.test(screen), 'cover-stage meta');
  check(/Am Tisch/.test(screen), 'Am Tisch roster label');
  check(!/data-session-lobby-self/.test(screen), 'Dein Platz section removed');
  check(/data-session-lobby-change-character/.test(screen), 'Charakter ändern retained');
  check(/LobbyDeviceBar/.test(compat), 'compat re-export from LobbyMediaPreviewSection');
  check(/data-session-lobby-camera-preview/.test(barUi), 'camera video preview');
  check(/data-session-lobby-mic-meter/.test(barUi), 'mic meter');
  check(/data-session-lobby-liveact-preview/.test(barUi), 'liveact preview');
  check(/data-session-lobby-camera-select/.test(barUi), 'camera select');
  check(/data-session-lobby-mic-select/.test(barUi), 'mic select');
  check(/data-session-lobby-probe-camera/.test(barUi), 'camera probe CTA');
  check(/data-session-lobby-probe-liveact/.test(barUi), 'liveact probe CTA');
  check(/data-session-lobby-mode-camera/.test(barUi), 'cam/live mode toggle');
  check(/data-session-lobby-mode-profile/.test(barUi), 'profile mode toggle');
  check(/getUserMedia/.test(read('src/app/session/hooks/useLobbyMediaPreview.ts')), 'real media access');
}

if (failures > 0) {
  console.error(`\nsession-lobby-media-preview-check: ${failures} failure(s)`);
  process.exit(1);
}
console.log('session-lobby-media-preview-check: OK');
