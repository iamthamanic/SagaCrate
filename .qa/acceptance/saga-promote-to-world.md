# Acceptance — saga-promote-to-world (#582)

## Intent
Explicit promote of session consequences into saga draft facts and/or world lore.
Never auto-promote; author/world-owner gates; native saga rejects with copy guidance.

## Checks
- [ ] `scripts/saga-promote-to-world-check.mjs` PASS
- [ ] Migration `070_saga_promote_session_outcomes.sql`
- [ ] Recap GM-only promote buttons with confirm
- [ ] Idempotent ledger
- [ ] Zero type escape hatches
