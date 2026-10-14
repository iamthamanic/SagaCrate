# Licensing evidence (SagaTree)

| File | Role |
| --- | --- |
| [../LICENSES.md](../../LICENSES.md) | Human-readable multi-license policy |
| [contributor-provenance.md](contributor-provenance.md) | Code authorship investigation (Raccoovaclaw, Figma Make, agents) |
| [OWNER_ATTESTATIONS.md](OWNER_ATTESTATIONS.md) | Unsigned templates required before release |
| [asset-classification-rules.json](asset-classification-rules.json) | Path → license classification rules |
| [asset-inventory.json](asset-inventory.json) | Machine-readable media inventory |
| [asset-inventory-summary.md](asset-inventory-summary.md) | Counts by status |
| [status.json](status.json) | `open_source_release_ready` flag + blockers |

Regenerate inventory:

```bash
node scripts/asset-license-inventory-check.mjs --write
```

CI (`npm run test-gate`) runs the same script without `--write` and fails on `status: uncleared` or a stale inventory. A green check does **not** mean legal clearance: `owner_pending` and `open_source_release_ready: false` remain release blockers until attestations are filed.
