# Composition Gate — saga-workspace-phase-2-3

- HEAD_SHA: c6f89c6d2158d3c37fcecace3749645df955554e
- BASE_SHA: 7fd607525eb7c5c6b75975bb259f6b9713c9f4fd
- Date: 2026-10-12
- Verdict: CLEAR

## Event

(1) GM assigns Spielleitung/Spieler bundle → grants expand → catalog/Lore audience changes.
(2) Dornhain seed writes bindings (+ map pins) → list/timeline RPCs expose party-safe vs gm_only rows.

## Hop chain

UI (`SagaPermissionSettings` / `SagaBindingRevealControl` / catalog / `SagaWorldCatalogPanel`)
→ `sagaPermissionService`
→ SECURITY DEFINER RPCs (`set_saga_member_bundle` | `set_saga_binding_reveal` | `list_saga_bindings` | `get_saga_lore_timeline` | `has_saga_permission`)
→ tables `project_member_saga_grants` / `saga_asset_bindings` (+ seed via `seed_dornhain_catalog_bindings`)
→ audience-filtered UI lists.

No queue/outbox/webhook/mail fan-out.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | One bundle assign affects one member; seed once per Dornhain project | RPC scoped to `p_member_id`; seed ON CONFLICT upsert per project | pass |
| Invalid/missing | Unauth / missing `set_bundle` / unknown bundle / non-member lore fails closed | RAISE; no client INSERT on grants | pass |
| Two consumers / crash | Catalog + Welt + Lore readers share persisted grants/reveal; no duplicate side-effect | Multiple SELECT RPCs; single writer RPCs; seed idempotent | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

## Skip reason
n/a
