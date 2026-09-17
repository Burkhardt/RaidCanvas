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
1. **🎪 `stage` (Place / Venue):** Festival truss concert stage featuring a trapezoidal canopy with 4 Net Gold stars across the fascia, dual cross-braced lattice towers (`#1F2937`), overhead crossbeam rig with 5 hanging spotlights, dual speaker stacks, and stepped performance deck (matching `media_1789674487269.png`).
2. **📍 `venue` (Place):** Cascais location teardrop pin with a circular aperture cutout hovering over an elliptical ground target ring (matching `media_1789674495092.png`).
3. **🍸 `bar` (Place / Object):** Refined cocktail martini glass with slender stem, circular base, triangular bowl, and olive skewer.
4. **⭐ `headliner` (Person / Role):** Artist performer crown with three jeweled peaks, curved brow band, and Net Gold star medallion (matching `media_1789614616719.jpg`).
5. **🤖 `ai` (Person / Actor):** Autonomous neural processor chip with quad perimeter connector pins and a luminous Net Gold spark core.
6. **⚡ `initiates` (Role / Dynamic Relation):** Directional Net Gold trigger arrow denoting dynamic stimulus.

### 2.2 Persona Anchor & Typography Layout Protection
* **Anchor Positioning ($x \in [12, 40]$):** Stereotype icons are housed strictly within the **Left Hemisphere (The Persona)**.
* **Non-Colliding Typography:** When a stereotype icon is active on a node, `createAimNode` dynamically adjusts `cardTextRefX` to `0.62` and wraps label text against `boxWidth - 52`, ensuring labels and qualifiers never collide with the icon.
* **Heraldic Person Glyph Refinement:** Person nodes (`per`) render directly with Cascais Green head circle and shoulder arc—retiring rectangular bounding boxes in favor of pure heraldic silhouettes.

### 2.3 Two-Tap Dynabook Lifecycle & The Net Gold Meridian Seam
* **Dormant State:** Nodes rest quietly on the canvas, displaying their clean archetype background and Persona stereotype glyph.
* **Tap 1 (Awakened Duality):** Tapping the node awakens its dual nature:
  - The vertical **Net Gold Meridian Seam** (`#F59E0B`) drops down the center line ($x = \text{midX}$).
  - The Right Hemisphere washes in translucent Emerald Green (`rgba(16, 185, 129, 0.12)`) and reveals the doorway chevron (`›`).
* **Tap 2 (Left / Persona):** Opens the in-situ Smalltalk-style **DaisyUI Inspector Drawer** (`drawer-end`) without leaving the diagram.
* **Tap 2 (Right / Portal):** Fires `onNodePortalClick` to transition through the portal into the target UseCase Browser, sub-workflow, or dossier.
* **Tap Outside:** Smoothly deselects the node and returns it to its dormant state.

### 2.4 RaidCanvas Studio Playground Enhancements
* **Preset #1 Updated:** `LisbonStage_Plc` now showcases the vector Stage icon and `aim-stereotype="Stage"` out of the box.
* **Property Inspector Toolbar:** Added an interactive 1-tap **Stereotype Badges Toolbar** (`🎪 Stage`, `📍 Venue`, `🍸 Bar`, `⭐ Headliner`, `🤖 AI`, `⚡ Initiates`) enabling instant live canvas toggling.

### 2.5 Documentation & Integration Guide for Zébio
* Authored [`doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/CR034_AIA_to_RaidCanvas_Stereotype_Icons_Guide.md) providing step-by-step Next.js / DaisyUI integration code for `aia-workbench`.
* Updated [`doc/DualityOfTheObject.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/DualityOfTheObject.md) with Section 4.3 (The Two-Tap Dynabook Lifecycle) and Section 4.4 (Stereotype Iconography and the Persona Anchor).

---

## 3. Automated Test Verification

All 67 tests in the test suite pass with 0 failures (`pnpm -r run test`):
- CR034 Test 1: Vector Stage Icon Generation & Structure
- CR034 Test 2: Venue Pin Icon Generation & Structure
- CR034 Test 3: Stereotype Normalization & Resolution
- CR034 Test 4: Node Data with Stereotype Generates Left-Anchored Icon Markup
- CR034 Test 5: SVG Synchronization Bridge Injects Vector Stereotype Icon in Left Hemisphere
- CR034 Test 6: Round-Trip Preservation of `aim-stereotype` in Metamodel
- Plus all 61 existing CR020–CR033 regression tests.

---

## 4. Package Artifacts
- `@dr2rai/raid-canvas@0.6.3` compiled with TypeScript `7.0.2` and ESModule outputs.
- `apps/playground` verified with Vite 6.2.0 production build.
