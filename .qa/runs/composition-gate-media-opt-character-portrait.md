# Composition Gate — media-opt-character-portrait

- HEAD_SHA: 1d85f31253f6b391ceb664319536be6f99072ef7
- BASE_SHA: 5e0cb766c0f7ab8883c503beae3a324cd0a607a1
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User uploads a portrait file or captures one from the avatar canvas; client optimizes via character-portrait profile then uploads through the existing owner-scoped Storage path.

## Hop chain
1. `useCharacterAvatarEditor` → `useMediaOptimizeIntake` (preview Object URL)
2. `optimizeMedia` (character-portrait) → ready blob
3. `characterService.uploadPortrait(..., { alreadyOptimized: true })` → repository sniff + Storage `character-portraits`
4. Signed URL returned; prior `portraitUrl` untouched on failure

Cardinality: one upload per successful optimize; no new Edge routes.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 select/capture → 1 optimize → 1 storage object | Single upload path | pass |
| Invalid/missing | optimize fail → toast; no Storage write; old URL kept | early return before upload | pass |
| Two consumers / crash | abort/replace bumps intake generation | intake race + revoke | pass |

## Flags
none

## Skip reason
Reuses existing owner-scoped portrait Storage hop; optimizer intake is client-side only. No new multi-consumer queue or webhook.
