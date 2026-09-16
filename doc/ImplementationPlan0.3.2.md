# RaidCanvas v0.3.2 Implementation Plan
## Full Archetype Shape Serialization in Existing SVGs

**Author:** Alan (RaidCanvas Agent)  
**Target Version:** `0.3.2`  
**Date:** 2026-09-15  
**Upstream Collaboration:** Adele & Zébio (`aia-workbench`)

---

## 1. Context & Objectives

In v0.3.1, RaidCanvas delivered unpinned center-aiming, root `<svg aim-routing="...">` persistence, canonical Person glyphs, underlined instance labels, and live edge path baking.

In upstream testing by Zébio in `aia-workbench` (passing all 1,032 .NET and 130 Vitest gates), Zébio confirmed that Chrome and macOS QuickLook/Preview render boxes, labels, connected curves, and arrowheads. However, an analysis of the exported file revealed:

```text
node groups / edge groups / routed paths: 5 / 4 / 4
arrowhead markers: 2, used 4×
aim-routing, full aim-* contract: ✓
aim-kind="per": 4
head circles, torso paths, underlines: 0
```

### The Root Cause
When saving via `serializeToSvg(graph, baseSvg)`, `RaiBridge.ts` calls `updateExistingSvg`. Previously, `updateExistingSvg` only updated the outer `<g>` tag's `transform` and `<rect width/height>`. It did **not** update or replace the inner archetype shape markup, preserving legacy plain `<rect>` elements from the base SVG.

### The Objective for v0.3.2
Fulfill the dual-use promise for archetype decoration:
When `updateExistingSvg` runs, it must emit each node's full canonical archetype shape markup inside its `<g>` element:
- **`aim-per`**: Emits the head circle, torso path, Cascais Net Gold `#F59E0B` for initiating roles, and centered label.
- **`aim-act`**: Emits rounded rectangle (`rx: 12, ry: 12`, Heraldic Green `#10B981`) and underlined text (`text-decoration="underline"`).
- **`aim-obj`**: Emits SilverLine rectangle and underlined text.
- **`aim-uc`**: Emits Net Gold ellipse and bold text.
- **Sync additions and deletions**: Automatically insert newly created nodes/edges or remove deleted ones.

---

## 2. Technical File Changes

### 2.1 `packages/canvas/src/RaiBridge.ts`
- Implement `renderNodeInnerSvg(node: RaidNodeData): string` shared between `generateFreshSvg` and `updateExistingSvg`.
- In `updateExistingSvg`:
  - Ensure `<defs>` contains `#arrow-classic`, `#arrow-hollow`, and the complete AOAIM `<style>` block (including `.aim-act text, .aim-obj text { text-decoration: underline; }`).
  - For each node: replace child elements with the canonical shape markup parsed from `renderNodeInnerSvg(node)`.
  - Remove deleted nodes and insert newly created nodes.
  - Remove deleted edges and insert newly created edges.
- In `generateFreshSvg`: reuse `renderNodeInnerSvg(node)`.

### 2.2 `packages/canvas/test/canvas.test.mjs`
- Add test verifying that `updateExistingSvg` on a legacy SVG containing 4 `aim-kind="per"` plain boxes transforms them into:
  - 4 `<circle cx="45" cy="22" r="8"` head elements.
  - 4 `<path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4"` torso elements.
  - Underlined Activity/Object labels.

### 2.3 `packages/canvas/package.json`
- Bump version to `0.3.2`.

---

## 3. Verification Plan

1. Run `pnpm -r run build && pnpm -r run typecheck`.
2. Run `pnpm -r run test` (all 26 tests passing).
3. Generate and inspect an updated SVG to confirm head circles, torso paths, and underlines are present.
4. Record results in `doc/ReleaseNotes0.3.2.md`.
