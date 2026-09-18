# Release Notes - RaidCanvas v0.6.5 (CR035.1: Visible Duality Awakening on Tap 1)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Product Review & Directive Author:** Adele (7010 / 7013) (AIA PM)  
**Lead Full-Stack Review:** Zébio (7011) (`AIA Platform` / `aia-workbench`)  
**Lead Ontologist Review:** Vasco (7015) (`AIA Ontology v1.3`)  
**Package:** `@dr2rai/raid-canvas@0.6.5`  
**Date:** September 2026  
**Governing Document:** [`AIA/doc/CR035.1_AIA_to_RaidCanvas_Silent-awakening-is-invisible.md`](file:///Users/RSB/Projects/GitHub/AIA/doc/CR035.1_AIA_to_RaidCanvas_Silent-awakening-is-invisible.md)  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.6.5` delivers the surgical resolution of **CR035.1**, directly addressing the visual rendering regression identified by Adele (`7010`) and Zébio (`7011`) in `0.6.4`.

In `0.6.4`, keeping Duality awakening out of the undo stack included `silent: true` in `setNodeDualityActive()`. In AntV X6, `silent: true` suppressed the `change:attrs` event, preventing the SVG `NodeView` from re-rendering the DOM. As a result, the model was updated in memory, but the visual affordances (vertical gold meridian seam, emerald portal door, and chevron) remained hidden (`display: none`).

`0.6.5` removes `silent: true` while preserving complete history isolation through `ignoreHistory: true`, `disableHistory()`, and the `beforeAddCommand` filter.

---

## 2. Key Highlights in v0.6.5

### 2.1 Dropping `silent: true` in `setNodeDualityActive()`
* **Mechanism:** In [`packages/canvas/src/X6Shapes.ts`](file:///Users/RSB/Projects/GitHub/RaidCanvas/packages/canvas/src/X6Shapes.ts), `setNodeDualityActive()` options are now strictly:
  ```ts
  const opt = { ignoreHistory: true };
  ```
* **Immediate DOM View Synchronization:** Without `silent: true`, AntV X6 emits `change:attrs`. The underlying `NodeView` immediately receives the event and updates the SVG DOM attributes (`door/display: 'block'`, `seam/display: 'block'`, `chevron/display: 'block'`).
* **Visual Awakening Restored:** On Tap 1, operators immediately see the radiant vertical Net Gold meridian seam, translucent emerald portal door (`rgba(16, 185, 129, 0.25)`), and navigational chevron.
* **Visual Sleep Restored:** On canvas background tap (blank tap), the node immediately returns to dormant sleep (`display: 'none'`).

### 2.2 History Isolation Preserved (`canUndo() === false`)
* History protection remains 100% active through:
  1. `ignoreHistory: true` passed to all `node.setAttrByPath()` calls.
  2. `beforeAddCommand` filter in `History` configuration explicitly dropping all mutations targeting `door`, `seam`, `chevron`, `attrs/door`, `attrs/seam`, and `attrs/chevron`.
  3. `disableHistory()` and `enableHistory()` scoping in `activateDuality()` and `deactivateDuality()`.
* **Result:** Awakening or sleeping a node never enters the history stack; `canUndo()` remains strictly `false`.

---

## 3. Automated Test Verification

All 87 tests in the test suite pass with 0 failures across 11 test suites (`pnpm -r run test`):
- **CR035.1 Acceptance Test:** `CR035.1: setNodeDualityActive drops silent: true and sets ignoreHistory: true so NodeView re-renders DOM`
  - Asserts that all attribute calls receive `{ ignoreHistory: true }` without `silent: true`.
  - Asserts that awakening sets `door/display: 'block'`, `seam/display: 'block'`, and `chevron/display: 'block'`.
  - Asserts that returning to sleep sets `door/display: 'none'`, `seam/display: 'none'`, and `chevron/display: 'none'`.
- All 86 regression tests covering CR020–CR035, frame auto-resizing, and role models pass cleanly.

---

## 4. Package Artifacts & Tooling
- `@dr2rai/raid-canvas@0.6.5` compiled with TypeScript `7.0.2` and ESModule outputs.
- Monorepo linter passes with 0 errors (`pnpm run lint`).
- Tarball verified clean via `npm pack --dry-run`.
