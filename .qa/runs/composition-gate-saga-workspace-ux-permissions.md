# Composition Gate — saga-workspace-ux-permissions

- HEAD_SHA: a0d3cabb0da557a5e3008d761b72beb075ca6507
- Date: 2026-10-12
- Verdict: CLEAR

## Event

GM creates a play session → one waiting session with one join code → navigates once to Lobby → Lobby resolves session and shows that code.

## Hop chain

`SessionJoin.onCreate` → `sessionService.createSession` / RPC `create_play_session` (persist: status `waiting`, `code`, `public_id`) → `onJoinAsGM` / `resolveCanonicalLobbyEntry` (once) → route `/sagas/{SA}/sessions/{SE}/lobby` → `useSessionLobby` → `getSessionByPublicIds` (list match **or** direct `public_id` + `project_id` SELECT with `code`) → Lobby UI (`data-session-lobby-join-code`).

Secondary (Library nav): Dashboard/Alle Sagas → `pathForSagaList` → `/library?tab=adventures` (no extra persist).

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| 1 event, N actors | One create → one lobby nav; code shared, not N emails | No fan-out; invite share is explicit user action on Lobby | pass |
| invalid / missing | Fail closed; no live redirect | `resolveCanonicalLobbyEntry` unauthorized; lobby recoverable error | pass |
| 2 consumers / crash | No duplicate create side-effect | Single load path; interstitial/timeout removed (no double destination) | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

Prior fail modes cleared in this WORKTREE: `waiting` status mapping; direct public_id fallback; `code` in SESSION_SAFE_COLUMNS; 2s interstitial removed.

## Skip reason

n/a
