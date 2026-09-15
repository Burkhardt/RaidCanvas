# Implementation Plan: Release 0.3.0

**Topic:** Edge Terminal Drag Re-anchoring & Dynamic Routing Switch  
**Component:** `@dr2rai/raid-canvas` & `apps/playground` (Visual Studio)  
**Author:** Alan (7012), Visual Systems, Canvas & HCI Lead  
**Approved by:** Rainer Burkhardt  

---

## 1. Background & Problem Statement

1. **Routing Flexibility**:
   The engine previously defaulted strictly to Manhattan routing (obstacle-avoiding 90° orthogonal bends with rounded corners). In simple sequence flows, hierarchical trees, or organic concept diagrams, users often prefer direct **Straight** lines or smooth **Curved** splines. A simple switch is required to toggle routing globally for the diagram or individually per edge.

2. **Edge Terminal Re-anchoring via Drag**:
   When an edge connects two boxes (e.g., from Box A's left port to Box B's left port), users need to be able to grab the origin or destination terminal with the mouse and drag it to another connector (e.g., from left to top, right, or bottom) on the same box or another box. While AntV X6 has underlying terminal dragging mechanics (`source-arrowhead` / `target-arrowhead`), they were not attached to edges in `<RaidCanvas />`, and `edge:connected` discarded re-connections when `isNew: false`.

---

## 2. Architectural Design

### A. Routing Modes
We define three canonical routing strategies:
* **`manhattan`** (Default): Intelligent obstacle-avoiding 90° orthogonal router with rounded corners (`radius: 8`).
* **`normal`** (Straight): Direct straight line connecting ports directly without orthogonal bends.
* **`smooth`** (Curved): Elegant cubic bezier spline connecting ports smoothly.

### B. Two-Tier Control Model
1. **Global Canvas Switch**: Integrated into `StudioToolbar` to set the default for new connections and instantly re-route all existing edges.
2. **Per-Edge Inspector Setting**: Integrated into `PropertyInspector` to allow fine-grained override on a per-relationship basis.

### C. Terminal Re-Anchoring Mechanics
1. **Visual Drag Handles**: When an edge is clicked, high-visibility Cascais Net Gold (`#F59E0B`) drag handles (`source-arrowhead` and `target-arrowhead`) are mounted at the origin and destination terminals.
2. **Magnetic Port Snapping & Semantic Anti-Entropy**: Dragging either handle highlights candidate ports in Heraldic Green (`#10B981`) and enforces the AOAIM semantic validation matrix before committing.
3. **Inspector Quick-Picks**: Dedicated buttons (`[ Top | Right | Bottom | Left ]`) for both origin and destination ports in `PropertyInspector`.

---

## 3. Implementation Specification

### Core Package (`@dr2rai/raid-canvas`)

#### `packages/canvas/src/types.ts`
* Added `AimRoutingMode = 'manhattan' | 'normal' | 'smooth'`.
* Extended `RaidEdgeData` with optional `routing?: AimRoutingMode`.
* Extended `RaidCanvasProps` with `defaultRouting?: AimRoutingMode`.
* Added `ATTR_ROUTING: 'aim-routing'` to `AimSvgContract`.

#### `packages/canvas/src/X6Shapes.ts`
* Implemented `applyEdgeRouting(edge: Edge, routing: AimRoutingMode): void`:
  * Configures router (`manhattan` vs `normal`).
  * Configures connector (`rounded` vs `smooth` vs `normal`).
* Updated `createAimEdge(data)` to apply the specified `data.routing` (or canvas default).

#### `packages/canvas/src/RaidCanvas.tsx`
* Converted `RaidCanvas` to attach `source-arrowhead`, `target-arrowhead`, and `vertices` tools upon edge selection with Cascais styling (`fill: NetGold`, white border, `cursor: grab`).
* Updated `edge:connected` listener to handle re-connections (`!isNew`):
  * Updates edge internal `data` (`sourcePort`, `targetPort`, `sourceId`, `targetId`, `routing`).
  * Re-evaluates semantic edge kind and stereotypes if node types changed.
  * Fires debounced SVG serialization and updates selection.
* Added `edge:change:source` and `edge:change:target` listeners to synchronize layout.
* Extended `RaidCanvasHandle` with `setRoutingMode(mode, applyToAll)` and `getRoutingMode()`.
* Updated `updateEdge(id, updates)` to dynamically switch edge routing and source/target ports.

#### `packages/canvas/src/RaiBridge.ts`
* Serializes `aim-routing="manhattan|normal|smooth"`, `aim-source-port`, and `aim-target-port` on edge elements.
* Ingests and hydrates `aim-routing`, `aim-source-port`, and `aim-target-port` during SVG parsing.

---

### Studio Application (`apps/playground`)

#### `apps/playground/src/components/StudioToolbar.tsx`
* Added segmented routing switch: `[ ⮡ Manhattan | ╲ Straight | ∿ Curved ]`.
* Bound to canvas ref to trigger instantaneous diagram-wide routing updates.

#### `apps/playground/src/components/PropertyInspector.tsx`
* Added **Routing Style** segmented buttons for the selected edge.
* Added **Origin Connector Port** and **Destination Connector Port** pickers (`[ Top | Right | Bottom | Left ]`) with active port highlighting.
* Updated Terminals Info summary to display resolved port docking.

#### `apps/playground/src/App.tsx`
* Added `routingMode` state and passed down to `StudioToolbar` and `RaidCanvas`.
* Updated `refreshSelectedEntity` to pull live port IDs (`cell.getSourcePortId()`, `cell.getTargetPortId()`) from X6 edge cells.

---

## 4. Verification Plan

### Automated Tests
* `packages/canvas/test/canvas.test.mjs`:
  * `createAimEdge respects routing modes (manhattan, normal, smooth)`: Verified metadata and connector configuration.
  * `RaiBridge serializes aim-routing and port attributes into SVG`: Verified round-trip preservation of routing and port attributes.
* Monorepo compilation & typecheck (`tsc -b` and `tsc --noEmit`): 0 TypeScript errors under TS 7.0.2 Go native compiler.

### Manual Verification
* Visual verification in Chrome headless via DevTools protocol:
  * Edge selection with NetGold drag handles and Property Inspector port pickers.
  * Global Straight routing toggle in Studio Toolbar.
