# Composition Gate — saga-simulation-core

- HEAD_SHA: WORKTREE
- BASE_SHA: 0adfd6be4a16f5db6cf6fc6f1a96063bc5ff3008
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM (future #577) advances N days; kernel upgrades v1→v2 and emits proposedEvents without mutating SQL.

## Hop chain
Caller → advanceTime → upgradeAdventureRuntimeV1toV2 → per-day threat ticks / deadlines / doom-once / rules → nextState + proposedEvents. Persistence/UI out of scope.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Pure function; no shared mutable store | Local state only | pass |
| Invalid/missing | Missing template → skip + reason | skipped[] populated | pass |
| Two consumers / crash | Same seed → identical events | JSON equality in check | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
