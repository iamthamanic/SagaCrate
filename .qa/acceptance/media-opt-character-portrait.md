# Feature: media-opt-character-portrait (#636)

## Intent
Manuellen Porträt-Upload und Canvas-Capture über den zentralen Intake und den bestehenden Character-Service vorbereiten.

## Happy Path
- [ ] Beide Porträt-Eingänge (Datei + Canvas-Capture) nutzen `character-portrait` Optimizer via intake
- [ ] Sofortvorschau und Lade-/Error/Retry-Zustände bleiben bedienbar (AU)
- [ ] Bisheriges Asset überlebt Fehlversuche; owner-scoped Storage bleibt autoritativ
- [ ] Service `prepareCharacterPortraitFile` + repository magic-byte/WebP; `alreadyOptimized` avoids double encode
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Implementation Notes
- `useCharacterAvatarEditor` + `CharacterEditor` portrait strip
- `character-service.prepareCharacterPortraitFile` / `uploadPortrait({ alreadyOptimized })`
