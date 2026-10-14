# Feature: compose-slim-profiles

## Goal
Default Docker Compose starts a slim core stack suitable for ~8 GB VPS (cloud LLM); optional services behind profiles.

## Acceptance
- [x] `docker compose up -d` starts only: db, auth, rest, realtime, storage, kong, edge, redis
- [x] Profiles `ai-local`, `graph`, `dev-tools`, `full` documented and wired
- [x] Ops doc `docs/ops/compose-profiles.md` present
- [x] README / README_SELFHOST / `.env.example` / `setup.sh` describe core vs profiles

## Composition Gate
Ops/compose-only — no app UI composition. See `.qa/runs/composition-gate-compose-slim-profiles.md`.
