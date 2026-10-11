# Feature: Simulationskern – Spielzeit, Fristen, Bedrohungsstufen, Regeln

## Intent
Deterministischer, reiner TypeScript-Simulationskern für Spielzeit, Fristen, Bedrohungsstufen und wenn-dann-Regeln — ohne Cron, React, Supabase.

## Happy Path
- [x] v1→v2 upgrade pure (`upgradeAdventureRuntimeV1toV2`).
- [x] `advanceTime` deterministisch (Seed) mit `proposedEvents`.
- [x] Deadlines / Threats / Rules mit Mini-Fixture abgedeckt.
- [x] Kein React/Supabase Import in `domains/saga/simulation`.
- [x] Check im test-gate (`saga-simulation-kernel-check.mjs`).
- [x] Touched files: zero type escape hatches.

## Edge Cases
- [x] days=0 → keine Events
- [x] deadline exact hit (dueDay)
- [x] threat max → impending doom once
- [x] missing template → skip + reason
- [x] v1 without seed → stable derive

## Regression
- [x] Adventure runtime v1 empty/parse/tick_clock unchanged default schemaVersion=1

## Assumptions
- Persist/SQL for schemaVersion 2 → #577

## Implementation Notes
- Kernel under `src/domains/saga/simulation/`
- Minimal `simulation` slice on `SagaDefinitionPayload` (authoring UI → #579)
