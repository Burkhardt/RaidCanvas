# Release Notes: @dr2rai/raid-canvas 0.3.0

**Release Date:** September 15, 2026  
**Package:** `@dr2rai/raid-canvas@0.3.0`  
**Git Tag:** [`v0.3.0`](https://github.com/Burkhardt/RaidCanvas/releases/tag/v0.3.0)  
**Lead Engineer:** Alan (7012), Visual Systems, Canvas & HCI Lead  

---

## 1. Delivery Checklist

| Item | Status | Verification & Details |
| :--- | :--- | :--- |
| **npm Registry** | **PUBLISHED** | [`@dr2rai/raid-canvas@0.3.0`](https://www.npmjs.com/package/@dr2rai/raid-canvas) live on public registry |
| **Dynamic Routing Modes** | **DELIVERED** | Manhattan (`manhattan`), Straight (`normal`), Curved (`smooth`) in Toolbar and Inspector |
| **Interactive Terminal Re-anchoring** | **DELIVERED** | High-visibility NetGold drag handles (`source-arrowhead`, `target-arrowhead`) + magnetic port snapping |
| **Connector Port Quick-Picks** | **DELIVERED** | 1-click Origin and Destination port selector chips (`Top`, `Right`, `Bottom`, `Left`) in Inspector |
| **Round-trip SVG Contract** | **DELIVERED** | Persists `aim-routing`, `aim-source-port`, and `aim-target-port` into SVG DOM |
| **Monorepo Build & Typecheck** | **PASSED** | 0 errors across TS 7.0.2 Go native compiler and Vite |
| **Automated Tests** | **PASSED** | 19 / 19 unit tests passing across core package |
| **Git Commit & Tag** | **PUSHED** | Commit `cbd49df` and tag `v0.3.0` on `origin/main` |
| **Documentation & Plan** | **DELIVERED** | Documented in `doc/ImplementationPlan0.3.0.md` and `doc/ReleaseNotes0.3.0.md` |

---

## 2. Key Features & Enhancements

### A. Dynamic Edge Routing Modes (Manhattan, Straight, Curved)
Diagrams no longer force strict orthogonal routing across every scenario. Users can select the visual style that best matches their model's topology:
* **Manhattan (`manhattan`)**: Intelligent obstacle-avoiding 90° orthogonal router with rounded corners (`radius: 8`). Default for structured architecture diagrams.
* **Straight (`normal`)**: Direct point-to-point line between connection ports. Ideal for simple sequence flows, hierarchical trees, and uncluttered overviews.
* **Curved (`smooth`)**: Cubic bezier spline through endpoints. Ideal for concept maps, mind maps, and organic data-flow diagrams.

#### Control Levels:
* **Global Canvas Switch**: Integrated directly in the Visual Studio top toolbar (`[ ⮡ Manhattan | ╲ Straight | ∿ Curved ]`) to set the default and convert all diagram edges with a single click.
* **Per-Edge Inspector Switch**: Located under "Routing Style" in the Property Inspector to override routing on individual relationships.

---

### B. Interactive Edge Terminal Drag Re-anchoring
Users can now move the origin (source) or destination (target) of any edge directly on the visual canvas:
* **Visual Anchor Handles**: Clicking an edge exposes high-visibility Cascais Net Gold (`#F59E0B`) drag handles at both ends (`source-arrowhead` and `target-arrowhead`).
* **Drag-to-Reanchor**: Grab either handle and drag it to any other port on the same box (e.g. from `port-left` to `port-top`, `port-right`, or `port-bottom`) or to a completely different box.
* **Real-time Snapping & Anti-Entropy Validation**: Compatible target ports light up in Heraldic Green (`#10B981`) and enforce ontological connection rules in real time before committing the re-connection.

---

### C. Connector Port Quick-Picks in Property Inspector
In addition to direct canvas dragging, the Property Inspector sidebar provides 1-click port selection buttons:
* **Origin Connector Port:** `[ Top | Right | Bottom | Left ]`
* **Destination Connector Port:** `[ Top | Right | Bottom | Left ]`
* Clicking any chip immediately jumps the edge terminal to the selected port, updates the layout, and triggers serialization.

---

### D. Full `aim-*` SVG Contract Round-Trip
The SVG serializer and hydrator now fully support routing and port declarations:
* `aim-routing="manhattan|normal|smooth"`
* `aim-source-port="port-top|port-right|port-bottom|port-left"`
* `aim-target-port="port-top|port-right|port-bottom|port-left"`
All port movements and routing selections are persisted losslessly into the SVG DOM.

---

## 3. Verification & Test Gates

* **Compilation**: `pnpm -r run build` & `pnpm -r run typecheck` run clean with **0 errors**.
* **Automated Tests**: **19 / 19 unit tests passing** (`pnpm -r run test`):
  * `createAimEdge respects routing modes (manhattan, normal, smooth)`
  * `RaiBridge serializes aim-routing and port attributes into SVG`
  * Full AOAIM semantic validation matrix tests (`aim-per` $\rightarrow$ `aim-uc` with `«initiates»`, `«owns» [0..1]`, `«participates» [0..*]`)
  * Shape registry and markup tests.

---

## 4. Upstream Integration Guide (`aia-workbench`)

Adele and Zébio can update and use this release in `aia-workbench` immediately:

### 1. Update Dependency
```bash
pnpm update @dr2rai/raid-canvas@0.3.0
```

### 2. Component Usage with Default Routing
```tsx
'use client';

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import type { RaidCanvasHandle } from '@dr2rai/raid-canvas';
import '@dr2rai/raid-canvas/styles';

const RaidCanvas = dynamic(
  () => import('@dr2rai/raid-canvas').then((m) => m.RaidCanvas),
  { ssr: false }
);

export function DiagramView({ svg }: { svg: string }) {
  const canvasRef = useRef<RaidCanvasHandle>(null);

  return (
    <div className="h-screen w-full">
      <RaidCanvas
        ref={canvasRef}
        svgContent={svg}
        defaultRouting="manhattan" // 'manhattan' | 'normal' | 'smooth'
        readOnly={false}
        onSave={(updatedSvg) => {
          // Persist SVG directly
        }}
      />
    </div>
  );
}
```

### 3. Programmatic Routing Switching
```tsx
// Switch entire diagram to Straight routing
canvasRef.current?.setRoutingMode('normal', true);

// Switch entire diagram to Curved routing
canvasRef.current?.setRoutingMode('smooth', true);

// Switch entire diagram to Manhattan routing
canvasRef.current?.setRoutingMode('manhattan', true);
```
