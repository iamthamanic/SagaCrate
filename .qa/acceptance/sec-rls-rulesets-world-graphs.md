# Feature: sec: RLS on rulesets + world_graphs

## Intent
`public.rulesets` und `public.world_graphs` dürfen ohne Membership/Ownership nicht über den authenticated Client lesbar oder mutierbar sein.

## Happy Path
- [x] Migration `086_rls_rulesets_world_graphs.sql` aktiviert RLS auf beiden Tabellen
- [x] SELECT für GM oder active project member; INSERT/UPDATE/DELETE nur GM
- [x] Negativ-Test: fremder JWT sieht/ändert keine Rows by id
- [x] Static check im test-gate (`rls-open-tables-check.mjs`)

## Edge Cases
- [x] `project_id IS NULL` Rows sind nicht SELECT-bar (kein offenes System-Policy)
- [x] Service-role / SECURITY DEFINER bleibt RLS-bypass (intentional)

## Regression
- [x] Member JWT kann ruleset für eigenes Projekt anlegen (`rest.member_rulesets_allow`)
- [x] Bestehende negative-authz Suite bleibt grün

## Assumptions
- Live evidence: `node scripts/negative-authz-suite.mjs` gegen Compose

## Screenshots
N/A (DB/RLS)

## Implementation Notes
- Policies reuse `current_user_is_active_project_member` from `004_project_membership_security.sql`
- Live checks: `rest.non_member_rulesets_deny`, `rest.non_member_rulesets_update_deny`, `rest.non_member_world_graphs_deny`

## Composition Gate
- Verdict: CLEAR (see `.qa/runs/composition-gate-sec-rls-rulesets-world-graphs.md`)
- Stranger JWT → PostgREST → RLS → empty/deny; no cross-owner leak

## Launch Checklist (SC)
- SC-01 PASS (live IDOR deny on rulesets/world_graphs)
- SC-02 PASS (server-side membership predicates)
- SC-03/SC-04 N/A; SC-06 PASS
