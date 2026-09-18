# Release Notes - RaidCanvas v0.6.3 (Stereotype Icons & Cascais Dynabook Ergonomics)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Product Review & Systems Integration:** Adele (7010 / 7013)  
**Lead Full-Stack Review:** Zébio (7011) (`AIA Platform` / `aia-workbench`)  
**Lead Ontologist Review:** Vasco (7015) (`AIA Ontology v1.3`)  
**Package:** `@dr2rai/raid-canvas@0.6.3`  
**Date:** September 2026  
**Foundational Treatises:**  
- [`doc/DualityOfTheObject.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/DualityOfTheObject.md)  
- [`doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md)  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.6.3` delivers a landmark synthesis of Dr. Rainer Burkhardt's 1990s **Object-Technology Workbench (OTW)** diagram visual language and the modern **WWWA Ontology v1.3** metadata contract (`What.Stereotype`).

This release introduces native **Stereotype Icons** precision-engineered for the **Cascais Theme** (`#F59E0B` Net Gold, `#10B981` Heraldic Green, `#1F2937` Warm Graphite), perfectly integrated with the **Two-Tap Dynabook Selection Lifecycle** and the **Persona Anchor**.

Furthermore, this release equips Zébio (`7011`) and the `aia-workbench` team with a complete integration blueprint, full SVG round-trip preservation, and an interactive Stereotype toolbar in the RaidCanvas Studio playground.

---

## 2. Key Highlights in v0.6.3

### 2.1 The OTW Stereotype Icon Suite (`StereotypeIcons.ts`)
Precision vector glyphs implemented directly from Dr. Rainer's architectural sketches and OTW heritage:
1. **👑 `customer` (Person / Actor):** Royal golden crown sitting regally directly on top of the Actor head (`y = -7`), with Net Gold brow and white jewels, leaving the facial feature area completely open and unobstructed.
2. **⭐ `headliner` (Person / Role):** 5-point hollow Star positioned directly on the Actor's chest (`y = 38.5`, between shoulders). It is hollow (`fill="none"`, `stroke="#F59E0B"`, `strokeWidth=1.5`) so the Actor's torso line and the awakened Duality emerald door fill (`rgba(16, 185, 129, 0.25)`) remain completely visible through the star.
3. **🤖 `ai` (Person / Actor):** Autonomous neural processor chip with quad perimeter connector pins, centered directly over the Actor head (`cx - 12, 8`).
4. **📍 `venue` (Place):** Cascais location teardrop pin ($45 \times 54\text{px}$) with a circular aperture cutout hovering over an elliptical ground target ring in Net Gold (`#F59E0B`).
5. **🎪 `stage` (Place):** Festival truss concert stage ($48 \times 44\text{px}$) featuring a trapezoidal canopy with 4 Net Gold stars across the fascia, dual cross-braced lattice towers, overhead crossbeam rig with 5 hanging spotlights, dual speaker stacks, and stepped performance deck in Net Gold (`#F59E0B`).
6. **🍸 `bar` (Place):** Refined cocktail martini glass ($36 \times 44\text{px}$) with slender stem, base, triangular bowl, and olive skewer in Net Gold (`#F59E0B`).
7. **⚡ `initiates` (Role / Dynamic Relation):** Directional Net Gold trigger arrow denoting dynamic stimulus.

### 2.2 Frameless Places Hierarchy & Contoured Duality Doors
* **Strict Frameless Trio:** Strictly only `Place + Venue`, `Place + Stage`, and `Place + Bar` are rendered as frameless vector glyphs ($120 \times 110\text{px}$, Net Gold `#F59E0B`), matching the Actor's stature. Other Place nodes strictly retain framed cards with `SilverLineDark` borders.
* **Contoured Duality Doors for Frameless Places:**
  - **`Venue`:** Teardrop right half + vertical seam.
  - **`Stage`:** Outer silhouette right half (canopy roof slope, right truss tower, stage pad) + vertical centerline seam.
  - **`Bar`:** Right half of cocktail liquid in V-bowl + right half of floating olive in emerald (`rgba(16, 185, 129, 0.45)`) + stem seam.
* **Dynabook Visual & Ergonomic Derivation for Bar:** Right-half emerald liquid area ($\approx 78\text{ sq px}$) exceeds the foveal chromatic threshold ($35\text{ sq px}$) by $2.2\times$, while the interactive Fitts' Law target encompasses the entire right hemisphere ($6,600\text{ sq px}$, $ID \approx 2.32\text{ bits}$).

### 2.3 Ontology v1.3 Array Stereotype Support
* **Metamodel & Runtime:** Accepts `string | readonly string[]` for `RaidNodeData.stereotype`.
* **First-Value Resolution:** Inspects `rawStereotype[0]` when an array is provided (e.g. `['Venue', 'Stage']` resolves to `'venue'`).
* **SVG Round-Trip Serialization:** Retains all values comma-separated (`aim-stereotype="Venue, Stage"`).

### 2.4 Sizing Up Actor and Place Glyphs by 50%
Both glyphs enlarged by 50% for equal visual stature:
- **Actor Cartesian Bounds:** $120 \times 110\text{px}$, Head radius $12\text{px}$, Torso width $42\text{px}$.
- **Place Cartesian Bounds:** $120 \times 110\text{px}$, Pin height $54\text{px}$, Stage height $44\text{px}$, Bar height $44\text{px}$.
- **AOAIM Palette:** Updated with the new Venue pin glyph and Net Gold badge.

### 2.5 Universal Initiator Color Rule & Heraldic Emblems
Dr. Rainer's heraldic color specification unifies Person and Place glyphs under an ontological stimulus convention:
* **Dormant Baseline (Anthracite):** By default, unadorned Actor and Place glyphs (Venue, Stage, Bar) render in Warm Graphite anthracite (`#1F2937` / `#374151`).
* **Active Stimulus (Net Gold):** When the `initiates` stereotype is present, the primary glyph awakens in radiant Net Gold (`#F59E0B`).
* **Valid Multi-Stereotype Combinations:** `initiates` seamlessly combines with:
  - `Customer` (Person)
  - `AI` (Person)
  - `Headliner` (Person)
  - `Venue` (Place)
  - `Stage` (Place)
  - `Bar` (Place)
* **Preserved Heraldic Emblems:** The royal Crown (`Customer`) and 5-point Star (`Headliner`) remain imperial Net Gold (`#F59E0B`) across all states. When `initiates` is toggled, the underlying Actor head and shoulders transition between anthracite and gold, preserving the prestige of the emblem.
* **Bar Duality Chromatic Separation:** For `Place + Bar`, the martini glass renders in anthracite (dormant) or gold (`initiates`). When Duality is awakened, only the right half of the glass bowl is filled with emerald green (`rgba(16, 185, 129, 0.45)`), while the floating olive faithfully preserves its base glyph color (anthracite or gold).

### 2.6 System Actor Stereotype (`system`)
* **Rack Unit Glyph:** In addition to Customer, Headliner, and AI, actors can now embody a technical system (`stereotype="system"` or `<<system>>`).
* **Hardware Iconography:** Replaces the anthropomorphic head-and-shoulders with a precision dual-chassis server rack featuring rack-mount ears, dual equipment handles, status indicator LEDs, and horizontal drive bays.
* **Initiates & Duality Integration:** Follows the anthracite-to-gold initiation lifecycle and features a contoured right-half Duality door with emerald shading upon awakening.

### 2.7 Cascais Red Theme Framing for Activities
* **Line-Only Chromatic Separation:** Activity nodes (`aim-act` / Action) are framed in Cascais Theme Red (`#EF4444` / `#DC2626`), rendered strictly as an outline with chalk white / transparent fill.
* **Contrast with Use Cases:** Use Cases (`aim-uc`) retain their classic Net Gold boundary, creating crisp visual distinction between transient workflow actions and persistent system capabilities.
* **Palette Synchronization:** The AOAIM Palette stencil drawer reflects these exact chromatic conventions.

### 2.8 Roles & RoleFillers Pattern (`RoleModel.ts`)
* **OTW Ontological Foundation:** Complete implementation of Dr. Rainer Burkhardt's Object-Technology Workbench Role Model (`RoleModel.ts`, `rolePresets.ts`, `doc/RoleFiller-Implementation.md`).
* **Dual Archetypes:**
  - **Role (`aim-rol`):** Dashed class archetype with projected role attributes.
  - **RoleFiller (`aim-rf`):** Compact filled circle junction ($16\text{px}$) anchoring contextual object bindings.

### 2.9 Edge Directionality Architecture (`aim-edge` vs `aim-arrow`)
* **Owner Binding Semantics:** Edges connecting an Object (`obj`), Person (`per`), Place (`plc`), or Activity (`act`) to a RoleFiller (`rf`), as well as Class (`cls`) or Use Case (`uc`) to a Role (`rol`), represent structural owner bindings and are undirected (`directed: false`) by default.
* **Archetype Bifurcation:**
  - **`aim-edge`:** Canonical undirected line segment without arrowheads (`targetMarker: null`).
  - **`aim-arrow`:** Directed relationship edge with classic arrowhead marker.
* **Deep AntV X6 DOM Synchronization:** Directly manages SVG DOM attributes (`marker-end`) to guarantee that switching an edge to undirected completely purges arrowheads without residual SVG marker references.
* **Ergonomic Selection Handles:** Undirected edge selection handles in `setEdgeTools` render as circular knobs (`M -5 0 A 5 5 0 1 0 5 0 A 5 5 0 1 0 -5 0`) rather than arrowheads, preventing false directional cues during diagram editing.
* **Studio Property Inspector Controls:** Dynamic header badge displaying `AIM-EDGE` vs `AIM-ARROW` and an interactive two-button switcher (`— Undirected` vs `➔ Directed`) enabling instant manual override.

---

## 3. Automated Test Verification

All 84 tests in the test suite pass with 0 failures across 11 test suites (`pnpm -r run test`):
- **CR034 Tests (17 tests):** Stereotype Iconography, Vasco Ontology v1.3 / OTW Alignment, System Actor glyph & Duality, Universal Initiator Color Rule, Red Activity framing, and Bar Duality emerald bowl isolation.
- **Role Model & Edge Directionality (4 tests):** Circular junctions, arrow suppression on `obj -> rf` bindings (`aim-edge` without arrowheads), role attribute projection, wrapped descriptions, and SVG round-trip preservation.
- **AOAIM Semantic Rules & Anti-Entropy (4 tests):** Ontological connection validation, rejection of invalid bindings, rule descriptions, and per->uc relationships.
- **AOAIM Stencil Sizing (2 tests):** Canonical bounds and display names per archetype.
- **Diagram-Specific Role Semantics (2 tests):** Mixed diagrams vs Use Case views.
- **CR033 Acceptance Tests (8 tests):** Ontological deep linking (`aim-href`), Portuguese Bicolor Seam portal doors, Place and Role archetypes.
- **CR032 Acceptance Tests (8 tests):** Consumer-controlled labels, centering, soft breaks, and routing undo.
- **CR030 Acceptance Tests (6 tests):** XML text/attribute escaping, ampersand round-trip, `<wbr>` seam compatibility.
- **Viewport Auto-Bounds (4 tests):** Dynamic viewBox expansion and boundary preservation.
- **RaidCanvas Core Tests (19 tests):** Node creation, routing modes, SVG baking, archetype shapes, and serializations.

---

## 4. Package Artifacts & Tooling
- `@dr2rai/raid-canvas@0.6.3` compiled with TypeScript `7.0.2` and ESModule outputs.
- `apps/playground` verified with Vite 6.2.0 production build.
- Linter configured monorepo-wide via `pnpm run lint` (`tsc --noEmit`).
- Studio Playground running at `http://localhost:5173` with full interactive AOAIM palette, Role presets, edge directionality switcher, and inspector controls.
