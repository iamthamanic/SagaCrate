# Security Checklist — session-lobby-media-preview (#678)

- Mode: inline / diff (feature ticket, not launch)
- HEAD (at review): branch `feat/session-lobby-media-preview`
- Date: 2026-10-14

| ID | Result | Evidence |
|----|--------|----------|
| SC-01 | PASS | No new mutating API. Lobby membership unchanged. GM NPC list via `listNpcCreatureDefinitions({ scope: 'personal' })` + core/builtin catalogs; player LiveAct uses bound `selfCharacterId` + `characterService.getCharacterById` (owner-scoped infra). |
| SC-02 | N/A | No new API body / client-claimed roles or prices. |
| SC-03 | N/A | No new cost/auth abuse route; `getUserMedia` is local browser only. |
| SC-04 | N/A (diff) | Lockfile untouched. |
| SC-05 | N/A (inline) | Not a launch ticket. |
| SC-06 | PASS | Prefs key `sagatree.lobby-media-prefs.v1` stores deviceIds only — not tokens/secrets. No new env secrets. |
| SC-07 | N/A | Not a launch ticket. |

## Verdict
PASS (inline gates)
