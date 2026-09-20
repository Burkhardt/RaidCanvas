# Release Notes - RaidCanvas v0.7.0 (Increment 2: The Glass)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Product Manager & Directive Author:** Adele (7010 / 7013) (AIA PM)  
**Lead Full-Stack Review:** Zébio (7011) (`AIA Platform` / `aia-workbench`)  
**Lead Ontologist Review:** Vasco (7015) (`AIA Ontology v1.4` / `ONTOLOGY-COMPENDIUM.md`)  
**Package:** `@dr2rai/raid-canvas@0.7.0`  
**Date:** September 2026  
**Governing Documents:**
- `doc/ONTOLOGY-COMPENDIUM.md` (Vasco 7015: WWWA Meta-Model Invariants)
- `doc/ONTOLOGY_RELEASE_NOTES_v1.4.md` (Class: "Meeting", Method Scoping, MethodKind)
- Directive: *Increment 2 — The Glass (`@dr2rai/raid-canvas@0.7.0`)* (Adele 7010)

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.7.0` delivers **Increment 2 — The Glass**, establishing the cognitive medium and visual ontology contract for UML system boundaries, live AST expression pills, Rule 2 unbound role slots, and modular studio components.

This release fulfills the architectural directive from Adele (7010), aligning directly with Vasco's (7015) WWWA meta-model invariants and Rainer Burkhardt's Dynabook visual hierarchy:
1. **Class vs. Package Boundaries (`aim-boundary-class` & `aim-boundary-package`)**: Resizable outer enclosures for OneUseCaseDiagrams. Method UseCases (e.g. `CloseContract`, `ScheduleMeeting`) live *inside* the Class boundary box (`Class: Contract`), moving with the box in compound lockstep, while external actors (`Host`, `Attendees`) remain outside with cross-boundary connections.
2. **Edge AST Expression Capsule Pills (`aim-expression` & `aim-satisfied`)**: Midpoint SVG capsules rendering formatted AST infix expressions (e.g. `Host != null`, `Meeting.Status := "Scheduled"`) with live semantic evaluation styling: Heraldic Green (`#ECFDF5` / `#065F46` / `#A7F3D0`) for satisfied, Venetian Amber (`#FFFBEB` / `#92400E` / `#FDE68A`) for unsatisfied, and Slate Neutral (`#F1F5F9` / `#475569` / `#CBD5E1`) for indeterminate.
3. **Rule 2 (No Coining) Unbound Shadow Slots (`aim-unbound="true"`)**: Archetype parity for ungrounded role slots awaiting runtime binding (`[Person]`, `[Object]`, `[Place]`), rendered with dashed borders (`stroke-dasharray="5,4"`), 70% opacity, bracketed display names, and muted ink.
4. **Exported Modular Components (`<RaidInspector />` & `<RaidPalette />`)**: Drop-in studio inspector with Cascais Light Theme (`#f4f4f0` paper, `#ecece6` panel, `#dcdcd4` line, `#1f2937` ink), 📌 Pin docking toggle, AST expression editor, boundary inspector, and collapsible folding palette.

---

## 2. Key Architectural Deliverables

### 2.1 Resizable Boundary Enclosures & UML Containment
* **Class Boundary (`aim-boundary-class`):**
  - Designed for OneUseCaseDiagrams where method UseCases live inside a domain class (e.g. `Class: Meeting` enclosing `ScheduleMeeting`).
  - Cascais Gold (`#C59B27`) perimeter, dashed `6,4`, with an inset header badge inside the top-left corner (`refX: 10, refY: 10`).
* **Package Boundary (`aim-boundary-package`):**
  - Canonical UML tabbed hanging folder notation for package namespaces (`Package: AIA Foundation`).
  - Antracit (`#1E293B`) solid border with a protruding top-left folder tab (`refX: 0, refY: -22, height: 22`).
* **Interactive Resizing & Lockstep Containment:**
  - Integrated `@antv/x6-plugin-transform` enabling resize handles on boundaries (`minWidth: 180, minHeight: 120`).
  - Hierarchical compound node containment via `embedding` and `node.addChild(child)`. Translating a boundary box moves all enclosed UseCases and objects in lockstep.
  - Automatic synchronization of `node:embedded` and `node:unembedded` events updating boundary `elementIds` and child `boundaryId`.

### 2.2 Edge AST Expression Capsules (`aim-expression` & `aim-satisfied`)
* **Interactive Midpoint Capsules:**
  - Renders at edge midpoint (`position: 0.5`) with an SVG capsule pill (`rx: 8, ry: 8`) and monospace font.
  - Automatically shifts stereotype labels (`position: 0.25`) to prevent collision.
* **Semantic Evaluation Tokens:**
  - `satisfied: true` (Heraldic Green): `#ECFDF5` background, `#A7F3D0` border, `#065F46` text.
  - `satisfied: false` (Venetian Amber): `#FFFBEB` background, `#FDE68A` border, `#92400E` text.
  - `satisfied: null` (Slate Neutral): `#F1F5F9` background, `#CBD5E1` border, `#475569` text.
* **Full SVG Contract Round-Trip:**
  - Serialized as `aim-expression="..."` and `aim-satisfied="true|false"` on `<g aim-edge="...">` elements, baking standalone SVG pill markup for external viewers (Safari, Chrome, Preview).

### 2.3 Rule 2: No Coining Unbound Shadow Slots (`aim-unbound="true"`)
* **Slot Semantics:**
  - Enforces WWWA Rule 2 (No Coining): an entity whose role slot is ungrounded at design time renders as an unbound shadow stencil awaiting runtime binding.
* **Visual Representation:**
  - Dashed perimeter (`stroke-dasharray="5,4"`).
  - 70% opacity across all glyph elements (head, torso, pin, frames).
  - Bracketed display names (`[DisplayName]`).
  - Muted ink (`CascaisPalette.GraphiteMuted`).
  - Full 4-port orthogonal magnetic docking compatibility across `per`, `obj`, and `plc`.

### 2.4 Studio Inspector (`<RaidInspector />`)
* **Exported Reusable Component:**
  - Packaged and exported directly from `@dr2rai/raid-canvas`.
  - Cascais Light Theme styling (`#F9F9F6` background, `#E5E5DF` borders, `#1F2937` ink).
* **Header Pin Docking (📌):**
  - Allows operators to pin the inspector open or dock it into side-by-side split panes without closing on canvas clicks.
* **Property Inspections:**
  - Nodes: display names, archetype, stereotype quick badges, Rule 2 unbound toggle, Portuguese Bicolor Duality deep linking (`aim-href`).
  - Edges: directionality, stereotypes, routing modes, AST expression viewer and editor with live True/False/None satisfaction toggles.
  - Boundaries: kind switcher (Class vs Package), scope name, package namespace, and enclosed element counts/chips.

### 2.5 Collapsible Stencil Palette (`<RaidPalette />`)
* **Compact Drawer with Chevron Minimizer:**
  - Expands to 175px or folds down to a slim 36px rail via chevron toggle (`◀` / `▶`).
* **Canonical Catalog:**
  - Core Archetypes: Person (`aim-per`), UseCase (`aim-uc`), Activity (`aim-act`), Class (`aim-cls`), Object (`aim-obj`), Place (`aim-plc`), Role (`aim-rol`), RoleFiller (`aim-rf`).
  - Boundaries: Class Boundary (`aim-boundary-class`), Package Folder (`aim-boundary-package`).
  - Unbound Slots: `[Person]`, `[Object]`, `[Place]`.
* **HTML5 Drag-and-Drop:**
  - Native drag support emitting `application/aoaim-kind`, `application/aim-stencil`, `application/aim-boundary`, and `text/plain`.

---

## 3. Verification & Acceptance Testing

The test suite contains **93 unit tests across 12 test suites**, passing 100% cleanly (`pnpm test`):
- **Increment 2 Acceptance Suite:**
  - `Class Boundary creates aim-boundary-class with Cascais Gold dashed border and inset badge` (PASSED)
  - `Package Boundary creates aim-boundary-package with Antracit solid border and protruding hanging folder tab` (PASSED)
  - `RaiBridge hydates Class boundary and child elements, preserving containment in round-trip SVG` (PASSED)
  - `Edge AST Expression Capsule renders at midpoint with semantic satisfaction styling` (PASSED)
  - `Rule 2 (No Coining) Unbound shadow node stencils render with dashed stroke, 70% opacity, and bracketed names` (PASSED)
  - `Component exports & Palette items integrity` (PASSED)
- **All 87 Regression Tests:**
  - Complete backwards compatibility with CR030 (XML Escaping), CR032 (Labels/Centering), CR033 (Ontological Deep Linking / Portuguese Bicolor Seam), CR034 (Stereotype Iconography), CR035/CR035.1 (Duality Awakening DOM View Synchronization).

---

## 4. Upgrading to v0.7.0

In `package.json`:
```json
{
  "dependencies": {
    "@dr2rai/raid-canvas": "^0.7.0"
  }
}
```

Importing new shapes and components:
```tsx
import {
  RaidCanvas,
  RaidInspector,
  RaidPalette,
  createAimBoundary,
  type RaidBoundaryData,
  type RaidInspectorSelection,
} from '@dr2rai/raid-canvas';
```
