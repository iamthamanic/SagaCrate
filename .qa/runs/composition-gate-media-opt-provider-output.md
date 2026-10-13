# Composition Gate — media-opt-provider-output

- HEAD_SHA: a662b2f5d31498fcc6087671b10c2d3570741488
- BASE_SHA: f1fc759858b93c3c1a16a6f295cd78a40ad440c5
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Meshy item-thumbnail job succeeds; Edge downloads allowlisted image, optimizes via Deno WASM adapter, then persists to Storage and updates definition asset key.

## Hop chain
1. AuthZ `assertCanMutateDefinition` (owner/GM)
2. `downloadMeshyImageBytes` (SSRF host allowlist + size/timeout)
3. `optimizeProviderThumbnailBytes` → WebP / fail-closed statuses
4. `uploadToStorage` + `insertAsset` + `patchDefinitionAssetKey` (only on optimize ok)

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | one job poll → one optimize → one persist | job row status machine | pass |
| Invalid/missing | optimize fail → job failed, no Storage write | `!optimized.ok` branch | pass |
| Two consumers / crash | prior definition assetKey untouched on fail | no patch on fail path | pass |

## Flags
none
