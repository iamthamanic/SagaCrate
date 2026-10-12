# Composition Gate — saga-workspace-phase-2-permissions

- HEAD_SHA: 04ef35b97608fe4c1c893239a887a99a140fd8fc
- BASE_SHA: 7fd607525eb7c5c6b75975bb259f6b9713c9f4fd
- Date: 2026-10-12
- Verdict: CLEAR

## Event

GM assigns a saga permission bundle or flips a binding reveal → membership grants / reveal row update → catalog list and Lore timeline audience change for other members.

## Hop chain

`SagaPermissionSettings` / `SagaBindingRevealControl` → `sagaPermissionService` → SECURITY DEFINER RPC `set_saga_member_bundle` | `set_saga_binding_reveal` (persist grants or `saga_asset_bindings.reveal`) → consumers `has_saga_permission` / `list_saga_bindings` / `can_view_saga_binding` / `get_saga_lore_timeline` → Settings Rechte + catalog/Lore UI.

No queue, outbox, webhook, or mail fan-out.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | One bundle assign → one grant expansion for that member; other members unchanged | RPC deletes+inserts grants for `p_member_id` only | pass |
| Invalid/missing | Unauthenticated / missing `set_bundle` / unknown bundle fails closed | RPC raises; no partial grant write | pass |
| Two consumers / crash | List + Lore both read same persisted reveal/grants; no duplicate side-effect | Two SELECT/RPC readers; single writer RPC; no outbox | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

## Notes

Project GM still bridged via `is_project_gm` → full grant in `has_saga_permission` (documented transition). Phase 3 seeds bindings; Phase 2 establishes the path.
