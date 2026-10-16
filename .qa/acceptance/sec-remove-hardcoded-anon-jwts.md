# Feature: sec: remove committed hosted anon JWTs

## Intent
Keine hardcodierten Hosted-Anon-JWTs mehr in `src/**`; Env-only; Fail-closed ohne Env.

## Happy Path
- [x] `info.tsx` / `devtrack.ts` ohne JWT-Literale
- [x] `supabase.ts` requires `VITE_SUPABASE_*` (no hosted fallback)
- [x] DevTrack no-op ohne `VITE_DEVTRACK_*`
- [x] Rotation checklist for `dnhotyjazjnhneqbqocq` + `vjpfbedynctazvwywlqj`
- [x] Static check in test-gate

## Edge Cases
- [x] Partial env (only URL or only anon) throws
- [x] Production rejects non-JWT placeholder anon keys

## Composition Gate
SKIPPED — tooling/config only (see `.qa/runs/composition-gate-sec-remove-hardcoded-anon-jwts.md`)

## Launch Checklist (SC)
- SC-06 PASS
