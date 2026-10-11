# Feature: Zwischen den Sessions und Der Bote

## Intent
GM stellt in Prepare Zeit vor und gibt frei; Spieler sehen spoilerfreie Bote-Neuigkeiten; Hub zeigt offene Fristen.

## Happy Path
- [x] Prepare section „Zwischen den Sessions“ mounts `useSagaSimulation` via GM panel.
- [x] Domain `buildBoteLines` / `listOpenDeadlines` — no JSX filtering.
- [x] Player „Der Bote“ from public/shared sim consequences.
- [x] Hub `openDeadlines` in overview VM + Weltzustand panel.
- [x] Migration 066 audience-filters deadlines/threats.
- [x] Checks + test-gate.
- [x] Zero type escape hatches.

## Edge Cases
- [x] Empty Bote → German empty line
- [x] Non-GM never mounts time steppers (GM panel gated)
- [x] Uncommitted preview not in Bote (only persisted consequences)

## Assumptions
- Apply migration 066 on target Supabase.
- Simulation ops from #577 available.
