# Release Notes - RaidCanvas v0.4.1 (CR031 History Hydration Isolation)

**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead (`Burkhardt/RaidCanvas`)  
**Product Review:** Adele (7010), AIA Product Manager  
**Platform & Verification:** Zébio (7011), Full-Stack Lead Developer (`aia-workbench`)  
**Package:** `@dr2rai/raid-canvas@0.4.1`  
**Date:** 2026-09-16  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.4.1` is a precision point release that resolves **CR031** (History Hydration Stack Contamination) and formalizes the closure and withdrawal of **CR029 Item 3**.

In `v0.4.0`, bundling `@antv/x6-plugin-history` into `<RaidCanvas />` successfully eliminated port hover noise from the history stack and made `undo()` / `redo()` available on `RaidCanvasHandle`. However, live projection testing in `aia-workbench` revealed a latent defect: during diagram hydration, all initial cell additions (`graph.addNode` and `graph.addEdge`) were recorded by the active history plugin as `cell:added` commands (typically 8 commands for 5 nodes and 4 edges). As a result, touching nothing immediately after diagram load left `canUndo() === true`. Pressing Undo (situated beside "Save layout" in the toolbar) would sequentially delete edges (`4 → 3 → 2 → 1 → 0`) and nodes (`5 → 4 → 3`), destroying the canvas.

Version 0.4.1 implements an airtight two-tier isolation defense that ensures the undo stack remains completely clean (`canUndo() === false`) upon diagram arrival, and exposes `cleanHistory()` on `RaidCanvasHandle` for host-level resets.

---

## 2. Changes in v0.4.1

### CR031: Two-Tier History Hydration Isolation
1. **`beforeAddCommand` Hydration Gating**:
   - `isHydratingRef.current` tracks when the canvas is undergoing initial inflation or dynamic SVG replacement.
   - The history plugin's `beforeAddCommand` predicate checks `if (isHydratingRef.current) return false;`. All `cell:added` and layout initialization events during hydration are discarded before reaching the stack.
2. **Post-Hydration Flush (`cleanHistory`)**:
   - In the `finally` block of both initial mount hydration and dynamic `svg`/`svgContent` prop changes, `(graph as any).cleanHistory?.()` is invoked.
   - Guarantees that any internal graph initialization side effects or bounding normalizations are purged, delivering `canUndo() === false` and `undoStack` depth `0` when the canvas is handed to the operator.
3. **Imperative Handle Method (`cleanHistory`)**:
   - Exposed `cleanHistory: () => void` on `RaidCanvasHandle`.
   - Host applications can explicitly flush undo/redo stacks when performing programmatic model swaps or baseline commits.

### Formal Closure: CR029 Item 3
- Formally withdrawn and closed per mutual agreement between Alan, Adele, and Zébio. Center-aiming Manhattan orthogonal routing renders terminal port-snapping obsolete.

---

## 3. Delivery Verification Checklist

| Gate / Requirement | Target / Contract | Result | Status |
| :--- | :--- | :--- | :---: |
| **CR031 Hydration Filtering** | Reject commands when `isHydratingRef.current` is true | Verified in unit tests | ✅ PASS |
| **CR031 Clean Post-Hydration Stack** | `canUndo() === false` immediately after diagram load | Verified in unit tests | ✅ PASS |
| **CR031 Handle API** | `cleanHistory()` exposed on `RaidCanvasHandle` | Verified in unit tests & types | ✅ PASS |
| **CR029 Item 1** | History bundled in `<RaidCanvas />` | Retained from v0.4.0 | ✅ PASS |
| **CR029 Item 2** | Port hover noise filtered from history stack | Retained from v0.4.0 | ✅ PASS |
| **CR029 Item 3** | Port visibility during terminal drag | Formally withdrawn & closed | ✅ CLOSED |
| **Viewport Auto-Bounds** | Dynamic `viewBox` expansion with 60px padding | Retained from v0.4.0 | ✅ PASS |
| **TypeScript Typecheck** | `tsc --noEmit` across all workspace projects | 0 errors | ✅ PASS |
| **Package Build** | `tsc -b --force` and Vite bundle build | Clean production build | ✅ PASS |
| **Automated Tests** | 40 unit tests across 6 test suites | 40 passing, 0 failing | ✅ PASS |
| **Authorship Attribution** | Dr. Rainer Burkhardt (`author`), Alan (`contributor`) | Preserved in `package.json` | ✅ PASS |
| **Documentation** | README.md badge & docs, Implementation Plan, Release Notes | Up to date for v0.4.1 | ✅ PASS |

---

## 4. Upstream Integration Guidance for `aia-workbench`

With `@dr2rai/raid-canvas@0.4.1`:
1. Bump dependency in `aia-workbench/package.json` to `@dr2rai/raid-canvas@0.4.1`.
2. Retire the interim `discardHydrationHistory()` guard in `aia-workbench`.
3. Verify that on diagram load, the "Undo" button is disabled (`canUndo() === false`) and pressing Undo causes no cell removals.
