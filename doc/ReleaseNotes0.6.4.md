# Release Notes - RaidCanvas v0.6.4 (CR035: Fluid Frame Sizing & Quiet Node Awakening)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Requesting Agent & Platform Review:** Zébio (7011) (`AIA Platform` / `aia-workbench`)  
**Product Review & Systems Integration:** Adele (7010 / 7013)  
**Lead Ontologist Review:** Vasco (7015) (`AIA Ontology v1.3`)  
**Package:** `@dr2rai/raid-canvas@0.6.4`  
**Date:** September 2026  
**Change Request:** [`AIA/doc/CR035_AIA_to_RaidCanvas_Graph-sizing-and-quiet-awakening.md`](file:///Users/RSB/Projects/GitHub/AIA/doc/CR035_AIA_to_RaidCanvas_Graph-sizing-and-quiet-awakening.md)  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.6.4` delivers the complete implementation and formal verification of **CR035**, requested by Zébio (`7011`) following the initial adoption of `0.6.3` in `aia-workbench`.

This release resolves two critical operational ergonomics defects and delivers a TypeScript compilation fix for the upstream integration guide:
1. **Fluid Frame Sizing:** The X6 graph dynamically tracks the true host wrapper dimensions across window resizing, late stylesheet loads, and initial `0 × 0` layout passes.
2. **Quiet Node Awakening (Undo Stack Isolation):** Awakening a node into its Duality state (`0.6.1`) is strictly treated as ephemeral view state (like selection or hover), keeping `canUndo() === false` and preventing phantom undo actions.
3. **Integration Guide Alignment:** Corrects `CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md` §6 with canonical exported types (`RaidNodeData`, `RaidCanvasHandle`, `svgContent`, `bounds`), and aligns §4.5 with Dr. Rainer's heraldic color conventions (Warm Graphite anthracite / Net Gold).

---

## 2. Key Highlights in v0.6.4

### 2.1 Fluid Frame Sizing (§1)
* **Root Cause:** In `0.6.3`, `ResizeObserver` was observing `container` (the `div` passed to X6). Because X6 wrote its own inline pixel dimensions onto `container` (`style="width: ...; height: ..."`), the observer observed an element whose size was pinned by X6 itself. On cold loads where the wrapper measured `0 × 0` during the first layout pass, the fallback dimension (`800 × 300` / `800 × 600`) was permanently pinned, and subsequent window resizing or clicking *Fit* failed to use the actual frame.
* **Resolution:**
  - Introduced `wrapperRef` targeting `.raid-canvas-wrapper` (the responsive container with `width: 100%, height: 100%`).
  - `ResizeObserver` now observes `wrapperRef.current`.
  - Content rect updates from late layout settlement or window grow/shrink dynamically invoke `graph.resize(width, height)`.
  - `zoomToFit` now accurately calculates against the live viewport box.

### 2.2 Quiet Node Awakening (§2)
* **Root Cause:** Tap 1 on a dormant node triggers Duality awakening (`0.6.1`), rendering the vertical meridian seam, translucent emerald portal door, and chevron. Because `setNodeDualityActive` mutates X6 attributes (`door/*`, `seam/*`, `chevron/*`), X6's `History` plugin intercepted these mutations and pushed undo commands onto the stack, making `canUndo() === true` on a pure view gesture.
* **Resolution (Triple Lock):**
  1. **History Plugin Filter:** `beforeAddCommand` explicitly discards mutations targeting `door`, `seam`, `chevron`, `attrs/door`, `attrs/seam`, and `attrs/chevron`.
  2. **Option Filtering:** `beforeAddCommand` discards any command carrying `{ ignoreHistory: true }` or `{ silent: true }`.
  3. **Attribute Dispatch:** `setNodeDualityActive` passes `{ ignoreHistory: true, silent: true }` to all `setAttrByPath` calls.
  4. **State Transitions:** `activateDuality` and `deactivateDuality` temporarily disable graph history around view transitions.
  - **Result:** Awakening a node or tapping blank to sleep leaves `canUndo() === false` and `canRedo() === false`.

### 2.3 Integration Guide Alignment (§3)
* Updated [`doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md):
  - Renamed draft types to canonical exports: `RaidNodeData` (formerly `AimNodeData`), `RaidCanvasHandle` (formerly `RaidCanvasRef`).
  - Replaced `initialSvg` with `svgContent` and removed nonexistent `onCanvasClick` prop in favor of `onSelectionChange`.
  - Step 2 entity mapper constructs canonical `displayName`, `instance`, and `bounds: { x, y, width, height }`.
  - Corrected §4.5 and ASCII diagram: Person head-and-shoulders silhouette renders in Warm Graphite anthracite (`#1F2937`) when dormant and Net Gold (`#F59E0B`) when `initiates` is active, with Heraldic Green strictly reserved for the awakened Duality door.

---

## 3. Automated Test Verification

All 87 tests in the test suite pass with 0 failures across 11 test suites (`pnpm -r run test`):
- **CR035 Tests:**
  - `CR035: setNodeDualityActive passes ignoreHistory: true and silent: true to setAttrByPath`
  - `CR035: History plugin beforeAddCommand rejects door, seam, chevron, ignoreHistory, and silent options`
  - `CR035: Auto-resize observer observes host wrapper element rather than pinned container`
- Plus all 84 regression tests covering CR020–CR034, Role Model, edge directionality, and XML escaping.

---

## 4. Package Artifacts & Tooling
- `@dr2rai/raid-canvas@0.6.4` compiled with TypeScript `7.0.2` and ESModule outputs.
- `apps/playground` verified with Vite 6.2.0 production build.
- Linter verified monorepo-wide via `pnpm run lint` (`tsc --noEmit`).
