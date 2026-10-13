# Composition Gate — session-lobby-saga-cover

- HEAD_SHA: 5cca1c77a6a917f1f43f98c946e94c3b3c887549
- BASE_SHA: 242524f72264eef25a28fff5b3fd4ec064a0b9b8
- Date: 2026-10-14
- Verdict: CLEAR

## Event

Lobby roster load resolves an optional public saga cover URL from the project display title (including group-run suffixes) and renders it beside the session join code when present; no media publish, no identity claim, no server write.

## Hop chain

useSessionLobby rebuild -> projectService.getSessionByPublicIds (membership-gated read) -> sagatreeNativeSagaCoverUrlFromDisplayName(project.name) (static public asset map) -> LobbySessionSummary.sagaCoverUrl -> SessionLobbyScreen img / letter fallback -> unchanged enter CTA via decideLobbyEnterLive (membership role)

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each member sees same public cover for the saga; no per-user media identity | Cover from display name + static pack map; no stream/publish | pass |
| Invalid/missing | Unknown title or missing join code still shows cover/fallback; enter membership-gated | sagaCoverUrl null -> fallback; join code section optional; mediaBlocksEnter unchanged | pass |
| Two consumers / crash | Cover resolution failure must not block lobby or live enter | Pure sync title lookup; no network for cover; enter path untouched | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
