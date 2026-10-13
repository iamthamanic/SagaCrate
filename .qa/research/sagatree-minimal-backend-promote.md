# SagaTree minimal-backend promotion readiness

**Epic:** #602  
**Issue:** #608  
**Date:** 2026-10-14  
**HEAD evaluated:** `9d6aa579` (main after #607 / PR #680)  
**Verdict:** **ready for review**

> Explicit: this report does **not** authorize Merge/Push/Production Deploy beyond what the ECC runner already merged for P0 children. No volume wipes. No VPS deploy.

---

## 1. Quality Gate

| Gate | Result | Notes |
|------|--------|-------|
| `npm run test-gate` | **PASS** | 2026-10-14 local on `9d6aa579` |
| Compose harden (#605) | PASS | Kong workers=1, `VERIFY_JWT` default true, loopback DB/Edge |
| Realtime compose contract (#604) | PASS | Secrets + Kong `/socket` wiring present |
| Core workflows contract (#606) | PASS | Core APIs green; Realtime evidence `BLOCKED_604` (subscribe OK, 0 CDC events locally) |
| Negative authz (#607) | PASS | Anon/invalid JWT deny; stranger `ai-gm` 403; non-member REST empty |
| Composition Gate (latest P0 PRs) | PASS | #604/#605/#607 CLEAR proofs on merge |

---

## 2. Adopted changes (P0 children)

| Issue | PR | What landed |
|-------|-----|-------------|
| #603 | (prior) | Authenticated REST/RPC writes without exposing saga secrets |
| #604 | #676 → `1ef95a12` | Realtime boot: `SECRET_KEY_BASE`, `DB_ENC_KEY`, tenant seed, Kong `/socket` |
| #605 | #677 → `0e76d818` | Kong workers=1, loopback binds, `VERIFY_JWT=true` default |
| #606 | (prior) | Live workflows script + contract against regular compose |
| #607 | #680 → `9d6aa579` | Edge `main` JWT gate, `ai-gm` membership gate, Local Admin DEV-only, suite in test-gate |

### Measurement (live local stack, post-#607)

| Probe | Result |
|-------|--------|
| `POST /functions/v1/dm-tools/dice` without Bearer | `401 missing Authorization bearer token` |
| Same with invalid Bearer | `401` |
| Member JWT dice | `200` |
| Stranger → `ai-gm` foreign session | `403 session not found or access denied` |
| Stranger REST project read | `200` + `rows=0` (RLS) |
| Core workflows `report.ok` | `true` (Realtime `BLOCKED_604` flake documented) |

---

## 3. Blocked / residual items

| Item | Severity | Notes |
|------|----------|-------|
| Realtime postgres_changes events=0 locally | Medium | Container up + publication includes `sessions`; WS subscribe succeeds but CDC events not observed. Workflows treat as `BLOCKED_604`. Does **not** block code promote review. |
| Live gateway naming (`sagadrive-*` containers) | Low | Local Docker still uses legacy container names; compose file uses `sagatree-*`. Remount/recreate Edge to pick up JWT gate. |
| #609 Linux 2G cgroup VPS load proof | P1 | **needs-human** — out of scope for “code promote ready” per epic |
| Epic #602 child checkboxes on GitHub | Ops | Update after human ack of this report |

---

## 4. Dev vs Prod config matrix

| Knob | Dev (local Vite) | Prod-like / internet-facing |
|------|------------------|-----------------------------|
| `VERIFY_JWT` | default `true`; opt-out `false` only for Edge debug | **must** stay `true` |
| `KONG_NGINX_WORKER_PROCESSES` | `1` default; `2` optional | start at `1`; raise only with capacity proof |
| Postgres publish | `127.0.0.1:5432` | never `0.0.0.0`; prefer private network only |
| Edge publish | `127.0.0.1:9998` | private; clients via Kong `/functions/v1` |
| Local Admin `admin`/`1234` | Vite `import.meta.env.DEV` only | **disabled** in production builds; do not apply seed migrations 011/074 |
| Realtime `SECRET_KEY_BASE` / `DB_ENC_KEY` | required for boot | required; rotate with tenant re-seed procedure |
| `REALTIME_SELF_HOST_TENANT` | `localhost` | match public Host |
| Volume wipe (`down -v`) | **forbidden** in ops docs | **forbidden** |

---

## 5. Rollback (Compose / Env — no volume deletes)

1. Pin previous known-good image tags / compose revision (git revert of promote PRs if needed).
2. `docker compose up -d --force-recreate` **without** `-v` for Kong/Edge/Realtime only.
3. Env rollback: restore prior `.env` values for `VERIFY_JWT`, Kong workers, Realtime secrets (do not delete DB volume).
4. Edge JWT gate rollback: revert `supabase/functions/main/index.ts` + `_shared/edge-jwt-gate.ts` if needed; recreate Edge container.
5. Never: `docker compose down -v`, never drop `sagatree-db` / legacy data volumes as part of rollback.

Checklist: `docs/ops/compose-harden-defaults.md`, `docs/ops/realtime-restart-checklist.md`, `docs/ops/negative-authz-suite.md`.

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Clients omitting `Authorization` Bearer on Edge calls | Gate returns clear `401`; frontend already sends user JWT |
| Realtime CDC silent in some local topologies | Documented `BLOCKED_604`; re-verify on VPS (#609) |
| Weak admin seeds if migrations applied in prod | Docs + DEV-only UI gate; ops must not run 011/074 on public hosts |
| Custom Edge `main` skipping stock JWT | Fixed in #607 |

---

## 7. Explicit non-actions

- **No** Merge/Push/Deploy authorization beyond already-merged P0 PRs.
- **No** production cutover from this document alone.
- **No** volume deletes.
- **No** requirement that #609 (2G cgroup) be green for this verdict.

---

## 8. Verdict

**ready for review** — P0 promote path (#603–#607) is on `main` with test-gate green and security/workflows contracts satisfied. Human review should acknowledge residual Realtime CDC flake and schedule #609 separately before capacity-constrained prod.

Epic child update (proposed):

- [x] #603 write path  
- [x] #604 Realtime compose  
- [x] #605 Compose harden  
- [x] #606 Core workflows  
- [x] #607 Negative authz  
- [x] #608 This report  
- [ ] #609 VPS cgroup (P1, needs-human)
