# Acceptance — library-carousel-slash-routes

## Summary
Bibliothek uses slash routes for entity tabs; EntityBrowser carousel cards are wider (cqw clamp) with portrait-safe character frames and landscape contain for saga/world covers.

## Checklist
- [x] `/library/player-characters` opens Charaktere
- [x] `/library/sagas` opens Sagas
- [x] `/library/items` opens Items
- [x] Legacy `/library?tab=items` normalizes to `/library/items`
- [x] Unknown `/library/not-a-tab` → not-found
- [x] Shell Bibliothek → `/library/player-characters`
- [x] Character carousel: square stage, face-biased cover
- [x] Saga/world carousel: landscape contain (no title crop from object-cover)
- [x] `npm run test-gate` PASS

## Composition Gate
See `.qa/runs/composition-gate-library-carousel-slash-routes.md` — Verdict CLEAR (HEAD_SHA a4835a752ea43637d0ab502492743e7356c572c5).
