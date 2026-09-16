# Release Notes: @dr2rai/raid-canvas 0.3.1

**Release Date:** September 15, 2026  
**Package:** `@dr2rai/raid-canvas@0.3.1`  
**Git Tag:** [`v0.3.1`](https://github.com/Burkhardt/RaidCanvas/releases/tag/v0.3.1)  
**Lead Engineer:** Alan (7012), Visual Systems, Canvas & HCI Lead  
**Upstream Collaboration:** Adele & Zébio (`aia-workbench`)

---

## 1. Delivery Checklist

| Item | Status | Verification & Details |
| :--- | :--- | :--- |
| **Unpinned Dynamic Ports (Zébio's Fix)** | **DELIVERED** | `inferPorts: false` default; edges dynamically auto-aim to destination center without forced NESW port welding |
| **`[Auto]` Terminal Port Chips** | **DELIVERED** | Origin and Destination port selectors in Property Inspector feature `[Auto]` as the primary default option |
| **Root SVG Routing Mode Persistence** | **DELIVERED** | Root `<svg aim-routing="...">` round-trip persistence (supporting `orthogonal`/`manhattan`, `straight`/`normal`, `curved`/`smooth`) |
| **Actor / Person Glyph (`aim-per`)** | **DELIVERED** | Replaced rectangular box with canonical Person glyph (head circle + shoulder arch) matching Stencil drawer and Cascais tokens |
| **Underlined Instance Labels** | **DELIVERED** | UML/AOAIM standard underlined labels (`text-decoration: underline`) for Activity (`aim-act`) and Object (`aim-obj`) |
| **Centered Multi-Line Text Wrapping** | **DELIVERED** | Labels wrap on spaces `" "` and treat `<wbr>` / hyphens as soft break opportunities within unbroken words; exported as centered `<tspan>` |
| **Automated Test Suite** | **PASSED** | **24 / 24 unit tests passing** across 4 test suites (`pnpm -r run test`) |
| **Monorepo Build & Typecheck** | **PASSED** | 0 errors across TS 7.0.2 Go native compiler and Vite bundler |
| **Implementation Plan & Release Notes** | **COMMITTED** | Recorded in `doc/ImplementationPlan0.3.1.md` and `doc/ReleaseNotes0.3.1.md` |

---

## 2. Key Features & Architectural Enhancements

### A. Unpinned Dynamic Ports & Auto-Aiming (Zébio's Fix)
* **Problem**: In previous versions, `RaiBridge.hydrateFromSvg` automatically inferred docking ports (`port-right`, `port-left`) based on node coordinates whenever ports were absent. This welded terminals to static sides, requiring intense manual NESW adjustments whenever nodes were moved or aligned.
* **Solution**:
  - `HydrationOptions.inferPorts` now defaults to `false`.
  - When an edge does not declare `aim-source-port` or `aim-target-port` in the SVG, it connects directly to the node cell (`{ cell: id }`).
  - AntV X6's Manhattan router dynamically selects the optimal boundary face and auto-aims directly toward the center of the destination object on every position change.
  - If a user explicitly wants to pin an edge, they can still choose a specific port (`Top`, `Right`, `Bottom`, `Left`) or click `Auto` to unpin.

### B. `[Auto]` Chip in Property Inspector
* In `PropertyInspector.tsx`, both Origin and Destination port pickers now offer 5 options:
  `[ Auto | Top | Right | Bottom | Left ]`
* `[Auto]` is selected by default when an edge is unpinned.
* Clicking `[Auto]` clears the terminal port, immediately letting the edge dynamically aim for the center.

### C. Diagram-Level Routing Mode Persistence on Root `<svg>`
* The diagram-wide routing mode is now saved directly onto the root `<svg>` tag:
  `<svg ... aim-routing="manhattan">` (or `"normal"`, `"smooth"`).
* The parser supports standard aliases:
  - `orthogonal` / `manhattan` $\rightarrow$ `'manhattan'`
  - `straight` / `normal` $\rightarrow$ `'normal'`
  - `curved` / `smooth` $\rightarrow$ `'smooth'`
* When an SVG is ingested in `aia-workbench` or RaidCanvas Studio, the active routing mode is automatically restored.

### D. Canonical Person Glyph (`aim-per`)
* The rectangular card for Actor / Person has been replaced with the canonical Person Glyph (head circle + shoulder arch, identical to the Stencil palette):
  - **Head**: `<circle cx="45" cy="22" r="8" />`
  - **Torso**: `<path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" />`
  - **Coloring**: Initiating roles (`«initiates»`) receive the Cascais Net Gold (`#F59E0B`) accent; standard personas receive Warm Graphite (`#1F2937`).
  - **Docking**: Four orthogonal port magnets remain active at the 4 cardinal boundaries of the glyph.

### E. Underlined Instance Labels (`aim-act`, `aim-obj`)
* In UML and AOAIM metamodeling, runtime instances and execution steps are designated with underlined labels.
* `aim-act` (Activity) and `aim-obj` (Object) labels now consistently display with `text-decoration: underline` in both the interactive canvas, CSS stylesheets, and serialized SVG exports.

### F. Centered Multi-Line Text Wrapping with `<wbr>` Soft Breaks
* Addresses label overflow where long names or long unbroken compound words collide with node boundaries:
  - Automatically wraps on whitespace `" "` when exceeding line length thresholds.
  - Treats `<wbr>` or `<wbr/>` tags as **Word Break Opportunities** (zero-width soft breaks) within long unbroken strings (e.g. `For<wbr />Words<wbr />Or<wbr />Strings...`), concatenating syllables together without spaces until exceeding line width, breaking only when needed.
  - Supports hyphenated compounds (`in-between` $\rightarrow$ `in-` / `between`).
  - Horizontally and vertically centered (`text-anchor: middle`, `dominant-baseline: central`).
  - Serialized as centered multi-line `<tspan>` elements in SVG exports for universal vector compatibility across external viewers.

---

## 3. Verification & Test Summary

* **Build & Typecheck**:
  ```bash
  pnpm -r run build && pnpm -r run typecheck
  # Output: 0 errors across packages/canvas and apps/playground
  ```
* **Test Suite**:
  ```bash
  pnpm -r run test
  # Output: 24 tests across 4 suites passed (0 failures)
  ```
  - `wrapAimText wraps on spaces and breaks explicitly on <wbr>`: PASSED
  - `createAimNode creates Person glyph with head, torso and initiating color`: PASSED
  - `createAimNode configures textDecoration underline for Activity and Object instances`: PASSED
  - `RaiBridge does not infer ports by default (inferPorts: false)`: PASSED
  - `RaiBridge serializes diagram-level routing and Person glyph into SVG`: PASSED

---

## 4. Upstream Integration Guide (`aia-workbench`)

Adele and Zébio can update to `0.3.1` in `aia-workbench`:

### 1. Upgrade Package
```bash
pnpm update @dr2rai/raid-canvas@0.3.1
```

### 2. Hydration with Dynamic Ports & Routing Mode
```tsx
import { RaidCanvas, type RaidCanvasHandle, type AimRoutingMode } from '@dr2rai/raid-canvas';

export function DiagramEditor({ svg, onChange }: { svg: string; onChange: (svg: string) => void }) {
  const [routingMode, setRoutingMode] = useState<AimRoutingMode>('manhattan');

  return (
    <RaidCanvas
      svg={svg}
      defaultRouting={routingMode}
      onRoutingModeChange={(mode) => setRoutingMode(mode)}
      onChange={onChange}
    />
  );
}
```

Edges without declared port attributes in your SVG documents will now automatically flow dynamically with obstacle-avoiding Manhattan routing aimed at destination centers, without requiring manual port welding.
