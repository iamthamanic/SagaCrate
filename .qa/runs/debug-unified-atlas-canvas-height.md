# Debug Report — unified-atlas-canvas-height

**Date:** 2026-10-17  
**Project:** sagatree  
**Shell:** web  
**Repro grade:** full  

---

## Summary

The Unified Atlas canvas height tracks a CSS-grid cell that stretches to the tall **Kartenwerkzeuge** chrome; `ResizeObserver` then writes that height onto an **in-flow** canvas, so the map column (and page scroll) grow far past the viewport.  
**Confidence:** high

---

## Bug description

| | |
|--|--|
| **Expected** | Map viewport ~main pane height (bounded); page does not grow multi-thousand px under the map |
| **Actual** | `<canvas>` CSS height up to ~5704px (bitmap ~11408); `top` negative while scrolling; empty dark space below Eldoria |
| **Steps** | 1. Login Local Admin 2. Open `/sagas/SA-E979J/world` (or `/world/map`) 3. Scroll main pane — map “falls” / page is huge |

---

## Reproduction

- **Command / URL:** `http://localhost:3004/sagas/SA-E979J/world/map` (dev :3004)
- **Playwright spec:** none (CDP + user DOM evidence)
- **Result:** reproduced
- **Hard path:** no

---

## Evidence

### User DOM (attached)

- Component: `UnifiedAtlasEditor`
- Canvas: `style="width: 709px; height: 5704px;"`, `width="1418" height="11408"` (2× DPR)
- Position: `top=-1173px` while scrolling

### CDP (live `/world/map`, same session)

Scroll parent (`.overflow-y-auto`): **clientH ≈ 655**, **scrollH ≈ 2823** (`innerHeight` 655).

Ancestor chain (abridged):

| Node | rectH | Note |
|------|------:|------|
| `canvas.block.h-full` | 1238 | `style.height` driven by RO |
| `[data-unified-atlas-viewport]` | 1240 | `flex-1 min-h-[20rem]`, RO target |
| editor `.grid` (3 cols) | 2156→1418 | stretched by tallest column |
| right `aside` (Kartenwerkzeuge) | ~849 | many `min-h-11` controls |
| `[data-saga-world-map]` | 2383 | no max-height |
| scroll pane | 655 / scroll 2823 | viewport-bounded; **content not** |

Canvas `position: static` (in normal flow) — measured explicitly.

### Console

No app exception required for this layout bug (size feedback is layout/RO, not throw).

### Network

N/A (pure layout).

### Screenshot

- User: `assets/browser-screenshot-c0929488-4de9-4f83-9c9b-15e751da49c5.png`
- Report: `.qa/runs/debug-unified-atlas-canvas-height.md`

---

## Prior art

- [x] Repo grep: `UnifiedAtlasEditor.tsx:270–302` — `ResizeObserver` → `canvas.style.height`
- [x] Repo grep: `UnifiedAtlasEditor.tsx:695–770` — grid + in-flow canvas `h-full w-full`
- [x] GitHub: #464 Observers ResizeObserver (generic); no atlas-specific issue
- [ ] LightRAG: n/a
- [ ] Ledger: n/a

---

## Root cause

1. **Hub layout is document-scroll**, not a fixed-height workstation: `SagaWorldMapPanel` / `WorldAtlasWorkbench` sit inside `main` → `overflow-y-auto` with only `min-h-[28rem]`, so percentage/`flex-1` heights are **content-sized**.
2. **Unified editor CSS grid** (`grid-cols-[12rem_1fr_14rem]`) defaults to **stretch**: the right chrome (`Kartenwerkzeuge`, dense `min-h-11` buttons) sets the **row height**; the map column stretches with it.
3. **`ResizeObserver` on `stageRef`** copies `getBoundingClientRect().height` into `canvas.style.height` while the canvas remains **`position: static` / in-flow** (`className="block h-full w-full"`). The bitmap then **defines** the stage content height when ancestors are not height-capped → scroll height balloons (user peak ~5704px).

**Hypotheses tested:**  
1. Wrong world-rect / Eldoria art size → rejected (WORLD_RECT is 1440×900; CSS height ≫ that).  
2. RO ↔ in-flow canvas + grid stretch in scroll shell → **confirmed** by CDP chain.

**Fix attempts this bug:** 0  

---

## Suggested fix (minimal)

1. **Files:** `src/app/world/atlas/unified/UnifiedAtlasEditor.tsx` (primary); optionally `SagaWorldMapPanel.tsx` / `WorldAtlasWorkbench.tsx` for embed height cap.
2. **Change:**
   - Make canvas `absolute inset-0` (out of flow) so RO cannot feed back into layout.
   - Cap stage: e.g. `h-[min(70dvh,36rem)] max-h-[70dvh]` (or `aspect-[4/3] w-full`) when embedded; keep `overflow-hidden`.
   - Grid: `items-start` (or give map column `self-stretch` only inside a **max-height** host); make right chrome `overflow-auto max-h-full` so tools scroll instead of stretching the map.
3. **Regression test:** e2e or check asserting `canvas` CSS height ≤ `window.innerHeight` (or ≤ stage `max-height`) on `/sagas/…/world`.

**Next step:** `@implement` (debug skill does not ship the fix by default)

---

## Notes

- Assumptions: PR #705 Welt-default atlas is loaded; bug also present on `/world/map`.
- Out of scope: redesign of tool chrome density; Leaflet path.
