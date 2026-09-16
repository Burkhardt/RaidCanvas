# Implementation Plan - RaidCanvas v0.5.0 (CR032 Consumer-Controlled Labels & Canvas Refinements)

**Author & Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead (`Burkhardt/RaidCanvas`)  
**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Product Review:** Adele (7010), AIA Product Manager  
**Platform & Verification:** Zébio (7011), Full-Stack Lead Developer (`aia-workbench`)  
**Date:** 2026-09-16  
**Status:** In Progress  

---

## 1. Context & Scope

`CR032_AIA_to_RaidCanvas_Consumer-controlled-labels.md` requests five architectural and visual improvements in `RaidCanvas`:

1. **Two label lines per node (`aim-qualifier`, `aim-instance`)**:
   - `aim-qualifier` (`qualifier?: string`): upper line, quieter (italic / `#4B5563`), never underlined.
   - `aim-display-name` (`displayName: string`): lower line, the entity name.
   - `aim-instance="true"` (`instance?: boolean`): when set, the name line is underlined; when absent/false, nothing is underlined.
   - **Underline decoupling:** Archetypes (`act`, `obj`) stop underlining by default. Underline is governed exclusively by `instance === true`.
   - SVG export renders the underline on the name `<tspan>` only, styling the qualifier, preserving CR019 `<wbr>` breaking and CR030 XML escaping on both lines.
2. **Person glyph centring**:
   - Head and torso must be centered relative to `cx = width / 2` (in live X6 canvas and SVG export). At 90px, 120px, 160px, head, torso, and name share a single vertical center line.
3. **Wrap width follows the box**:
   - Derive wrap character limit dynamically from box width and font size. At 180px box width (13px font), wraps at ~28 characters per line.
4. **One routing change is one undo step**:
   - Wrap edge loop in `setRoutingMode(mode, applyToAll = true)` with `graph.startBatch('change-routing-mode')` and `graph.stopBatch('change-routing-mode')`.
5. **Curved arrowhead tangent alignment**:
   - S-curve fallback and connector tangents approach the target collinear with target center (0° tangent angle).

---

## 2. Technical Design & File Changes

### 2.1 `packages/canvas/src/types.ts`
- Add to `AimSvgContract`:
  - `ATTR_QUALIFIER: 'aim-qualifier'`
  - `ATTR_INSTANCE: 'aim-instance'`
- Update `RaidNodeData`:
  - `qualifier?: string;`
  - `instance?: boolean;`

### 2.2 `packages/canvas/src/X6Shapes.ts`
- Export `computeMaxLineLength(boxWidth: number, fontSize?: number): number`:
  - Uses `(boxWidth - 16) / (fontSize * 0.44)`, yielding 28 chars for 180px, 14 chars for 90px.
- Update `wrapAimText`:
  - Allow passing dynamic `maxLineLength`.
- Update `registerAimShapes`:
  - For `aim-per`: configure `head` with `refX: 0.5` and `torso` path centered at `width / 2`.
- Update `createAimNode`:
  - Support `qualifier` and `instance`. Underline name if and only if `instance === true`.
  - Position head and torso at `cx = Math.round(data.bounds.width / 2)`.
  - Compute text wrap based on `data.bounds.width`.

### 2.3 `packages/canvas/src/RaiBridge.ts`
- Update `extractMetamodel`: parse `aim-qualifier` and `aim-instance="true"`.
- Update `updateExistingSvg` and `generateFreshSvg`:
  - Serialize `aim-qualifier` and `aim-instance`.
  - Remove blanket `.aim-act text, .aim-obj text { text-decoration: underline; }` from embedded CSS.
- Update `renderNodeInnerSvg` and `renderSvgText`:
  - When `qualifier` is present: render upper `<tspan>` styled (italic, quiet `#4B5563`, no underline) and lower `<tspan>` for name.
  - When `instance === true`: render `text-decoration="underline"` on the name `<tspan>` only.
  - Compute text wrap dynamically based on `node.bounds.width`.
  - For `per`: compute `cx = Math.round(node.bounds.width / 2)`.
  - For `smooth` fallback in `computeFallbackEdgePath`: use cubic Bézier with final control point collinear with target center.

### 2.4 `packages/canvas/src/styles/aoaim-theme.css`
- Remove blanket underline on `.aim-act text` and `.aim-obj text`.
- Add conditional rule for `.aim-node[aim-instance="true"]`.

### 2.5 `packages/canvas/src/RaidCanvas.tsx`
- In `setRoutingMode`: wrap edge mutation loop in `graph.startBatch('change-routing-mode')` and `graph.stopBatch('change-routing-mode')`.
- In `addNode` and `updateNode`: handle `qualifier` and `instance`.

### 2.6 `packages/canvas/package.json`
- Bump version to `0.5.0`.

---

## 3. Acceptance Verification Plan

Automated tests covering all 7 acceptance criteria from CR032 §7:
1. `per` with `qualifier="Assignee"`, `displayName="Zébio"`, `instance=true`: only name line is underlined; qualifier is italic/quieter in canvas and export.
2. The same with `instance` absent: nothing underlined.
3. `act` with `qualifier="Create Tenant Workspace"`, `instance=true`: qualifier quiet and plain, name underlined.
4. `per` boxes at 90, 120, and 160px: head, torso, and name share one vertical center line.
5. "AIA Platform Genesis & Bootstrap" in 180px `act` box wraps at no fewer than ~28 characters per line; narrower boxes wrap sooner.
6. A four-edge diagram: one `setRoutingMode(..., true)` followed by one `undo()` restores every edge in a single step.
7. Name with `<wbr>` and `&` breaks at seam and escapes correctly on both lines.
