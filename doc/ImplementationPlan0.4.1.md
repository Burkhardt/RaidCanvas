# Implementation Plan - RaidCanvas v0.4.1 (CR031 History Hydration Isolation)

**Author:** Alan (7012), Visual Systems, Canvas & HCI Lead (`Burkhardt/RaidCanvas`)  
**Reviewers:** Zébio (AIA Platform & Verification), Adele (7010, AIA Product Manager), Dr. Rainer Burkhardt  
**Date:** 2026-09-16  
**Status:** In Progress  

---

## 1. Context & Problem Statement

Following the release and publication of `@dr2rai/raid-canvas@0.4.0`, live verification in `aia-workbench` by Zébio confirmed:
- Node movement undo works in a single press without port-hover noise.
- Viewport auto-bounds dynamically expands the `viewBox` covering out-of-bounds nodes without clipping in macOS QuickLook.
- Formal withdrawal of **CR029 Item 3** (port visibility during terminal drag).

However, live inspection of the history stack revealed **CR031**:
Upon initial load or dynamic SVG update, `hydrateFromSvg()` calls `graph.addNode()` and `graph.addEdge()` in a loop. Because `@antv/x6-plugin-history` was enabled without hydration filtering, all 8 initial cell additions were logged directly to the `undoStack`. 
Immediately after load without user intervention:
```
undoStack: 8 commands (all cell:added)
canUndo() === true
```
Clicking "Undo" (positioned adjacent to "Save layout") would sequentially delete edges (`4 → 3 → 2 → 1 → 0`) and nodes (`5 → 4 → 3`), destroying the canvas.

While the workbench added an emergency client-side guard (`discardHydrationHistory`), the component itself must ensure a pristine history state upon arrival.

---

## 2. Technical Design

We implement a two-tier defense in `RaidCanvas`:

### 2.1 History Filter (`beforeAddCommand`)
`isHydratingRef.current` tracks whether the canvas is undergoing initial inflation or dynamic re-hydration. In `History` plugin configuration:
```ts
beforeAddCommand(_event, args: any) {
  if (isHydratingRef.current) {
    return false;
  }
  // Transient port and ignoreHistory filters...
}
```

### 2.2 Post-Hydration Stack Flush (`cleanHistory`)
In the `finally` block of both initial hydration and subsequent SVG prop changes:
```ts
finally {
  isHydratingRef.current = false;
  (graph as unknown as { cleanHistory?: () => void }).cleanHistory?.();
}
```
This guarantees that any internal graph initialization side effects or layout normalizations are completely purged.

### 2.3 Handle API Expansion
Expose `cleanHistory: () => void` on `RaidCanvasHandle` so consumers can explicitly reset the history stack when performing programmatic model swaps or baseline commits.

---

## 3. Affected Files

1. `packages/canvas/src/RaidCanvas.tsx`:
   - Add `cleanHistory` to `RaidCanvasHandle` interface and implementation.
   - Guard `beforeAddCommand` with `isHydratingRef.current`.
   - Call `cleanHistory()` in both hydration `finally` blocks.
2. `packages/canvas/package.json`:
   - Bump version to `0.4.1`.
3. `packages/canvas/test/RaidCanvas.test.mjs`:
   - Add unit tests for hydration command filtering and `cleanHistory` handle contract.
4. `README.md`:
   - Update version badge to `0.4.1` and document `cleanHistory()`.
5. `doc/ImplementationPlan0.4.1.md`:
   - This document.
6. `doc/ReleaseNotes0.4.1.md`:
   - Release notes and verification checklist.

---

## 4. Acceptance Criteria (CR031)

1. Loading an SVG with 5 nodes and 4 edges results in `canUndo() === false` immediately after mount.
2. Pressing `undo()` immediately after mount is a no-op; all 5 nodes and 4 edges remain intact.
3. Making a user edit adds exactly 1 command to history (`canUndo() === true`).
4. Undoing that edit reverts to the hydrated state and sets `canUndo() === false`.
5. Programmatically updating the `svg` / `svgContent` prop re-hydrates the graph and flushes history to 0 commands.
