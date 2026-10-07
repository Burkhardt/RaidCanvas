# RaidCanvas 0.11.0 — The flag of Portugal (CR055), and Shapes that stand free

Date: 2026-10-06 · Package: `@dr2rai/raid-canvas@0.11.0`

Not yet published. Governing change request: CR055 (AIA → RaidCanvas, Portuguese Heraldic Flag Alignment). Art direction: Koyo, *The Glass Guide* (decisions D1–D9). The assessment of affected components across RaidCanvas and aia-workbench is in [CR055_Assessment_RaidCanvas_Heraldic-Flag-Alignment.md](CR055_Assessment_RaidCanvas_Heraldic-Flag-Alignment.md).

**Ship together with the aia-workbench bump** (`@dr2rai/raid-canvas` 0.9.0 → 0.11.0) and its civic-stripe flip. Released apart, the chrome would read green→red while the canvas still reads the old way.

## Changes

- **Flag bicolour.** An awakened linked node now reads Verde Esperança (left, the Persona) · Net Gold seam · Vermelho Coragem (right, the Portal):
  - Every archetype has a new `persona` selector: the door path mirrored across the seam, washed in `BandeiraVerde #1E5631`.
  - The door and the `›` chevron are washed in `BandeiraVermelho #D22B2B`.
  - Resizing an awakened node re-derives both halves.
- **Wash strengths (Koyo, second ruling of 2026-10-06, replacing the per-material table of D8).** New export `DualityWashStrength`:

  | Part | Strength |
  |---|---|
  | `verde` (Persona, left half) | 0.20 |
  | `vermelho` (Portal door, right half) | 0.12 |
  | `hover` (door while hovered or pressed) | 0.18 |
  | `chevron` | 0.70 (100 % on hover) |

  The halves are unequal on purpose. Verde is dark: at 10 % on white it is a cool grey (`#E9EEEA`), while Vermelho at 10 % is still pink. One pair now applies to every material.
- **The Person raises the whole flag too.** Head and torso take Verde on the left and Vermelho on the right, so the figure reads as tinted, not cut. Koyo revised D3 after Dr. Burkhardt saw that an unwashed Person looked unselected. A Person with stereotype `System` is a rack and is washed as a silhouette (15 %).
- **Hover is never load-bearing; the iPad comes first** (Koyo, Adele). Everything a node offers is visible after tap 1.
  - Pressing the right half (`:active`) raises the door to 18 % and the chevron to full Vermelho: touch feedback on every input.
  - With a mouse or trackpad, hovering the door does the same (`.aim-portal-door:hover ~ .aim-portal-chevron`; `a:hover` in exports).
  - The left half answers the same way in Verde: pressing it (or hovering it with a cursor) raises the persona to 18 %. This applies only where a left tap does something: RaidCanvas adds `aim-inspectable` to its wrapper when the host passes `onNodeClick`. The persona now takes pointer events; tap 2 on it still fires `onNodeClick`.
  - Every `:hover` rule in `aoaim-theme.css` and in exported SVGs sits behind `@media (hover: hover) and (pointer: fine)`, because WebKit keeps ungated hover styles after a tap.
  - The Palette's hover tint moved from `onMouseEnter` to `onPointerEnter` with `pointerType === 'mouse'`, since a tap also fires compatibility mouse events.
- **Tap contract (D4, D9).**
  - Tap 1 on a linked node shows the whole flag and is selection only.
  - Tap 2 commits: the left half fires `onNodeClick` (inspect); the right half fires `onNodePortalClick` (step through).
  - Unlinked nodes fire `onNodeClick` on tap 1, as before.
  - Studio now brings the Inspector tab forward on `onNodeClick`, not on selection. Edges still come forward on selection.
- **Exports at rest (D5).**
  - The headless SVG shows no persona. The door inside `<a>` is unpainted. The seam (`NetGoldStroke`) and a Vermelho chevron at 70 % mark the portal.
  - `updateExistingSvg` heals SVGs painted by earlier builds back to rest, once.
- **One gold family (D6).**
  - `NetGold #D4AF37` for fills (the chrome's `--net-gold`).
  - New `NetGoldStroke #AB8722` for seams, outlines, glyph strokes, boundaries and Inspector/Palette borders. At 3.06:1 on Calçada `#F4F4F0` (3.38:1 on white) it meets the WCAG 1.4.11 minimum of 3:1 for lines; Koyo's first pick, `#C59B27`, measured 2.35:1.
  - Amber `#F59E0B` is gone. Studio presets follow.
- **Cascais theme module.** `CascaisTheme.ts` is the single source of every heraldic colour; no source file spells a gold, green or red hex of its own. Exports: `CascaisPalette`, `withAlpha`, `HeraldicWash`, `DualityWashStrength`. `aoaim-theme.css` mirrors it as `--aim-net-gold`, `--aim-net-gold-stroke`, `--aim-bandeira-verde` and `--aim-bandeira-vermelho`.
- **Status vs flag (D2, D7).** `TelemetryGreen #10B981` (named `HeraldicGreen` before Koyo's C3 ruling of 2026-10-06; that name now means Verde `#1E5631`) and `CascaisRed #EF4444` stay as telemetry and are never laid out as a pair. In `raid-ui.css`, daisyUI `success` / `error` now use them, and the flag pair stays `primary` / `secondary`.

## Shapes, roles and archetype marks

Added on 2026-10-06 after the rulings of Dr. Burkhardt, Adele and Koyo (`KOYO_RESPONSE_TO_ALAN_Stereotype_Shapes_Height_Standard.md` in AIA `doc/`).

- **The Shape element (`ShapeFigures.ts`).** Every free-standing stereotype Shape is one record: the archetypes it fits, an outline, lines, detail and an optional accent. One renderer draws it on the live canvas and one in the export, so adding a Shape is adding a record.
  - Shapes: Venue (the pin), Stage, Bar on a Place; System on a Person or an Object; **Contract, Law, Court, Certificate, Checklist** on an Object.
  - Every Shape stands as tall as the Person's bust (lines from y = 8 to y = 54), at the bust's 2.2 line weight, with the Class and the name beneath it. The Stage is now 56 × 48 (it was 41 × 38) and the System has three bays.
  - Both flag halves are the Shape's own outline cut at the seam. The hand-drawn right halves of Venue, Stage, Bar and System are gone.
  - An Object with a Shape stands free; a plain Object, or one that shows a description, stays a card.
  - Exports: `SHAPE_FIGURES`, `getShapeFigure`, `shapeFigureOf`, `shapeFigurePlacement`, `renderShapeFigureSvg` (also draws a Shape reduced, for chips and badges).
- **Object state.** New node field `state` ↔ `aim-state`. A Contract shows a gold pen when `ReadyToSign` and a status-green tick when `Approved`.
- **A Place stands as the pin.** The pin on the ground is the Place archetype's own silhouette, as the bust is the Person's. Any Place without a Stage or Bar draws it. `addNode` no longer forces `Venue` on a new Place.
- **Object cards fold a corner.** A 12-unit folded top-right corner with its flap, on the canvas and in the export. An awakened card's door stops at the fold.
- **Roles and role slots.** `slot` ↔ `aim-slot` and `restriction` ↔ `aim-restriction`; a slot shows its role name with `: <Class>` beneath, never underlined. RoleFiller (`rf`) is no longer offered; legacy files still load. New callback `onNodeArchetypeChange(node, from, to)`, which a host can veto.
- **The Generic Role** is a grey dashed ring as tall as the bust (46 across; it was a 22-unit black circle). It is the same ring on load and after a trip to another category and back.
- **Several glyphs per node (CR053).** `aim-stereotype-glyph` is an ordered list of up to five. On a card the extra badges form a row 16 in from the right edge, 3 apart, clear of the fold. Beside a Shape every glyph is a side badge.
- **Token names (Koyo C3).** `CascaisPalette.HeraldicGreen` is now Verde `#1E5631`, the colour the workbench calls `--heraldic-green`. The emerald `#10B981` is `TelemetryGreen`.
- **Inspector.** "Step Through" wears Vermelho and "Duality active" Verde. The stencil and the archetype selector say "Place".

## Fixes

- The duality was reversed: emerald sat on the right (fly) and nothing on the left (hoist).
- `doc/DualityOfTheObject.md`: the Activity row now says *red = execution*, which matches the code.
- The portal chevron sat a node-width too far right on Venue, Stage, Bar and System: the shape's default right-edge offset was still added to the new position.
- Selecting a second node left the previous node's stereotype field in the Inspector (two sibling fields shared one React key).
- The Bar's bowl had no left edge.
- The chevron never brightened on hover. The rule `.aim-node:hover .aim-portal-chevron` could not match: `.aim-node` is on the body shape, a sibling of the chevron rather than its parent, and the chevron takes no pointer events. The same applied to `.aim-node:hover .aim-portal-door`. Both are replaced by door-driven rules.

## Notes for integrators

- **Breaking (CSS).** `.aim-portal-persona` and `.aim-portal-door` no longer set a base `fill`. The per-material wash comes from the shape attrs. A host stylesheet that set these fills now overrides the materials; remove such rules.
- **Changed value.** The exported `CascaisPalette.NetGold` was amber `#F59E0B` in 0.10.0 and is now `#D4AF37`. A host that drew lines with it should switch to `CascaisPalette.NetGoldStroke`. `CascaisPalette` now lives in `CascaisTheme.ts`, and the package root re-exports it as before.
- **`onNodeClick` semantics.** For a linked node this is tap 2 on the left half, not tap 1. A host that opened its inspector on `selection:changed` should move that to `onNodeClick` (D9). An always-visible rail may still update silently on selection.
- **Breaking (tokens).** `CascaisPalette.HeraldicGreen` changed from `#10B981` to `#1E5631`. A host that used it as a status colour should switch to `TelemetryGreen`. `DualityWashStrength` has new keys (`verde`, `vermelho`, `hover`, `chevron`); the per-material keys are gone.
- **Changed drawings.** Venue, Stage, Bar and System are drawn by the Shape element at 2.2 line weight. A Place without a stereotype is now the pin, not a framed card. A host that sized Place or shaped-Object nodes as cards should use 120 × 110.
- **Removed.** `getStereotypePaths` still serves the small card icons; the frameless drawings no longer come from it.
- **aia-workbench.**
  - It already emits `aim-kind="plc"`, `aim-slot`, `aim-restriction`, `aim-state` and `fills: <Role>` edges (AIA commit `a731dcd`); 0.9.0 ignores what it does not know.
  - Bump to 0.11.0 in the same release as the `globals.css` civic-stripe flip (`--civic`, `--civic-v` green then red).
  - `globals.css` gains `--net-gold-stroke: #ab8722` for 1px lines on light grounds; `.proposal` uses it. The 3px accent bars (`.turn.person`, `.stencil-uc`) are colour fields and keep `--net-gold`.

## Validation

- `pnpm -r run build`: library and Studio pass.
- `node --test test/` (packages/canvas): 203 tests pass, 0 failures/skips. Besides the CR055 tests:
  - `shapeElement.test.mjs`: the Shape records (height, symmetry, box), which node stands as a Shape, Contract states, the one renderer live and in the export, archetype marks
  - `canvasMount.test.mjs`: archetype veto, the Generic Role round trip, a new Place without a stereotype
  - `x6Render.test.mjs`: chevron position beside every Shape, through a real X6 graph in JSDOM
- `pnpm -r run lint`: both packages pass.
- Browser check (2026-10-06, Studio on localhost:5198): the flag halves on Venue and Stage, the chevron position, the Generic Role ring, the folded corner and the pin on plain Places were looked at in Chrome. Not yet looked at in aia-workbench, which still pins 0.9.0.
