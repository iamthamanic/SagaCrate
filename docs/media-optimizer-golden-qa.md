# Media Optimizer — Golden QA evidence (#649)

Feature slug: `media-opt-golden-qa`  
Epic: #624 · Sequence 13/13

## Gates

| Gate | How | Expected |
|------|-----|----------|
| Golden fixtures | `scripts/media-optimizer-golden-qa-check.mjs` §3–4 | GIF/alpha/abort/over-budget/bytes policy + facade abort |
| Product surfaces | same script §2 | portrait, map-pin, look-reference, item-thumbnail, provider-output wired |
| Initial WASM lazy | script §5 + `e2e/media-optimizer-golden.spec.ts` | no static jsquash; cold load fetches no webp WASM |
| Provider server | Deno unit + #647 check | fail-closed optimize before Storage |
| test-gate | `npm run test-gate` | includes golden-qa check |

## Surfaces

1. **Portrait** — `useCharacterAvatarEditor` / `character-portrait`
2. **Map** — `WorldMapPinDialogs` / `map-pin`
3. **Look** — `look-reference-adaption` / `look-reference`
4. **Item** — `prepareItemThumbnailFile` / `item-thumbnail`
5. **Provider** — Meshy path `optimizeProviderThumbnailBytes` (#647)

## Non-goals

No 3D/audio/video encoders in this ticket.
