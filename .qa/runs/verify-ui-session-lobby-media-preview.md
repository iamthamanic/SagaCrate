# Verify UI — session-lobby-media-preview

- Date: 2026-10-14
- Verdict: PARTIAL → PASS after LiveAct Stoppen fix (no role / empty NPC)
- Spec: `e2e/session-lobby-media-preview.spec.ts` (+ regression `e2e/session-lobby-preflight.spec.ts`)
- Evidence: `.qa/evidence/session-lobby-media-preview/`

## Acceptance mapping

| Criterion | Result |
|-----------|--------|
| Mount: media cards idle, no auto getUserMedia | PASS — camera idle visible; probe CTAs present |
| Dein Platz removed | PASS — `data-session-lobby-self` count 0; text absent |
| Probe CTAs camera/mic/LiveAct | PASS |
| Camera/mic probe after gesture | PARTIAL — gesture + status path OK; host/CI often lacks real media → „Prüfung fehlgeschlagen“ (AC: Enter still not blocked) |
| LiveAct probe | PASS (structure); membership seed may show role hint instead of portrait |
| No horizontal overflow | PASS |
| Join hero / cover regression | Covered by preflight e2e PASS |

## Edge notes
- Local seed SA-K7M4Q/SE-K7M4Q often → „Project not found“ without membership — media cards still mount (by design).
- Real device labels / VU animation depend on host hardware; structure verified.
