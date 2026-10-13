# Feature: media-opt-item-webp-contract (#641)

## Intent
Item-Thumbnail MIME-Berechtigung atomar in Domain, Edge, Storage und Datenbank auf WebP erweitern, inklusive Meshy Image-to-3D-Verbraucher.

## Happy Path
- [ ] Domain, Bucket, DB Constraint und Edge erlauben PNG/JPEG/WebP abgestimmt
- [ ] Server prüft WebP Magic Bytes und Ablehnung falscher MIME
- [ ] Alte PNG/JPEG-Thumbnails bleiben voll funktionsfähig
- [ ] Meshy Image-to-3D und Migrationstest funktionieren mit WebP
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)
