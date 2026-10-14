# Verify UI — session-lobby-media-preview

- Date: 2026-10-14
- Verdict: PASS
- Spec: `e2e/session-lobby-media-preview.spec.ts` (+ regression `e2e/session-lobby-preflight.spec.ts`)
- Evidence: `.qa/evidence/session-lobby-media-preview/`

## Acceptance mapping

| Criterion | Result |
|-----------|--------|
| Mount: media cards idle, no auto getUserMedia | PASS — camera idle visible; probe CTAs present |
| Dein Platz removed | PASS — `data-session-lobby-self` count 0; text absent |
| Probe CTAs camera/mic/LiveAct | PASS |
| Camera/mic probe after gesture | PASS — click probes; screenshots captured (device grant via Playwright permissions) |
| LiveAct probe | PASS — preview area updates / screenshot `03-liveact-character.png` |
| No horizontal overflow | PASS |
| Join hero / cover regression | Covered by preflight e2e PASS |

## Edge notes
- CI seed may lack membership → LiveAct hint may show no character; still non-blocking.
- Real device labels / VU animation depend on host hardware; structure verified.
