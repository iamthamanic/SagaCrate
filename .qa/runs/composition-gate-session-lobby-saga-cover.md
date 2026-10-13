# Composition Gate — session-lobby-saga-cover

- HEAD_SHA: db1be28a47ee73854a37133bc92cf2a8117d763f
- BASE_SHA: 0e76d818e51fd2f6a6f0ce7a239671f5ed043bd7
- Date: 2026-10-13
- Verdict: CLEAR

## Event

Lobby roster load resolves an optional public saga cover URL from the project display title and renders it beside the session join code; no media publish, no identity claim, no server write.

## Hop chain

useSessionLobby rebuild → projectService.getSessionByPublicIds (membership-gated read) → sagatreeNativeSagaCoverUrlByTitle(project.name) (static public asset map) → LobbySessionSummary.sagaCoverUrl → SessionLobbyScreen img / letter fallback → unchanged enter CTA via decideLobbyEnterLive (membership role)

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each member sees same public cover for the saga; no per-user media identity | Cover from project.name + static pack map; no stream/publish | pass |
| Invalid/missing | Unknown title → null URL → letter fallback; enter still membership-gated | sagaCoverUrl null → fallback UI; mediaBlocksEnter unchanged | pass |
| Two consumers / crash | Cover resolution failure must not block lobby or live enter | Pure sync title lookup; no network for cover; enter path untouched | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
