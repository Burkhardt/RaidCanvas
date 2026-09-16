# RaidCanvas v0.4.0 Implementation Plan
## Built-in History on Ref Handle, Port-Hover Noise Filtration, & Viewport Auto-Bounds

**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead  
**Target Package:** `@dr2rai/raid-canvas@0.4.0`  
**Date:** 2026-09-15  
**Upstream Collaboration:** Adele (7010) & Zébio (`aia-workbench`)

---

## 1. Context & Objectives

Following the successful release and adoption of `@dr2rai/raid-canvas@0.3.3` across all 1,033 .NET and 134 Vitest gates in AIA v1.8.9, product management (Adele) and upstream engineering (Zébio) triaged the remaining open items in CR029 and identified a valuable upstream optimization:

1. **CR029 Item 1 (History on Ref Handle):**
   Package `@antv/x6-plugin-history` directly inside `<RaidCanvas />` and expose `undo()`, `redo()`, `canUndo()`, and `canRedo()` on `RaidCanvasHandle`. This ensures history lifecycle is bound to the canvas component and survives `readOnly` graph rebuilds without consumer intervention.
2. **CR029 Item 2 (Port-Hover Noise Filtration):**
   Eliminate undo-stack pollution from mouse movements and port-hover visibility toggles. This is solved via a double-lock defense:
   - Pure CSS-driven port visibility on `.x6-node:hover` / `.aim-node:hover`.
   - Plugin `beforeAddCommand` filtering that discards any port or transient hover attribute mutations.
3. **CR029 Item 3 (Port Visibility During Terminal Drag) Withdrawn:**
   Formally dropped per consensus. With center-aiming Manhattan orthogonal routing dynamically docking to optimal box faces, manual terminal port-snapping is obsolete.
4. **Upstream Opportunity: Viewport Auto-Bounds in `updateExistingSvg`:**
   Previously, `updateExistingSvg` left the root `<svg viewBox="...">` untouched. When nodes were dragged outside the base canvas bounds, external viewers (macOS QuickLook/Preview, Keynote, Safari, Chrome) clipped the content. `aia-workbench` maintained a custom wrapper `withViewportCovering()` to recalculate the bounding box. In v0.4.0, `updateExistingSvg` calculates the content envelope of all active node bounds and bend points natively, expanding the root `viewBox` (and `width`/`height`) so `withViewportCovering()` can be permanently retired.

---

## 2. Technical File Changes

### 2.1 Dependencies & Metadata
- **`packages/canvas/package.json`**:
  - Add `@antv/x6-plugin-history: ^2.2.4` to dependencies.
  - Bump package version to `0.4.0`.
- **`packages/canvas/src/types.ts`**:
  - Add `autoBounds?: boolean;` (default `true`) and `viewportPadding?: number;` (default `60`) to `SerializationOptions`.
- **`README.md`**:
  - Add `npm 0.4.0` badge and document React component with built-in history API.

### 2.2 Built-in History & Port Hover Noise Filtration
- **`packages/canvas/src/styles/aoaim-theme.css`**:
  - Add CSS hover rules for `.x6-node:hover .x6-port`, `.aim-node:hover .aim-port-body`, and `circle[magnet="true"]`.
  - Makes port appearance purely visual without triggering JavaScript attribute mutations.
- **`packages/canvas/src/RaidCanvas.tsx`**:
  - Import `History` from `@antv/x6-plugin-history`.
  - Register `new History(...)` on graph when not in `readOnly` mode.
  - Configure `beforeAddCommand` filter to discard commands matching `ports`, `ports/*`, `/ports/`, `tools`, and `ignoreHistory`.
  - Extend `RaidCanvasHandle` with `undo()`, `redo()`, `canUndo()`, and `canRedo()`.

### 2.3 Native Viewport Auto-Bounds in `updateExistingSvg`
- **`packages/canvas/src/RaiBridge.ts`**:
  - When `updateExistingSvg` runs, parse existing `viewBox` (or `width`/`height`).
  - Envelop all node boundaries (`x`, `y`, `width`, `height`) and edge bend points with customizable padding (default 60px).
  - If content extends beyond current boundaries (or into negative coordinates), expand `viewBox`, `width`, and `height` dynamically.
  - Preserve `0 0` origin if content remains within the positive quadrant.
  - Honor `options.autoBounds === false` if a consumer wants strict viewBox preservation.

### 2.4 Test Suites
- **`packages/canvas/test/canvas.test.mjs`**:
  - Add 4 tests verifying `updateExistingSvg` viewport auto-bounds (outward node expansion, within-frame preservation, negative coordinate expansion, `autoBounds: false` override).
- **`packages/canvas/test/RaidCanvas.test.mjs`**:
  - Add tests verifying `RaidCanvasHandle` history API and `beforeAddCommand` port noise filtering.

---

## 3. Verification Plan

1. `pnpm -r run build && pnpm -r run typecheck` (0 errors).
2. `pnpm -r run test` (38 / 38 unit tests passing across 6 suites).
3. `npm pack --dry-run` to verify package contents and tarball size.
4. Record all results in `doc/ReleaseNotes0.4.0.md` and walkthrough artifact.
