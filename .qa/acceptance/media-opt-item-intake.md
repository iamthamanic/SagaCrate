# Feature: media-opt-item-intake (#643)

## Intent
Nach WebP-Backend-Migration den manuellen Thumbnail-Upload im bestehenden useItemAssets-Hook mit dem zentralen Image Optimizer verbinden.

## Happy Path
- [ ] Item-Auswahl optimiert profilkonform vor bestehendem Upload-Service
- [ ] Vorhandene Sofortvorschau und Replace/Retry bleiben funktionsfähig
- [ ] Optimiertes WebP wird vom Backend validiert und angenommen
- [ ] Ein fehlgeschlagener Versuch überschreibt kein altes Asset
- [ ] Touched files: zero type escape hatches
