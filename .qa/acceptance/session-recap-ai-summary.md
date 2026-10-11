# Feature: KI-Zusammenfassung einer Episode mit GM-Freigabe

<!-- seeded by ecc-runner from issue #573 on 2026-10-11 -->

## Intent
Erzeuge nach Session-Ende einen KI-Entwurf der Episoden-Zusammenfassung über eine Edge Function; der GM bearbeitet und gibt frei. Ohne KI bleibt manueller Text (#572).

## Happy Path
- [x] Edge Function `session-recap` mit shared CORS.
- [x] Rate limit greift (`consume_session_recap_rate_limit`).
- [x] Player sieht draft nicht (`get_session_recap` + table SELECT revoked).
- [x] GM kann edit+approve; Text in `session_recaps` (`summary_status`).
- [x] Fail-Pfad mit manuellem Fallback (UI editable + failed status).
- [x] Check-Script + test-gate.
- [x] Touched files: zero type escape hatches.

## Edge Cases
- [x] Non-GM generate → 403 in edge
- [x] Client prompt/highlight payload rejected
- [x] Abort während Request (`cancel`)
- [x] gm_only lines redacted from prompt
- [x] Provider not configured → not-configured message

## Regression
- [x] Deterministic highlights unchanged (#572)
- [x] Primary next-session CTA retained

## Security Coverage
- B-01: JWT + GM check in edge
- B-04: No client table SELECT on session_recaps; draft via RPC projection
- B-07/B-08: Prompt server-side from projected lines only
- P-04: No secrets in diff

## Composition Gate
- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-session-recap-ai-summary.md`

## Implementation Notes
- Migration `062_session_recap_ai_summary.sql`
- Edge `supabase/functions/session-recap/`
- Domain `episode-summary-prompt.ts`
- Hook `useEpisodeSummary` + `EpisodeSummaryPanel`
- Check `scripts/session-recap-ai-summary-check.mjs`
