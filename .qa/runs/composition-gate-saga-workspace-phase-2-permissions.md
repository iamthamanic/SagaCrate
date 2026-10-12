# Composition Gate — saga-workspace-phase-2-permissions

- HEAD_SHA: 04ef35b97608fe4c1c893239a887a99a140fd8fc
- BASE_SHA: 7fd607525eb7c5c6b75975bb259f6b9713c9f4fd
- Date: 2026-10-12
- Verdict: CLEAR

## Event
Saga member bundle assignment and binding reveal change catalog/lore audience.

## Producer → hops → consumer

1. **Producer:** GM UI `SagaPermissionSettings` / `SagaBindingRevealControl` calls SECURITY DEFINER RPCs `set_saga_member_bundle` / `set_saga_binding_reveal`.
2. **Store:** `project_member_saga_grants` (+ bundle row) or `saga_asset_bindings.reveal`.
3. **Consumer A:** `has_saga_permission` / `list_saga_bindings` / `can_view_saga_binding` — list cardinality and CTA gates.
4. **Consumer B:** `get_saga_lore_timeline` — lore entries filtered by `lore.read` / `lore.read_hidden`.

No queue/outbox/webhook. No bulk fan-out side effects.

## Simulations

| Case | Expected | Result |
|------|----------|--------|
| N actors: GM sets player bundle on member | Grants = player allow-list; secrets keys absent | OK (migration seed + RPC replace grants) |
| Invalid fallback: client INSERT on grants | Denied (REVOKE + no INSERT policy) | OK |
| Concurrent: last `set_bundle` demote | Exception `cannot revoke last saga.members.set_bundle` | OK (SQL invariant) |
| Reveal `gm_only` → player list | Row omitted unless `*_hidden` / secrets | OK (`can_view_saga_binding` + list filter) |
| Reveal `unlisted` | Omitted from list RPC | OK (`reveal <> unlisted`) |
| Lore without `lore.read` | RPC raises | OK |

## Findings
None open.

## Notes
Project GM still bridged via `is_project_gm` → full grant in `has_saga_permission` (documented transition). Phase 3 seeds bindings; Phase 2 establishes path.
