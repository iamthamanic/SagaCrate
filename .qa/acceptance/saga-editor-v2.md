# Feature: Saga-Editor v2 – Bedrohungen, Fristen, Regeln, Fraktionen

## Intent
Authors pflegen Simulation-Templates im Draft und publishen sie mit der Fassung.

## Happy Path
- [x] Draft carries `simulation` (threats, deadlines, rules, factions).
- [x] Four editor sections + nav.
- [x] `draftToPayload` persists simulation (not null).
- [x] Dornhain defaults when seed lacks simulation.
- [x] Rule validation for missing threat ids.
- [x] Checks + test-gate.
- [x] Zero type escape hatches.

## Edge Cases
- [x] 0 factions allowed
- [x] Doom text max 500 chars
- [x] threat-at-least without threat id blocked

## Assumptions
- No new SQL RPC — JSONB payload only.
