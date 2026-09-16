# Release Notes - RaidCanvas v0.5.0 (CR032 Consumer-Controlled Labels & Canvas Refinements)

**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead (`Burkhardt/RaidCanvas`)  
**Requesting Agent & Platform Review:** Zébio (7011), Full-Stack Lead Developer (`AIA Platform`)  
**Product Review:** Adele (7010), AIA Product Manager  
**Package:** `@dr2rai/raid-canvas@0.5.0`  
**Date:** 2026-09-16  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.5.0` delivers the complete implementation and formal verification of **CR032** (*Two-line node labels the consumer fills — plus person glyph centring, wrap width and routing undo*), requested by Zébio for the AIA Platform and RAI.

CR032 transitions RaidCanvas from hard-coded archetype styling to a decoupled, consumer-governed ontology model. Ontological consumers now have full semantic control over two distinct label lines per node (`aim-qualifier` and `aim-display-name`) and explicitly designate concrete instances (`aim-instance="true"`), eliminating the previous conflation where archetypes (`aim-act`, `aim-obj`) automatically forced underlines.

Additionally, v0.5.0 resolves four key HCI and layout refinements:
1. **Person Glyph Centering**: Dynamically calculates torso geometry and head anchors relative to the box center (`width / 2`), ensuring head, torso, and label share an identical vertical center line across all widths (90px, 120px, 160px+).
2. **Box-Proportional Text Wrapping**: Derives characters-per-line dynamically from box width and font size (`(boxWidth - 16) / (fontSize * 0.44)`), allowing wide boxes (e.g. 180px Activity) to wrap naturally at ~28 characters while narrower boxes wrap sooner.
3. **Single-Step Routing Undo**: Wraps canvas-wide routing changes in an atomic history batch (`change-routing-mode`), ensuring `undo()` restores every edge in a single action instead of reverting one edge at a time.
4. **Curved Arrowhead Tangent Alignment**: Smooth Bézier routing endpoints now end with control points collinear with the target connection point, eliminating angular deviation at arrowhead tips.

---

## 2. Changes in v0.5.0

### Item 1: Two Label Lines per Node & Instance Underline Decoupling
* **Ontological Metamodel & SVG Contract**:
  - Added `AimSvgContract.ATTR_QUALIFIER` (`'aim-qualifier'`) and `AimSvgContract.ATTR_INSTANCE` (`'aim-instance'`).
  - Added optional fields `qualifier?: string` and `instance?: boolean` to `RaidNodeData`.
* **Underline Decoupling**:
  - Removed blanket `text-decoration: underline` rules on `.aim-act text` and `.aim-obj text`.
  - Underline is now strictly governed by `.aim-node[aim-instance="true"] text.aim-name, .aim-node[aim-instance="true"] tspan.aim-name { text-decoration: underline; }`.
  - No archetype implies `instance`; if `instance` is absent or `false`, no text is underlined.
* **Two-Line Visual Hierarchy**:
  - `qualifier` line: upper line, rendered quieter (italic, `#4B5563`), never underlined.
  - `displayName` line: lower line, entity name, underlined only when `instance === true`.
  - Exported SVG preserves this distinction using `<tspan class="aim-qualifier">` and `<tspan class="aim-name">` elements.
  - XML escaping (CR030) and `<wbr>` soft word-break wrapping (CR019) hold on both lines.

### Item 2: Person Glyph Centering Across Arbitrary Widths
* **Live X6 Canvas**:
  - Person head markup sets `refX: 0.5`.
  - Torso path is dynamically constructed around `cx = Math.round(boxWidth / 2)`: `M ${cx + 16} 50 v -4 a 8 8 0 0 0 -8 -8 H ${cx - 8} a 8 8 0 0 0 -8 8 v 4`.
* **SVG Export & Inner SVG**:
  - Person circle sets `cx="${cx}"` where `cx = Math.round(width / 2)`.
  - Torso path uses the identical `cx`-centered path data.
  - Name and qualifier labels align at `x="${cx}"`.
  - Guaranteed: At 90px, 120px, and 160px, head, torso, and labels share the exact same vertical center line.

### Item 3: Box-Proportional Line Wrapping
* **Dynamic Character Computation**:
  - Exported `computeMaxLineLength(boxWidth: number, fontSize: number = 13): number` in `X6Shapes.ts` and `index.ts`.
  - Formula: `Math.max(10, Math.floor((boxWidth - 16) / (fontSize * 0.44)))`.
  - 180px box at 13px font yields 28 characters per line (e.g. *"AIA Platform Genesis & Bootstrap"* wraps into 2 lines rather than 3).
  - Narrower boxes wrap sooner (e.g. 100px box wraps at 14 characters).
  - Integrated into both live X6 shape generation and `RaiBridge.renderSvgText`.

### Item 4: Single Undo Step for Routing Mode Changes
* In `RaidCanvasHandle.setRoutingMode(mode, applyToAllEdges = true)`:
  - Wrapped edge mutations in `graph.startBatch('change-routing-mode')` and `graph.stopBatch('change-routing-mode')`.
  - Switching routing mode on an N-edge diagram records exactly one compound history command. A single press of Undo reverts all edges to their previous configuration.

### Item 5: Curved Arrowhead Collinear Tangents
* In `RaiBridge.computeFallbackEdgePath`:
  - Fallback cubic Bézier S-curve (`smooth` routing) sets the final control point collinear with the target connection point (`midX, ty` when `dx >= dy`, or `tx, midY` when `dy > dx`).
  - Guarantees 0° angular deflection at the target center, pointing arrowheads cleanly at their destination.

### Public API Additions
* Exported `computeMaxLineLength` from `@dr2rai/raid-canvas`.
* Made `RaiBridge.extractMetamodel(source: string | Element, options?: HydrationOptions)` public, accepting both raw SVG XML strings and parsed DOM elements.

---

## 3. Delivery Verification Checklist

| Requirement / Acceptance Test | Target / Contract | Result | Status |
| :--- | :--- | :--- | :---: |
| **CR032 Test 1: Person Rolefiller** | `per` with `qualifier="Assignee"`, `displayName="Zébio"`, `instance=true`: name underlined, qualifier italic | Verified in live canvas and SVG export | ✅ PASS |
| **CR032 Test 2: Unbound Person** | Same `per` with `instance` absent: nothing underlined | Verified in live canvas and SVG export | ✅ PASS |
| **CR032 Test 3: Activity Underline** | `act` with `qualifier="Create Tenant Workspace"`, `instance=true`: qualifier plain, name underlined | Verified in live canvas and SVG export | ✅ PASS |
| **CR032 Test 4: Person Glyph Centering** | `per` at 90px, 120px, 160px: head, torso, and name share one vertical center line | Verified at cx=45, 60, and 80 | ✅ PASS |
| **CR032 Test 5: Dynamic Text Wrapping** | *"AIA Platform Genesis & Bootstrap"* in 180px box wraps at >= 28 chars (2 lines); narrower box wraps sooner | Verified in unit test | ✅ PASS |
| **CR032 Test 6: Routing Undo Batching** | `setRoutingMode(mode, true)` grouped in `change-routing-mode` batch; one undo restores all edges | Verified in unit test & mock graph | ✅ PASS |
| **CR032 Test 7: XML Escaping & `<wbr>`** | Name with `<wbr>` and `&` breaks at seam, escapes correctly, 0 `<parsererror>` nodes | Verified with DOMParser round-trip | ✅ PASS |
| **CR032 Item 5: Bézier Arrow Tangents** | Fallback smooth edge path control point collinear with target center | Verified in unit test | ✅ PASS |
| **TypeScript Compilation** | Strict typecheck (`exactOptionalPropertyTypes: true`) across workspace | 0 errors | ✅ PASS |
| **Production Build** | `tsc -b --force` and Vite bundle build | Clean build | ✅ PASS |
| **Regression Test Suite** | All core, XML escaping, viewport bounds, and semantic connection tests | 48 passing, 0 failing | ✅ PASS |
| **Authorship Attribution** | Dr. Rainer Burkhardt (`author`), Alan (`contributor`) | Preserved in `package.json` | ✅ PASS |
| **Documentation** | `README.md`, `ImplementationPlan0.5.0.md`, `ReleaseNotes0.5.0.md` | Fully documented | ✅ PASS |

---

## 4. Upstream Integration Guidance for AIA (`AIA Platform` / `aia-workbench`)

Ontological consumers can emit `aim-qualifier` and `aim-instance` per the mapping table below:

| AIA Ontological Element | `qualifier` (`aim-qualifier`) | `displayName` (`aim-display-name`) | `instance` (`aim-instance`) |
| :--- | :--- | :--- | :---: |
| **Activity** (process step) | Parent UseCase name (e.g. *Create Tenant Workspace*) | Activity name | `true` |
| **Person as Rolefiller** | Role name (e.g. *Assignee*) | Person name (e.g. *Zébio*) | `true` |
| **UseCase** (blueprint) | *(omitted)* | UseCase name | *(omitted)* |
| **Class** (ontology entity) | *(omitted)* | Class name | *(omitted)* |
| **Object** (concrete instance) | Class name (when useful) | Object name | `true` |

---

## 5. Publishing Handoff

The package is prepared and verified for release:
```bash
pnpm --filter @dr2rai/raid-canvas publish --access public
```
