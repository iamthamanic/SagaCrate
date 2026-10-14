# Acceptance — Session Lobby Saga Cover

Feature slug: `session-lobby-saga-cover`

## Intent

In der Session-Lobby steht links neben der Session-Code-Box das Saga-Cover (native Pack-Art), ohne Crop des Titel-Treatments; bei fehlendem Cover ein klarer Fallback. Layout folgt Main-Pane Content-Width, nicht nur Viewport.

## Surface

- Mode: SETUP / Journey
- Adaptive surface: Journey (`data-au-surface="session-lobby"`)
- Device bands: Phone, Tablet, Desktop
- Gates: AU-01 (bands), AU-TOUCH (44px primary), AU-CONTENT-WIDTH (`@container/main` recomposition)

## Preconditions

- #491 Lobby Preflight gemerged
- Nutzer ist Session-Mitglied mit sichtbarem Session-Code

## Happy Path

1. Lobby öffnen für Dornhain-Saga
2. Cover links neben Session-Code sichtbar (echtes `<img>`, nicht nur Frame)
3. Cover-Titelbehandlung vollständig lesbar (square frame)
4. Code kopieren / Einladung unverändert
5. Schmale Main-Pane (`@[40rem]/main`) stackt Cover über Code; breitere Pane nebeneinander

## Edge Cases

- Unbekannte Saga → Buchstaben-Fallback, Layout bleibt
- Group-run Namen (`… · Gruppe`) → Cover der Basis-Saga
- Media/LiveAct-Probes und Enter-Regeln unverändert (#491)

## Security Coverage

- Cover URL ist public static asset path — keine AuthZ
- Keine Roh-Media-Persistenz; Membership bleibt SoT für Enter

## Checklist

- [x] Cover neben Session-Code
- [x] Square frame / kein 2:3-Seiten-Crop
- [x] Fallback ohne Cover
- [x] Group-run display names resolve pack cover
- [x] Hero recomposes via `@container/main` (AU-CONTENT-WIDTH)
- [x] Enter/Media-Invarianten #491 unberührt
- [x] E2E asserts join-hero + cover image for Dornhain fixture

## Composition Gate

- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-session-lobby-saga-cover.md`
