# Release Notes: @dr2rai/raid-canvas 0.4.0
## Built-in History on Ref Handle, Port-Hover Noise Filtration, & Viewport Auto-Bounds

**Release Date:** September 15, 2026  
**Package:** `@dr2rai/raid-canvas@0.4.0`  
**Git Tag:** [`v0.4.0`](https://github.com/Burkhardt/RaidCanvas/releases/tag/v0.4.0)  
**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead  
**Upstream Collaboration:** Adele (7010) & Zébio (`aia-workbench`)

---

## 1. Delivery Checklist

| Item | Status | Verification & Details |
| :--- | :--- | :--- |
| **Bundled `@antv/x6-plugin-history`** | **DELIVERED** | Packaged directly inside `@dr2rai/raid-canvas` dependencies and registered on graph initialization |
| **Imperative History on `RaidCanvasHandle`** | **DELIVERED** | Exposes `undo()`, `redo()`, `canUndo()`, and `canRedo()` on ref handle; automatically fires debounced `onChange` / `onSave` |
| **Port-Hover Noise Filtration** | **DELIVERED** | Double-lock defense: pure CSS port hover (`aoaim-theme.css`) + `beforeAddCommand` filter in history plugin discarding port, tool, and transient commands |
| **CR029 Item 3 Formally Withdrawn** | **CLOSED** | Terminal port visibility during drag dropped per consensus with center-aiming Manhattan routing |
| **Native Viewport Auto-Bounds** | **DELIVERED** | `updateExistingSvg` dynamically calculates encompassing `viewBox` covering outward nodes/edges with padding; enables `aia-workbench` to retire `withViewportCovering()` |
| **README & Documentation Alignment** | **DELIVERED** | Added `npm 0.4.0` badge, updated API reference for `RaidCanvasHandle`, created `doc/ImplementationPlan0.4.0.md` and `doc/ReleaseNotes0.4.0.md` |
| **Automated Test Suite** | **PASSED** | **38 / 38 unit tests passing** across 6 test suites (`pnpm -r run test`), including 4 new viewport auto-bounds tests and history filter tests |
| **Monorepo Build & Typecheck** | **PASSED** | 0 errors across TypeScript 7.0.2 compiler and Vite bundler |

---

## 2. Key Architectural Enhancements

### A. Built-in History on `RaidCanvasHandle` (CR029 Item 1)
Previously, consumers had to manage history plugin instantiation and lifecycle manually. Across `readOnly` graph rebuilds or SVG prop changes, history wiring required complex wrapper glue.

In v0.4.0, `@antv/x6-plugin-history` is bundled directly into `@dr2rai/raid-canvas`. `<RaidCanvas />` manages the plugin lifecycle internally and exposes imperative controls via `ref`:

```tsx
const canvasRef = useRef<RaidCanvasHandle>(null);

// Undo/Redo commands directly on canvas handle
<button onClick={() => canvasRef.current?.undo()} disabled={!canvasRef.current?.canUndo()}>
  Undo
</button>
<button onClick={() => canvasRef.current?.redo()} disabled={!canvasRef.current?.canRedo()}>
  Redo
</button>
```

When `undo()` or `redo()` is called, `<RaidCanvas />` invokes X6's history engine and dispatches debounced serialization, ensuring `onChange` and `onSave` remain synchronized with the canvas state.

### B. Port-Hover Noise Filtration (CR029 Item 2)
In interactive diagram editors, moving the cursor across the canvas should never pollute the undo stack. We resolved this via defense-in-depth:
1. **Pure CSS Hover (`aoaim-theme.css`):**
   ```css
   .x6-node:hover .x6-port,
   .aim-node:hover .x6-port,
   .x6-node:hover circle[magnet="true"],
   circle[magnet="true"]:hover {
     visibility: visible !important;
     opacity: 1 !important;
   }
   ```
   Port visibility is driven entirely by the browser's CSS rendering engine without JavaScript cell attribute mutations.
2. **`beforeAddCommand` Filter:**
   The built-in history plugin filters out any transient port property mutations (`ports`, `ports/*`, `/ports/`), tools adjustments, or commands tagged with `{ ignoreHistory: true }`.

### C. Native Viewport Auto-Bounds in `updateExistingSvg`
Previously, `updateExistingSvg` left the root `<svg viewBox="...">` and dimensions untouched. Moving nodes outside the initial 800×600 canvas caused clipping in external renderers (QuickLook, macOS Preview, Safari, Chrome, Keynote). Upstream in `aia-workbench`, this required maintaining a wrapper helper `withViewportCovering()`.

In v0.4.0, `updateExistingSvg` natively computes the content envelope across all nodes and edge bend points:
- If all nodes fit within the base frame, the existing `viewBox` is preserved.
- If nodes or bend points extend outward or into negative coordinates, the `viewBox` (and `width`/`height` if present) expands dynamically with configurable padding (`viewportPadding`, default 60px).
- Consumers can disable this behavior if needed via `autoBounds: false` in `SerializationOptions`.

**Result for Upstream:** `aia-workbench` can immediately retire `withViewportCovering()`.

---

## 3. Verification Summary

* **Build & Typecheck**:
  ```bash
  pnpm -r run build && pnpm -r run typecheck
  # Output: 0 errors across packages/canvas and apps/playground
  ```
* **Test Suite**:
  ```bash
  pnpm -r run test
  # Output: 38 tests across 6 suites passed (0 failures)
  ```
  - `dynamically expands root viewBox when nodes are translated outside base frame`: **PASSED**
  - `preserves base viewBox when all nodes fit within the base frame`: **PASSED**
  - `expands into negative coordinates when nodes are dragged to negative x/y`: **PASSED**
  - `respects autoBounds: false option by preserving viewBox unchanged`: **PASSED**
  - `History beforeAddCommand filters out port noise and ignoreHistory commands`: **PASSED**
  - `RaidCanvas component creates element with ref support`: **PASSED**

---

## 4. Upstream Integration Guide (`aia-workbench`)

Adele and Zébio can update to `0.4.0` in `aia-workbench`:

```bash
pnpm update @dr2rai/raid-canvas@0.4.0
```

1. **Delete Workarounds:** Remove `withViewportCovering()` and custom history management wrappers.
2. **Connect Handle:** Call `canvasRef.current?.undo()`, `redo()`, `canUndo()`, and `canRedo()` directly from the workbench toolbar.
