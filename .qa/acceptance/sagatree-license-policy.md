# Acceptance — sagatree-license-policy

## Intent
Define and complete the SagaTree multi-license structure (AGPL platform code, ORC written rules, future Apache SDKs, separate marketplace/trademark rights) without changing runtime behavior.

## Happy Path
- [x] Root LICENSE is official AGPL-3.0 verbatim
- [x] LICENSES.md documents agreed architecture without inventing rights
- [x] ORC required notices present on canonical core rules
- [x] No contradictory Proprietary/MIT claims in primary docs
- [x] package.json declares AGPL-3.0-only for platform code
- [x] Open legal gaps explicitly marked NEEDS_HUMAN

## Edge Cases
- [x] Apache-2.0 text present only as future-SDK reference (no AGPL relicense)
- [x] Marketplace/creator content remains outside software license

## Composition Gate
Verdict: SKIPPED — docs/license only; see `.qa/runs/composition-gate-sagatree-license-policy.md`
