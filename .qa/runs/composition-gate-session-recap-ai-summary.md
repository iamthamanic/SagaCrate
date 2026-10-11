# Composition Gate — session-recap-ai-summary

- HEAD_SHA: 7eb23e35df17df28227897eae7a2674c41d7db3f
- BASE_SHA: 8ed67ee463f89dd91ed0bd16ea662981e566eee2
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM requests AI episode summary for a completed session; draft is persisted; players only see approved text.

## Hop chain
EpisodeSummaryPanel → useEpisodeSummary → session-recap-ai-service.invoke(`session-recap`) → Edge (JWT, rate-limit, GM check) → load session_recaps snapshot → buildSessionRecapPrompt (spoiler filter) → provider → PATCH draft → later save_session_recap_summary(approved) → get_session_recap projects for players.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Player never sees draft | table SELECT revoked; RPC nulls non-approved for non-GM | pass |
| Invalid/missing | Non-GM / incomplete session / client payload → 4xx | edge checks | pass |
| Two consumers | Rate limit per user; no queue fan-out | persistent RPC quota | pass |

## Flags
(none)
