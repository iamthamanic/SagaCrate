# Feature: media-opt-world-pin (#637)

## Intent
Weltkarten-Pin-Upload mit Preview-First Intake und vorhandenen WebP-fähigen Storage-Services verbinden.

## Happy Path
- [ ] Pin zeigt sofort lokale Vorschau und optimiert vor Upload (`map-pin`)
- [ ] PNG/JPEG/WebP und 5MiB-Bucket-Policy bleiben konsistent
- [ ] Map-Persistenz speichert owner-scoped Pfad statt Base64
- [ ] Abort, Invalid Input, Replace und Originalasset-Fallback sind getestet
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)
