# Feature: compose-slim-profiles

## Goal
Default Docker Compose starts a slim core stack suitable for ~8 GB VPS (cloud LLM); optional services behind profiles.

## Acceptance
- [x] `docker compose up -d` starts only: db, auth, rest, realtime, storage, kong, edge, redis
- [x] Profiles `ai-local`, `graph`, `dev-tools`, `full` documented and wired
- [x] Ops doc `docs/ops/compose-profiles.md` present
- [x] README / README_SELFHOST / `.env.example` / `setup.sh` describe core vs profiles
- [x] `setup.sh` mints HS256 anon/service_role JWTs; `SECRET_KEY_BASE` is single-line
- [x] `ai-gm` honors `CHARACTER_AI_PROVIDER=openai-compatible` (same env as lore/recap)

## Composition Gate
Ops/compose + Edge provider wiring — no app UI composition. See `.qa/runs/composition-gate-compose-slim-profiles.md`.
