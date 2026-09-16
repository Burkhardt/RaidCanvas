# Release Notes: @dr2rai/raid-canvas 0.3.2
## Full Archetype Shape Serialization in Existing SVGs

**Release Date:** September 15, 2026  
**Package:** `@dr2rai/raid-canvas@0.3.2`  
**Git Tag:** [`v0.3.2`](https://github.com/Burkhardt/RaidCanvas/releases/tag/v0.3.2)  
**Lead Engineer:** Alan (7012), Visual Systems, Canvas & HCI Lead  
**Upstream Collaboration:** Adele & Zébio (`aia-workbench`)

---

## 1. Delivery Checklist

| Item | Status | Verification & Details |
| :--- | :--- | :--- |
| **Archetype Shape Serialization in Existing SVGs** | **DELIVERED** | `updateExistingSvg` emits full canonical shape markup inside each node `<g>`, replacing legacy plain `<rect>` frames |
| **Person Glyph Head Circles & Torso Paths** | **DELIVERED** | Emits `<circle cx="45" cy="22" r="8">` and `<path d="M 61 50 ...">` for every `aim-kind="per"` node (with Cascais Net Gold `#F59E0B` for initiating personas) |
| **Underlined Instance Labels** | **DELIVERED** | Emits `text-decoration="underline"` on Activity (`aim-act`) and Object (`aim-obj`) labels, and injects underline CSS rules into `<style>` |
| **Node & Edge Layer Synchronization** | **DELIVERED** | `updateExistingSvg` cleanly inserts newly added nodes/edges and prunes deleted ones |
| **Automated Test Suite** | **PASSED** | **26 / 26 unit tests passing** across 4 test suites (`pnpm -r run test`), including dedicated legacy-upgrade test |
| **Monorepo Build & Typecheck** | **PASSED** | 0 errors across TypeScript 7.0.2 compiler and Vite bundler |
| **Implementation Plan & Release Notes** | **COMMITTED** | Recorded in `doc/ImplementationPlan0.3.2.md` and `doc/ReleaseNotes0.3.2.md` |

---

## 2. Key Features & Architectural Enhancements

### A. Context & Upstream Discovery by Zébio
In `aia-workbench`, Zébio and Adele ran the full gate suite (passing all 1,032 .NET tests and 130 Vitest tests) and verified that Chrome and macOS QuickLook/Preview render boxes, labels, connected curves, and arrowheads.

However, an inspection of the exported SVG file revealed:
```text
node groups / edge groups / routed paths: 5 / 4 / 4
arrowhead markers: 2, used 4×
aim-routing, full aim-* contract: ✓
aim-kind="per": 4
head circles, torso paths, underlines: 0
```
While `generateFreshSvg` had archetype shape markup, `serializeToSvg(graph, baseSvg)` calls `updateExistingSvg`. Previously, `updateExistingSvg` only modified the outer `<g>` tag's `transform` and `<rect width/height>`. It preserved the legacy plain `<rect>` child elements from `baseSvg`, resulting in Person nodes exporting as plain boxes in QuickLook and Preview.

### B. Canonical Archetype Shape Markup in `updateExistingSvg`
In v0.3.2, `RaiBridge.ts` introduces `renderNodeInnerSvg(node: RaidNodeData)`, shared between fresh exports and incremental SVG saves:
* **`aim-per` (Person / Actor)**:
  - Invisible bounds frame: `<rect width="${w}" height="${h}" fill="none" stroke="none" />`
  - Torso path: `<path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`
  - Head circle: `<circle cx="45" cy="22" r="8" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2" />`
  - Persona coloring: Cascais Net Gold (`#F59E0B`) for `«initiates»` roles; Warm Graphite (`#1F2937`) for standard personas.
  - Centered text label at `(cx, 68)`.
* **`aim-act` (Activity)**:
  - Rounded rectangle (`rx: 12, ry: 12`, Heraldic Green `#10B981`, stroke-width: 2).
  - Underlined label with explicit `text-decoration="underline"`.
* **`aim-obj` (Object)**:
  - SilverLine rectangle (`#D1D5DB`, stroke-width: 1.5).
  - Underlined label with explicit `text-decoration="underline"`.
* **`aim-uc` (UseCase)**:
  - Net Gold ellipse (`stroke="#F59E0B"`, stroke-width: 2).
  - Centered bold label (`font-weight="bold"`).
* **`aim-cls` (Class)**:
  - Class card structure with header and attributes/methods compartments.

### C. Complete Parity Between Fresh and Updated SVGs
Whether a diagram is:
1. Created from scratch (`generateFreshSvg`), or
2. Imported from an existing file and saved (`updateExistingSvg`),
the exported SVG markup inside each `<g class="aim-node">` is **100% identical**. 

QuickLook, Finder thumbnails, macOS Preview, Safari, Chrome, and Keynote now render every archetype with full visual fidelity, while `RaidCanvas` and `aia-workbench` retain the complete `aim-*` metamodel for dynamic interaction.

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
  # Output: 26 tests across 4 suites passed (0 failures)
  ```
  - `updateExistingSvg emits full canonical archetype shape markup (head circles, torso paths, underlines)`: **PASSED**
    - Verifies that passing a legacy base SVG with 4 plain-box Person nodes upgrades them into:
      - Exactly 4 `<circle cx="45" cy="22" r="8">` head elements.
      - Exactly 4 `<path d="M 61 50 ...">` torso elements.
      - Net Gold accent for initiating persona.
      - Underlined text on Activity and Object instances.

---

## 4. Upstream Integration Guide (`aia-workbench`)

Adele and Zébio can update to `0.3.2` in `aia-workbench`:

```bash
pnpm update @dr2rai/raid-canvas@0.3.2
```

No code changes are required in `aia-workbench`. Any saved or exported SVG will now automatically carry the complete visual archetype decoration (head circles, torso paths, rounded corners, underlines) in addition to the connected routed paths and arrowheads.
