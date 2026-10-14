# Acceptance — fix-function-bodies-sagatree

## Intent
After migration 079 (SagaDrive → SagaTree hard-cut) ~28 public SQL functions still referenced dropped/renamed objects (`characters.sagadrive_profile`, `sagadrive_*` helpers). Library/login flow broke: `ensure_native_starter_project` returned 400 "column c.sagadrive_profile does not exist".

## Scope
### In
- `supabase/migrations/085_fix_function_bodies_sagatree.sql` (idempotent DO block rewriting function bodies)
- `scripts/apply-migrations.sh` list

### Out
- Historical migrations 001–079 (unchanged by design)

## Happy Path
- [x] Applied on local DB: 0 public functions still mention `sagadrive`
- [x] No dangling `public.sagatree_*` / `generate_sagatree_*` callee
- [x] Admin JWT: `ensure_native_starter_project` HTTP 200 (4 characters), `projects` HTTP 200

## Edge Cases
- [x] Re-apply is a no-op (no function matches)
- [x] CREATE OR REPLACE keeps owner and grants (service_role-only seed function stays restricted)

## Composition Gate
- Proof: `.qa/runs/composition-gate-fix-function-bodies-sagatree.md`
