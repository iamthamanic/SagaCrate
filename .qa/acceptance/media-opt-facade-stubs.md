# Feature: media-opt-facade-stubs (#628)

## Intent
Statische, streng typisierte Facade mit den Media-Kinds image, video, model3d, audio. Drei Stubs mit Ausbau-TODO und explizitem unsupported; keine Fake-Erfolge.

## Happy Path
- [ ] Facade dispatcht deterministisch nach Kind
- [ ] Video/Audio/3D liefern typed unsupported und Ausbau-TODO (Mediabunny bzw. glTF Transform)
- [ ] Image Engine ist über den gemeinsamen Contract austauschbar (Placeholder ohne Codec)
- [ ] Kein Codec in Initial-Bundle / Facade-Source
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Edge Cases
- [ ] AbortSignal → `aborted`
- [ ] Stub engines never return `optimized` / `unchanged`

## Security Coverage
- No new endpoints/secrets. Client optimize does not replace server MIME/RLS.

## Implementation Notes
- `optimizeMedia` lazy-imports engines per kind.
- Image placeholder returns `failed` until #630 WebP port.
