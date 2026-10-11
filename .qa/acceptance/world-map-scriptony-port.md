# Feature: Weltkarte aus Scriptony (Kacheln)

## Intent
Port Scriptony tile map as world module `map` with 6 components, Storage pins, soft-cap 60.

## Happy Path
- [x] Registry module `map` + editor mount
- [x] Migration 068 world_maps + get/save RPCs + pin bucket
- [x] Six UI components + useWorldMapEditor
- [x] Canvas 2D + pointer events; cyan/gold pins
- [x] Checks + test-gate
- [x] Zero type escape hatches / no motion

## Edge Cases
- [x] size clamped 1–60
- [x] Base64 pin paths rejected
- [x] Player view filters undiscovered pins

## Assumptions
- Apply migration 068 on Supabase.
