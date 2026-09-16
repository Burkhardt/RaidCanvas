# RaidCanvas v0.3.1 Implementation Plan
## Unpinned Ports, SVG Root Routing Persistence & AOAIM Aesthetic Refinements

**Author:** Alan (RaidCanvas Agent)  
**Target Version:** `0.3.1`  
**Date:** 2026-09-15  
**Upstream Collaboration:** Adele & Zébio (`aia-workbench`)

---

## 1. Context & Objectives

In v0.3.0, RaidCanvas introduced interactive Manhattan orthogonal routing, edge arrowhead drag handles, and relationship port properties. However, testing by Zébio and the user revealed critical ergonomics and visual refinement opportunities:

1. **Port Welding vs. Center Aiming (Zébio's Fix)**:
   - Previously, `RaiBridge.hydrateFromSvg` automatically inferred ports (`port-right`, `port-left`) if none were declared in the SVG. This locked edges to static faces and required arduous manual NESW editing.
   - When an edge binds to a node without a specific port (`{ cell: id }`), X6's Manhattan router dynamically selects the best face and aims directly at the center of the destination object.
   - **Resolution**: Disable port inference by default (`inferPorts: false`) unless explicitly marked with `aim-source-port` / `aim-target-port`. Support unpinning terminals in the UI with a new default `[Auto]` chip.

2. **Diagram-Level Routing Persistence**:
   - The selected routing mode (`orthogonal` / `manhattan`, `straight` / `normal`, `curved` / `smooth`) must be stored directly on the `<svg>` root element (`aim-routing="..."`), allowing `aia-workbench` to restore the user's diagram routing preference upon file load.

3. **Aesthetic Refinements**:
   - **Person / Actor Glyph (`aim-per`)**: Replace the rectangular box with a canonical person glyph (head circle + shoulder curve matching the stencil drawer and Cascais heraldry tokens).
   - **Underlined Instances (`aim-act`, `aim-obj`)**: In UML / AOAIM, instances (Activity execution steps and Object instances) must have underlined text labels (`text-decoration: underline`).
   - **Text Wrapping & Centering**: Long node labels (such as `"AIA Platform Genesis & Bootstrap"`) must break across multiple lines on spaces `" "` and support soft breaks with `<wbr>`, centered horizontally and vertically to prevent overflowing node boundaries and colliding with ports.

---

## 2. Technical Architecture & File Changes

### 2.1 `packages/canvas/src/types.ts`
- Extend `HydrationOptions` with `inferPorts?: boolean` (defaults to `false`).
- Extend `RaidMetamodel` with `routing?: AimRoutingMode`.
- Document `AimSvgContract.ATTR_ROUTING` as applicable to both `<svg>` root elements and individual edges.

### 2.2 `packages/canvas/src/X6Shapes.ts`
- **Person Glyph Shape (`aim-per`)**:
  - Define composite SVG markup:
    - `body`: `<rect>` (invisible hit area & port attachment frame).
    - `head`: `<circle cx="45" cy="22" r="8" />`.
    - `torso`: `<path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" />`.
    - `label`: `<text>` positioned below shoulders (`refY: 66`, centered).
  - Default size: `90 × 90`.
- **Underline Instances**:
  - Set `textDecoration: 'underline'` on `aim-act` and `aim-obj` shapes.
- **Text Wrapping (`wrapAimText`)**:
  - Utility to wrap long strings based on target character length, breaking on spaces `" "` and `<wbr>` / `<wbr/>` tags.
  - Set `textAnchor: 'middle'`, `textVerticalAnchor: 'middle'`, and `textWrap: { width: -20, breakWord: true }`.

### 2.3 `packages/canvas/src/RaiBridge.ts`
- **Hydration**:
  - Only populate `sourcePort` / `targetPort` when explicitly present in SVG attributes (`aim-source-port`, `aim-target-port`), unless `options.inferPorts === true`.
  - Read `aim-routing` from `<svg>` root element, normalizing aliases (`orthogonal` -> `manhattan`, `straight` -> `normal`, `curved` -> `smooth`).
- **Serialization**:
  - Write `aim-routing` to root `<svg>` tag.
  - If an edge has no `sourcePort` / `targetPort`, omit or remove `aim-source-port` / `aim-target-port`.
  - Bake live router-computed path data (`d="M ... L ..."`) into `<path class="aim-edge">` tags with arrow markers (`#arrow-classic`, `#arrow-hollow`) for standalone vector viewers.
  - Implement `computeFallbackEdgePath` for clean routing in headless environments.
  - Render `aim-per` nodes as Person glyphs in `generateFreshSvg`.
  - Render `aim-act` and `aim-obj` with `text-decoration="underline"`.
  - Render wrapped lines as centered `<tspan>` elements in SVG export.

### 2.4 `packages/canvas/src/RaidCanvas.tsx`
- In `updateEdge`: When `sourcePort` or `targetPort` is passed as `''`, `'auto'`, or `undefined`, unpin the edge terminal (`edge.setSource({ cell: id })`).
- Synchronize diagram-level `aim-routing` with `(graph as any)._aimRoutingMode`.
- Expose `onRoutingModeChange?: (mode: AimRoutingMode) => void`.

### 2.5 `apps/playground/src/components/PropertyInspector.tsx`
- Add `[Auto]` chip as the first and default option in both Origin and Destination port pickers (`[ Auto | Top | Right | Bottom | Left ]`).
- Highlight `Auto` when `!edge.sourcePort` or `!edge.targetPort`.
- Selecting `Auto` unpins the terminal.

### 2.6 `apps/playground/src/App.tsx` & `StudioToolbar.tsx`
- Sync toolbar routing state when an SVG with root `aim-routing` is hydrated.

---

## 3. Verification Plan

1. **Automated Unit Tests**:
   - `packages/canvas/test/canvas.test.mjs`:
     - Test unpinned port terminals on hydration (`inferPorts: false`).
     - Test round-trip persistence of root `<svg aim-routing="...">`.
     - Test Person glyph definition and SVG markup.
     - Test underlined text decoration on Activity and Object nodes.
     - Test `wrapAimText` with spaces and `<wbr>` soft breaks.
     - Test baked edge paths and arrow markers for standalone vector rendering.
2. **Build & Typecheck**:
   - `pnpm -r run build`
   - `pnpm -r run typecheck`
   - `pnpm -r run test` (25/25 passing)
3. **Visual Verification**:
   - Verify Person glyph, text underline, centered wrapped labels, and unpinned center-aiming in Studio playground.
