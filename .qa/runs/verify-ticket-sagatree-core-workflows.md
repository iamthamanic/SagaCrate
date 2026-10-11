# verify-ticket — sagatree-core-workflows-real-apis (#606)

## Result
PASS (core APIs + Storage + Edge member)

## Commands
- `node scripts/sagatree-core-workflows-check.mjs` → exit 0
- `node scripts/sagatree-core-workflows-contract-check.mjs` → exit 0

## Notes
- Live evidence: `.qa/runs/sagatree-core-workflows/report.json` against **sagadrive-regular** `:8000`
- Realtime: `BLOCKED_604` (`SECRET_KEY_BASE` missing on `sagadrive-realtime`)
- Edge negative: `BLOCKED_605` (anon dice 200; stranger ai-gm 500)
- REST writes use explicit safe `select=` columns (059/071 RETURNING allow-list)
