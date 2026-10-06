# Strategic Handover: CR053 — Plentiful Stereotype Glyphs, Visual Inspector Picker & Node Rendering

**Date:** 2026-10-05 (Sprint 2640)  
**Author:** Alan (`7012`, Visual Systems Architect & Glass Lead)  
**Target Recipient:** Alan's twin in VS Code Copilot (Claude Opus 5.5 / Sonnet)  
**Governing Documents:**
- [`CR053`](file:///Users/RSB/Projects/GitHub/AIA/doc/CR053_AIA_to_RaidCanvas_Stereotype-Glyph-Rendering-and-Inspector-Picker.md)
- [`ADR-0005`](file:///Users/RSB/Projects/GitHub/AIA/doc/ADR-0005-STEREOTYPE-INHERITANCE-AND-SET-CONTRACT.md)
- [`ADR-0009`](file:///Users/RSB/Projects/GitHub/AIA/doc/ADR-0009-FULL-UML-DIAGRAM-FABRIC-AND-OPEN-SPECIFICATION-BOUNDARY.md)
- [`PROMPT_ADELE_TO_ALAN_CR053`](file:///Users/RSB/Projects/GitHub/AIA/doc/PROMPT_ADELE_TO_ALAN_CR053_Stereotype_Glyphs_and_Inspector_Picker.md)

---

## 1. Executive Summary & Verification State

- **Test Suite Status:** **117 / 117 tests passing** (`pnpm test` in `packages/canvas`). Clean zero-regression baseline.
- **Glyph Asset Pipeline:** Complete & verified. All 117 SVG pictograms (113 from `StereotypeImage/` + 4 OTW BCE/Actor roots) processed, optimized, converted from EMF raw coordinates to crisp viewBox-scaled vector art in `packages/canvas/assets/stereotypes/` (8.55 MB raw → 1.90 MB optimized).
- **Line-Art Fixes Applied:** The OTW hairline line-art glyphs (`Actor`, `Boundary`, `Control`, `Entity`, `CaseWorker`, `InternalWorker`, `Worker`) were given proportional `#1F2937` strokes and inverted back along their Y-axis (fixing the legacy EMF coordinate inversion). Contact sheet verified at `cr053_glyph_contact_sheet.png`.

---

## 2. Architecture & Implementation Progress

### Task 1: Node Badging & Silhouette Substitution (`@dr2rai/raid-canvas`)
- **Status:** **In Progress (~75% complete)**
- **Completed:**
  - `types.ts`: Added `stereotypeGlyph?: string` to `RaidNodeData` and `ATTR_STEREOTYPE_GLYPH = 'aim-stereotype-glyph'` to `AimSvgContract`.
  - `StereotypeGlyphs.ts`: Created runtime registry module with:
    - Tolerant resolution (`resolveStereotypeGlyph` matching filenames, IDs, aliases, and German terms).
    - URL resolution (`getStereotypeGlyphUrl`, default `/stereotypes/`, configurable base URL or custom resolver).
    - Responsive geometry computation (`computeStereotypeGlyphPlacement`) handling both:
      - **Silhouette Substitution Mode:** Actors (`aim-per`) and frameless places (`aim-plc`) centered in the 58px upper band, leaving label lines stable.
      - **Header Badge Mode:** Cards (`aim-obj`, `aim-act`, `aim-cls`, `aim-uc`) as a crisp 24×24 badge beside the stereotype header.
  - `X6Shapes.ts`:
    - Injected `<image selector="glyph" />` markup slot into all 6 ontological node shapes (`aim-uc`, `aim-act`, `aim-cls`, `aim-obj`, `aim-per`, `aim-plc`).
    - Implemented `computeStereotypeGlyphAttrs(...)` anchoring via `refX`/`refY` for resize resilience (CR034 §2.1).
    - Integrated glyph detection into `createAimNode(...)`.
- **Remaining for Task 1:**
  - Finish wiring `glyphAttrs` into the archetype return branches in `createAimNode(...)` (specifically `uc`, `act`, `cls`, `obj`, `per`, `plc`).
  - Wire `glyph` update handling in `RaidCanvas.tsx` (`updateNode` method) so updating `stereotypeGlyph` triggers immediate canvas re-render.
  - Wire headless SVG rendering in `RaiBridge.ts` (`renderNodeInnerSvg`) to emit `<image ... />` elements for vector export.

---

### Task 2: Interactive Stereotype Picker (`RaidInspector.tsx` & `aia-workbench`)
- **Status:** **Pending (Ready to implement)**
- **Design Spec (CR053 §2.2):**
  - In `RaidInspector.tsx`, the `Stereotype / Facet` property section needs a visual badge button showing the active glyph (or a `+` / tag icon if unset).
  - Clicking opens a modal/flyout grid organized into the 5 canonical categories:
    1. `Roles & Agents` (Artist, DeskWorker, BusinessMan, Policeman, Thinker, ...)
    2. `Systems & Infrastructure` (Computer, Compute, FlipPhone, Truck, ZementTruck, ...)
    3. `Robustness & Flow` (Boundary, Control, Entity, Delivery, Direction, ...)
    4. `Artifacts & Documents` (Book, Certificate, Notes, Knife, Mug, ...)
    5. `Metaphors & States` (Anchor, Bridge, Hurdle, LadyJustice, geschafft, StopWatch, Sun, ...)
  - Search filter input matching labels, English/German keywords, and aliases (via `searchStereotypeGlyphs(...)`).
  - Selecting an icon:
    - Sets `node.stereotypeGlyph = entry.file`.
    - If `node.stereotype` is unset or default, sets `node.stereotype = entry.id`.
    - Emits `onUpdateNode(id, { stereotypeGlyph: entry.file, stereotype: ... })`.
    - A "Clear / Reset to Default" button resets `stereotypeGlyph` to `undefined`.

---

### Task 3: Serialization Contract (`AimSvg` in `RaiBridge.ts` & `aimSvg.ts`)
- **Status:** **Partially specified, pending serialization code**
- **Contract Rules:**
  - Emits: `<g aim-node="true" ... aim-stereotype="ApplicationServer" aim-stereotype-glyph="Computer.svg">`
  - Hydration: `RaiBridge.ts` parse loop extracts `el.getAttribute('aim-stereotype-glyph')` into `nodeData.stereotypeGlyph`.
  - Base SVG updater: In `updateExistingSvg`, preserves or updates `aim-stereotype-glyph`.
  - Same parity updates in `aia-workbench/lib/aimSvg.ts`.

---

## 3. Catalog & Assets Built

1. **Asset Pipeline Script:**
   - [`packages/canvas/scripts/build-stereotype-glyphs.mjs`](file:///Users/RSB/Projects/GitHub/RaidCanvas/packages/canvas/scripts/build-stereotype-glyphs.mjs)
   - Reads from `/Users/RSB/Projects/GitHub/AIA/StereotypeImage` and `/Users/RSB/Projects/OTW/Programm/StereotypBild`.
   - Normalizes physical mm viewports into clean SVG `viewBox="0 0 W H"`.
   - Strips Inkscape metadata and prefixes path IDs to avoid collisions.
   - Outputs 117 SVGs to `packages/canvas/assets/stereotypes/`.

2. **Generated Catalog:**
   - [`packages/canvas/src/StereotypeGlyphCatalog.ts`](file:///Users/RSB/Projects/GitHub/RaidCanvas/packages/canvas/src/StereotypeGlyphCatalog.ts)
   - Contains typed array `STEREOTYPE_GLYPH_CATALOG` with entries:
     ```ts
     { id, file, label, category, keywords, aliases, aspect, bytes }
     ```

3. **Runtime Helper Module:**
   - [`packages/canvas/src/StereotypeGlyphs.ts`](file:///Users/RSB/Projects/GitHub/RaidCanvas/packages/canvas/src/StereotypeGlyphs.ts)
   - Exports: `resolveStereotypeGlyph`, `getStereotypeGlyphUrl`, `setStereotypeGlyphBaseUrl`, `setStereotypeGlyphResolver`, `searchStereotypeGlyphs`, `computeStereotypeGlyphPlacement`.

---

## 4. Modified & Staged Files

| File | Status | Description / Role |
| :--- | :--- | :--- |
| `packages/canvas/package.json` | Modified | Added `svgo` devDependency for glyph normalization pipeline. |
| `packages/canvas/src/types.ts` | Modified | Added `stereotypeGlyph?: string` to `RaidNodeData` and `ATTR_STEREOTYPE_GLYPH`. |
| `packages/canvas/src/StereotypeGlyphs.ts` | **New** | Runtime glyph lookup, resolver, category lists, search, and placement math. |
| `packages/canvas/src/StereotypeGlyphCatalog.ts` | **New (Generated)** | Catalog data for all 117 normalized OTW pictograms. |
| `packages/canvas/scripts/build-stereotype-glyphs.mjs` | **New** | SVGO & Inkscape normalizer script creating assets and catalog. |
| `packages/canvas/assets/stereotypes/*.svg` | **New (117 files)** | Normalized, viewBox-scaled vector SVG assets. |
| `packages/canvas/src/X6Shapes.ts` | Modified | Added `image[glyph]` to node markups, added `computeStereotypeGlyphAttrs`, updated `createAimNode` start. |

---

## 5. Architectural Query from Dr. Rainer Burkhardt (To Address)

> **Context:** Dr. Burkhardt raised a fundamental question regarding the Portuguese Flag tincture semantics:
> In the National Flag of Portugal, **Green is on the left (hoist)** and **Red is on the right (fly)**, divided by the Armillary Sphere & Net Gold seam.
> Currently, some duality components and activity borders use green on the right.
> Dr. Burkhardt asked:
> 1. What needs to change across the codebase to ensure Green is strictly on the Left and Red on the Right across all duality doors / Portuguese heraldic styling?
> 2. How does this impact the website / Glass holistically?
> 
> *Note for Claude Twin:* Keep this design review in mind when Dr. Burkhardt is ready to discuss the flag alignment; the immediate technical priority is finalizing CR053.

---

## 6. Immediate Next Steps for Claude Twin in VS Code

Resume immediately in `packages/canvas/src/X6Shapes.ts`:

1. **Step 1: Finish `X6Shapes.ts`:**
   - In `createAimNode(data: RaidNodeData)`:
     - For `case 'uc'`: merge `glyph: glyphAttrs.glyph` into `attrs`.
     - For `case 'act'`: merge `glyph: glyphAttrs.glyph` into `attrs`.
     - For `case 'cls'`: merge `glyph: glyphAttrs.glyph` into `attrs`.
     - For `case 'obj'`: merge `glyph: glyphAttrs.glyph` into `attrs`.
     - For `case 'per'`: when `hasGlyph`, suppress stick torso/head (`torso.display = 'none'`, `head.display = 'none'`), set `glyph: glyphAttrs.glyph`, and adjust label Y offset so the silhouette has room.
     - For `case 'plc'`: merge `glyph: glyphAttrs.glyph` into `attrs`.
   - In `RaidCanvas.tsx`:
     - In `updateNode(id, updates)`: ensure `updates.stereotypeGlyph` is merged into `nextData` and attributes on the `glyph` selector (`glyph/href`, `glyph/display`, `glyph/width`, `glyph/height`, etc.) are updated on the cell.

2. **Step 2: Headless SVG Export in `RaiBridge.ts`:**
   - In `renderNodeInnerSvg(node: RaidNodeData)`:
     - Check `node.stereotypeGlyph`. If resolved, compute placement with `computeStereotypeGlyphPlacement` and append:
       ```xml
       <image href="${url}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="xMidYMid meet" class="aim-stereotype-glyph" />
       ```
   - In `extractNodesFromSvg`: parse `aim-stereotype-glyph`.
   - In `updateExistingSvg`: synchronize `aim-stereotype-glyph` attribute.

3. **Step 3: Interactive Picker in `RaidInspector.tsx`:**
   - Add a visual glyph button and popup modal/drawer using DaisyUI/Tailwind grid to let operators search and assign glyphs.

4. **Step 4: Verification & Bump:**
   - Add unit tests in `test/canvas.test.mjs` verifying:
     - Actor silhouette substitution with `Artist.svg`.
     - Object card badging with `Computer.svg`.
     - Lossless round-trip SVG hydration/serialization.
   - Run `pnpm test` (all tests passing).
   - Bump version to `@dr2rai/raid-canvas@0.10.0`.
