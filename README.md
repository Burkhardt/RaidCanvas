# RaidCanvas

> **Interactive TypeScript Diagram Canvas for AOAIM Visual Modeling & Ontological SVG Synchronization**  
> *Burkhardt / RaidCanvas*  
> **Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
> **Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead

[![npm version](https://img.shields.io/badge/npm-0.5.0-red.svg)](https://www.npmjs.com/package/@dr2rai/raid-canvas)
[![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-blue.svg)](https://www.typescriptlang.org/)
[![AntV X6](https://img.shields.io/badge/AntV%20X6-2.18-indigo.svg)](https://x6.antv.vision/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 1. Vision & Architectural Heritage

### Alan Kay & The Dynabook Spirit
> *"The best way to predict the future is to invent it."* — Alan Kay

**RaidCanvas** is engineered under the worldview of dynamic, malleable media: software systems should not be static, opaque text files, but living visual objects that communicate through clear message protocols, respond immediately to direct human manipulation, and reflect deep semantic truth.

### Heritage to C++ `GrafObj`
In preceding decades, Rainer Burkhardt's C++ **`GrafObj`** library pioneered object-oriented interactive diagramming, establishing foundational patterns for graphical object hierarchies, orthogonal connector routing, port docking, and event-driven canvas manipulation.

**RaidCanvas** is the modern TypeScript / Web heir to `GrafObj`:
* Replaces legacy desktop C++ graphics loops with modern hardware-accelerated SVG/Canvas rendering via **AntV X6**.
* Bridges client-side interactive direct manipulation with server-side semantic reasoning engines.
* Upholds strict object boundaries and deterministic layout fidelity.

---

## 2. The Ecosystem Companion: `.raid` & .NET `RaiDiagram`

In the Burkhardt AOAIM (Activity-Object-AI Model) platform architecture, diagramming adheres to a four-tier separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│ 1. Semantic Model (.raid)                              │
│    Canonical JSON/JSON5 facts (nodes, roles, edges)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. Structural Notation (.puml)                         │
│    Clean PlantUML DSL source (presentation-free)       │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌────────────────────────────┐
│ 3A. RaiDiagram (.NET C#)│ │ 3B. RaidCanvas (TypeScript)│
│     Batch generation,   │ │     Interactive editor,    │
│     PlantUML compilation│ │     AntV X6 canvas,        │
│     Headless SVG export │ │     Live bend point routing│
└────────────┬────────────┘ └────────────┬───────────────┘
             │                           │
             └─────────────┬─────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. Ontological Vector Contract (.svg)                  │
│    Interactive SVG enriched with 'aim-*' attributes    │
└────────────────────────────────────────────────────────┘
```

* **`.NET RaiDiagram` (`RAIkeep`):** Governs headless manifest compilation, semantic validation, and server-side static vector delivery.
* **`RaidCanvas`:** Delivers rich in-browser manipulation, orthogonal Manhattan edge routing, user-editable bend points, and real-time bidirectional synchronization back to `.raid` manifests and `aim-*` SVG documents.

---

## 3. The `aim-*` Ontological SVG Contract

RaidCanvas treats SVG as a **first-class semantic document**, not a dumb pixel dump. Any SVG generated or consumed by RaidCanvas implements the **`aim-*` ontological contract**, decorating standard SVG elements with typed domain attributes:

### Node Attributes
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `aim-node` | `boolean` | Flags the SVG `<g>` or shape as an ontological entity node. |
| `aim-id` | `string` | Unique entity identifier (e.g. `SignContract_UC`, `Contract_OD`). |
| `aim-kind` | `AimOntologyKind` | Entity archetype: `'uc'` \| `'act'` \| `'cls'` \| `'obj'` \| `'per'`. |
| `aim-display-name` | `string` | Human-readable label rendered inside the node. |
| `aim-qualifier` | `string?` | Optional upper qualifier line, styled quietly (italic, never underlined). |
| `aim-instance` | `boolean?` | When `"true"`, underlines the entity name. No archetype implies instance. |
| `aim-stereotype` | `string?` | Optional ontological stereotype (e.g. `«initiates»`, `«executes»`). |

#### The 5 Canonical `AimOntologyKind` Archetypes
1. **`uc` (UseCase):** Elliptical boundary with **Cascais Net Gold** accent border (`#F59E0B`), Chalk White fill, bold centered title.
2. **`act` (Activity):** Process step with rounded rectangle boundary ($r=12$), **Heraldic Green** accent (`#10B981`), Canvas Cream fill.
3. **`cls` (Class):** Multi-compartment class card with header, attributes, and methods compartments in **Warm Graphite** (`#1F2937`).
4. **`obj` (Object / Instance):** Runtime instance card with header and property-slot list (underlined when `aim-instance="true"`).
5. **`per` (Person / Actor):** Actor role glyph (stick-figure or role card) distinguishing Initiating Roles (gold) from Defined Roles (graphite).

### Edge Attributes
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `aim-edge` | `boolean` | Flags the SVG element/group as an ontological relationship edge. |
| `aim-id` | `string` | Unique edge identifier. |
| `aim-edge-kind` | `AimEdgeKind` | `'association'` \| `'dependency'` \| `'generalization'` \| `'realization'`. |
| `aim-source` | `string` | ID of the source node. |
| `aim-target` | `string` | ID of the target node. |
| `aim-bends` | `string` | Semicolon-separated orthogonal bend points: `"x1,y1; x2,y2; x3,y3"`. |

---

## 4. AntV X6 Canvas Integration

RaidCanvas configures AntV X6 with production-grade visual systems engineering:
* **Orthogonal Manhattan Router:** Smart edge routing that avoids obstacle nodes and creates clean 90-degree paths.
* **Interactive Bend Points:** Draggable vertices allowing architects to tune edge layout without breaking orthogonality.
* **Cascais Design Tokens:** Cohesive heraldic palette adhering to the AIA Platform styling standard.
* **Bidirectional Sync (`RaiBridge`):**
  * `RaiBridge.hydrateFromSvg(svg, graph)`: Inflates an AntV X6 interactive graph directly from raw SVG markup.
  * `RaiBridge.serializeToSvg(graph, baseSvg?)`: Writes updated node bounds and user-adjusted bend points back into the `aim-*` SVG contract.

---

## 5. Monorepo Structure

```text
RaidCanvas/
├── pnpm-workspace.yaml        # Monorepo package declaration
├── package.json               # Root scripts (build, test, lint, dev)
├── .gitignore                 # Standard repository ignores
├── README.md                  # This architecture guide
├── packages/
│   └── canvas/                # Core library: @dr2rai/raid-canvas
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types.ts       # Ontological metamodel & SVG contract types
│           ├── X6Shapes.ts    # Custom AntV X6 shapes & Manhattan routing
│           ├── RaiBridge.ts   # Bidirectional SVG <-> X6 synchronization
│           ├── index.ts       # Public exports
│           └── styles/
│               └── aoaim-theme.css  # Semantic CSS theme
└── apps/                      # (Future workbench & showcase apps)
```

---

## 6. Getting Started & Development

### Prerequisites
* **Node.js:** `>= 20.0.0`
* **pnpm:** `>= 9.0.0`

### Installation & Build
```bash
# Install in your application
pnpm add @dr2rai/raid-canvas

# Workspace development install
pnpm install

# Build all packages
pnpm build

# Run typechecks
pnpm typecheck

# Execute test suite
pnpm test
```

### Consuming `@dr2rai/raid-canvas`
```typescript
import { Graph } from '@antv/x6';
import { registerAimShapes, RaiBridge, AimOntologyKind } from '@dr2rai/raid-canvas';
import '@dr2rai/raid-canvas/styles';

// 1. Initialize custom X6 shapes
registerAimShapes();

// 2. Instantiate graph container
const graph = new Graph({
  container: document.getElementById('canvas-container')!,
  grid: true,
  connecting: {
    router: 'manhattan',
    connector: { name: 'rounded', args: { radius: 8 } },
  },
});

// 3. Hydrate live model from SVG carrying aim-* attributes
const bridge = new RaiBridge();
const metamodel = bridge.hydrateFromSvg(rawSvgString, graph);

// 4. On canvas edits, serialize coordinates and bend points back to SVG
graph.on('cell:changed', () => {
  const updatedSvg = bridge.serializeToSvg(graph, rawSvgString);
  console.log('Synchronized SVG:', updatedSvg);
});
```

### React Component Usage with Built-in History (`undo` / `redo`)
```tsx
import React, { useRef } from 'react';
import { RaidCanvas, type RaidCanvasHandle } from '@dr2rai/raid-canvas';
import '@dr2rai/raid-canvas/styles';

export function DiagramEditor({ svgContent }: { svgContent: string }) {
  const canvasRef = useRef<RaidCanvasHandle>(null);

  return (
    <div style={{ width: '100%', height: 600 }}>
      <div className="toolbar" style={{ display: 'flex', gap: 8, padding: 8 }}>
        <button onClick={() => canvasRef.current?.undo()}>Undo</button>
        <button onClick={() => canvasRef.current?.redo()}>Redo</button>
        <button onClick={() => canvasRef.current?.cleanHistory()}>Clear History</button>
        <button onClick={() => canvasRef.current?.zoomToFit()}>Fit</button>
        <button onClick={() => canvasRef.current?.resetView()}>100%</button>
      </div>

      <RaidCanvas
        ref={canvasRef}
        svgContent={svgContent}
        onSave={(svg) => console.log('Saved SVG:', svg)}
        onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      />
    </div>
  );
}
```

#### `RaidCanvas` Component Props
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `svgContent` / `svg` | `string` | `''` | Raw SVG carrying `aim-*` ontological attributes to render and edit. |
| `readOnly` | `boolean` | `false` | When `true`, disables editing gestures, port snapping, and history. |
| `defaultRouting` | `'manhattan' \| 'normal' \| 'smooth'` | `'manhattan'` | Default routing style for edges. |
| `showToolbar` | `boolean` | `true` | Whether to display built-in zoom/fit navigation overlay controls. |
| `onSave` | `(svg: string) => void` | — | Callback fired with serialized SVG when diagram changes. |
| `onChange` | `(svg: string) => void` | — | Alias callback fired on diagram changes. |
| `onSelectionChange`| `(selectedIds: string[]) => void` | — | Emits selected node/edge IDs. |
| `onSelect` | `(selection: { id, kind, label } \| null) => void` | — | Emits detailed entity metadata on cell click. |

#### `RaidCanvasHandle` Imperative Ref Methods
| Method | Returns | Description |
| :--- | :--- | :--- |
| `undo()` | `void` | Reverts the last canvas modification. |
| `redo()` | `void` | Re-applies the last undone operation. |
| `canUndo()` | `boolean` | Returns `true` if there are operations available to undo. |
| `canRedo()` | `boolean` | Returns `true` if there are operations available to redo. |
| `cleanHistory()` | `void` | Flushes both undo and redo stacks without mutating the canvas. |
| `getSvg()` | `string` | Returns the current canonical `aim-*` serialized SVG document. |
| `getGraph()` | `Graph \| null` | Accesses the underlying AntV X6 `Graph` instance. |
| `zoomToFit()` | `void` | Fits canvas contents into the current viewport with 32px padding. |
| `resetView()` | `void` | Resets zoom to 100% and centers content. |
| `center()` | `void` | Centers content without changing current zoom level. |
| `zoomIn()` / `zoomOut()` | `void` | Increments or decrements zoom by 20%. |
| `addNode(kind, x?, y?, data?)` | `string` | Adds an AOAIM archetype node and returns its generated ID. |
| `updateNode(id, updates)` | `void` | Updates node display name, stereotype, bounds, or compartments. |
| `updateEdge(id, updates)` | `void` | Updates edge kind, label, routing mode, or port docking. |
| `setRoutingMode(mode, all?)` | `void` | Sets canvas routing mode and optionally re-routes existing edges. |
| `deleteSelection()` | `void` | Removes the currently selected cell from the graph. |
| `clear()` | `void` | Removes all cells from the graph. |

#### History Isolation & Anti-Entropy Wiring (CR029 / CR031)
* **Hydration Isolation (CR031):** Initial diagram inflation via `hydrateFromSvg` is strictly filtered; no `cell:added` commands land on the undo stack during mount or SVG prop update. A loaded diagram arrives with `canUndo() === false`.
* **Zero Port Noise (CR029):** Port docking visibility is driven by pure CSS (`.x6-node:hover circle[magnet="true"]`). Hovering over shapes never pollutes the undo stack.


---

## 7. License

Copyright © 2026 Rainer Burkhardt.  
Licensed under the [Apache License, Version 2.0](LICENSE).

