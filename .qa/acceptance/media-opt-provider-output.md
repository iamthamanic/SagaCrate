# Feature: media-opt-provider-output (#647)

## Intent
KI-/Meshy-Bildoutputs nach sicherem Provider-Fetch und Bytevalidierung über den Deno-Adapter vor Storage-Persistenz profilkonform optimieren.

## Happy Path
- [ ] Nach AuthZ + SSRF-Download läuft `optimizeProviderThumbnailBytes` vor Upload
- [ ] Nach Reencode: Magic Bytes / MIME / Limits korrekt (WebP im item-thumbnail Budget)
- [ ] Encode-/Budget-Fehler → Job `failed`, kein stilles Original in Storage
- [ ] Owner-Prüfung, Manifest/`assetKey`-Update und Host-Allowlist bleiben erhalten
- [ ] Touched files: zero type escape hatches
