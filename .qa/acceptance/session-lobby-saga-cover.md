# Acceptance — Session Lobby Saga Cover

Feature slug: `session-lobby-saga-cover`

## Intent

In der Session-Lobby steht links neben der Session-Code-Box das Saga-Cover (native Pack-Art), ohne Crop des Titel-Treatments; bei fehlendem Cover ein klarer Fallback.

## Preconditions

- #491 Lobby Preflight gemerged
- Nutzer ist Session-Mitglied mit sichtbarem Session-Code

## Happy Path

1. Lobby öffnen für Dornhain-Saga
2. Cover links neben Session-Code sichtbar
3. Cover-Titelbehandlung vollständig lesbar (square frame)
4. Code kopieren / Einladung unverändert

## Edge Cases

- Unbekannte Saga → Buchstaben-Fallback, Layout bleibt
- Media/LiveAct-Probes und Enter-Regeln unverändert (#491)

## Security Coverage

- Cover URL ist public static asset path — keine AuthZ
- Keine Roh-Media-Persistenz; Membership bleibt SoT für Enter

## Checklist

- [x] Cover neben Session-Code
- [x] Square frame / kein 2:3-Seiten-Crop
- [x] Fallback ohne Cover
- [x] Enter/Media-Invarianten #491 unberührt
- [x] E2E asserts join-hero + cover-frame

## Composition Gate

- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-session-lobby-saga-cover.md`
- HEAD: db1be28a47ee73854a37133bc92cf2a8117d763f
