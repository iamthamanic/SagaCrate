# Composition Gate — saga-workspace-ux-permissions

- HEAD_SHA: 6c6de62e7dfc0726130eaf669bd6711999e82135
- BASE_SHA: 786eb085c17907cb7337d965c0e359ef9fd3ee22
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
| N-actors | One create → one lobby nav; code shared, not N emails | No fan-out; invite share is explicit user action on Lobby | pass |
| Invalid/missing | Fail closed; no live redirect | `resolveCanonicalLobbyEntry` unauthorized; lobby recoverable error | pass |
| Two consumers / crash | No duplicate create side-effect | Single load path; interstitial/timeout removed (no double destination) | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

Prior fail modes cleared at feature HEAD: `waiting` status mapping; direct public_id fallback; `code` in SESSION_SAFE_COLUMNS; 2s interstitial removed. Follow-up commits after `6c6de62e` are `.qa/` proof pins only.

## Skip reason

n/a
