# RaidCanvas 0.10.0 — Stereotype glyphs (CR053)

Date: 2026-10-05 · Package: `@dr2rai/raid-canvas@0.10.0`

Not yet published. Governing change request: CR053 (AIA → RaidCanvas, Stereotype Glyph Rendering and Inspector Picker).

## Changes

- **Pictogram library.** 117 OTW stereotype pictograms, normalized to viewBox-scaled SVG (8.55 MB → 1.90 MB), ship in `assets/stereotypes/` and are exported as `@dr2rai/raid-canvas/stereotypes/*`. They are referenced by URL, never bundled. Hosts serve the folder and call `setStereotypeGlyphBaseUrl(...)` once (default `/stereotypes/`), or install `setStereotypeGlyphResolver(entry => url)` for asset maps or authenticated endpoints.
- **Tolerant resolution.** `resolveStereotypeGlyph` accepts file names, ids, case and spacing variants, path prefixes, German originals and aliases (`computer`, `/stereotypes/Computer.svg`, `geschafft 2.svg`). Unknown names fall back to the plain archetype and still round-trip verbatim.
- **Node rendering.** `stereotypeGlyph` on a node:
  - **Silhouette** on Person (`per`) and frameless Place (Venue / Stage / Bar). The pictogram replaces the stick figure or pin in the same 58 px band, so labels don't move.
  - **24 × 24 header badge** on Use Case, Activity, Class, Object and framed Place, in place of the built-in stereotype icon.
- **Edge rendering.** CR053 covers nodes only; Dr. Burkhardt approved this extension on 2026-10-05. `stereotypeGlyph` on an edge draws a 20 × 20 pictogram on a chalk backing at the edge midpoint, stacked above the label and expression pill.
- **Canvas API.**
  - `addNode`, `updateNode` and `updateEdge` accept `stereotypeGlyph`; `''` clears it.
  - `updateNode` re-renders the node canonically when a glyph is involved, using the live size.
- **AimSvg contract.**
  - New attribute `aim-stereotype-glyph` on node and edge groups.
  - Writes the canonical file name for known glyphs, otherwise the original value.
  - Read back on hydration and kept in sync by `updateExistingSvg`.
  - The headless SVG export draws the same `<image class="aim-stereotype-glyph …">` as the live canvas.
- **Inspector picker.**
  - Under **Stereotype / Facet** (nodes) and **Edge Label / Stereotype** (edges).
  - A badge button shows the active glyph, or an unknown reference verbatim.
  - The flyout has category tabs (Roles & Agents, Systems & Infrastructure, Robustness & Flow, Artifacts & Documents, Metaphors & States), search across English and German keywords and aliases, and **Clear**.
  - On a node, choosing a glyph also sets the stereotype to the glyph name when none is set. On an edge it sets only the pictogram, because the edge's label field is its visible text.
- **Exports.**
  - Constants: `STEREOTYPE_GLYPH_CATALOG`, `STEREOTYPE_GLYPH_CATEGORIES`, `GLYPH_SILHOUETTE_BAND`, `GLYPH_BADGE_SIZE`, `GLYPH_EDGE_SIZE`.
  - Functions: `resolveStereotypeGlyph`, `hasStereotypeGlyph`, `searchStereotypeGlyphs`, `getStereotypeGlyphUrl`, `getStereotypeGlyphBaseUrl`, `setStereotypeGlyphBaseUrl`, `setStereotypeGlyphResolver`, `computeStereotypeGlyphPlacement`, `computeStereotypeGlyphAttrs`.

## Fixes

- Edge `aim-stereotype` is now read back on SVG hydration. Before, it was written out but dropped on re-import.
- Workspace build: `@antv/x6@3.1.8` declares `"type": "module"` over CommonJS `lib/`. That broke `tsc` (NodeNext) and Node ESM imports. A `pnpm patch` (`patches/@antv__x6@3.1.8.patch`) removes the field for this workspace.

## Notes for integrators

- **x6 patch scope.** The x6 patch applies only inside this repository; it does not ship to npm consumers. A consumer that type-checks with `moduleResolution: NodeNext` or imports the canvas under Node ESM needs the same `pnpm patch` (or equivalent) until x6 is fixed upstream. Bundled browser apps (Vite, webpack) are unaffected.
- **aia-workbench.** `lib/aimSvg.ts` needs matching `aim-stereotype-glyph` read/write for nodes and edges.
- **Studio.** Studio serves `packages/canvas/assets` as its public folder, so glyphs load at the default `/stereotypes/` base URL.
- **Known limitation.** On a Person or Venue / Stage / Bar with a glyph, the duality door and seam still follow the stick-figure / pin outline.

## Validation

- `pnpm -r run build`: library and Studio pass. Vite reports the existing >500 kB bundle advisory. Studio's build includes all 117 glyphs.
- `pnpm -r run test`: 132 tests pass, 0 failures/skips. Tests added:
  - glyph catalog and resolution
  - node silhouettes and badges
  - fallback for unknown glyphs
  - node and edge round trips (fresh SVG → hydrate → in-place update → clear)
  - serialization from the live graph
  - node and edge Inspector picker flows
  - `test/x6Render.test.mjs`, which renders edge glyphs through a real X6 graph in JSDOM. It catches failures that only appear inside X6's label pipeline, such as a label `<rect>` inheriting `Edge.defaultLabel`'s `ref: 'label'`.
- `pnpm -r run lint`: both packages pass.
- Studio browser check: node glyph on an Activity (Eye) confirmed by Dr. Burkhardt. The edge glyph on Prepare → Conclude has not yet been confirmed in a browser after the fix.
