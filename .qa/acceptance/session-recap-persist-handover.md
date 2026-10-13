# Feature: Session-Recap persistieren und Stand automatisch übergeben

<!-- seeded by ecc-runner from issue #572 on 2026-10-11 — refined after implement -->

## Intent
Persistiere Session-Recaps als Episoden und übernehme den Spielstand automatisch beim Anlegen der nächsten Session — ohne manuellen `hydrate_from_project`-Knopf.

## Happy Path
- [x] Nach Complete existiert `session_recaps` Row (`set_session_status` → `sagatree_upsert_session_recap`).
- [x] Neue Session startet mit kopiertem `adventure_runtime` vom Project (`create_project_session` hydrate).
- [x] Highlights der Episode N zeigen Events aus N (domain window + newest-first), nicht global älteste.
- [x] Player sieht keine gm_only Highlights (`get_session_recap` + overview snippet via `sagatree_build_recap_highlight_lines`).
- [x] Check-Script + test-gate grün (`session-recap-persist-handover-check.mjs`).
- [x] Touched files: zero type escape hatches.

## Edge Cases
- [x] Complete ohne Events → empty highlight line / skeleton row
- [x] Doppel-Complete → idempotent upsert (keeps manual `summary_text`)
- [x] createNextSession ohne vorheriges persist → trotzdem Project-Stand kopieren
- [x] Knowledge aus letzter completed Session wird in neue `world_state.shared` übernommen wenn vorhanden
- [x] Overview `recapSnippet` audience-safe (nicht raw gm_only highlight)

## Regression
- [x] Prepare/Recap UI Struktur (#492) beibehalten; Primary CTA unverändert
- [x] Kein AI-Summary (#573 out of scope)
- [x] Column privileges / overview membership gates aus #569/#570 erhalten

## Assumptions
- Manual summary via `save_session_recap_summary` optional; AI → #573
- Snapshot stores full adventure; RPC projects by role at read time

## Screenshots
| Step | Filename |
|------|----------|
| 1 | n/a (static AU markers; no browser demo required for persist/hydrate) |

## Implementation Notes
- Migration: `supabase/migrations/061_session_recaps_and_handover.sql`
- Domain: `src/domains/session/contracts/session-prepare-recap.ts`
- Infra: `src/infrastructure/session/session-recap-service.ts`
- Hook: `src/app/session/hooks/useSessionPrepareRecap.ts`
- UI: `src/app/session/SessionRecapScreen.tsx` (optional summary section)
- Check: `scripts/session-recap-persist-handover-check.mjs` (wired in test-gate)

## Security Coverage
- B-01: RPC membership / GM checks (`is_session_participant`, `is_project_gm`)
- B-04: No client INSERT/UPDATE on `session_recaps` (REVOKE; SECURITY DEFINER only)
- B-07/B-08: Audience projection on read (gm_only stripped for non-GM)
- P-04: No secrets in diff

## Composition Gate
- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-session-recap-persist-handover.md`
- Meaning: complete → persist → next create hydrates project adventure; recap read is role-projected
