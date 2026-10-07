# RaidCanvas 0.11.0 — The flag of Portugal in the Duality of the Object (CR055)

Date: 2026-10-06 · Package: `@dr2rai/raid-canvas@0.11.0`

Not yet published. Governing change request: CR055 (AIA → RaidCanvas, Portuguese Heraldic Flag Alignment). Art direction: Koyo, *The Glass Guide* (decisions D1–D9). The assessment of affected components across RaidCanvas and aia-workbench is in [CR055_Assessment_RaidCanvas_Heraldic-Flag-Alignment.md](CR055_Assessment_RaidCanvas_Heraldic-Flag-Alignment.md).

**Ship together with the aia-workbench bump** (`@dr2rai/raid-canvas` 0.9.0 → 0.11.0) and its civic-stripe flip. Released apart, the chrome would read green→red while the canvas still reads the old way.

## Changes

- **Flag bicolour.** An awakened linked node now reads Verde Esperança (left, the Persona) · Net Gold seam · Vermelho Coragem (right, the Portal):
  - Every archetype has a new `persona` selector: the door path mirrored across the seam, washed in `BandeiraVerde #1E5631`.
  - The door and the `›` chevron are washed in `BandeiraVermelho #D22B2B`.
  - Resizing an awakened node re-derives both halves.
- **Wash strengths per material (Koyo D8).** New export `DualityWashStrength`:

  | Material | Strength |
  |---|---|
  | card, person | 0.10 |
  | boundary (Class) | 0.15 |
  | silhouette (System / Venue / Stage) | 0.15 |
  | bar | 0.18 |
  | chevron | 0.70 (100 % on hover) |

  Door hover is 18 % (`hover: 0.18`).
- **The Person raises the whole flag too.** Head and torso take Verde on the left and Vermelho on the right at 10 %, card-level subtlety, so the figure reads as tinted, not cut. Koyo revised D3 after Dr. Burkhardt saw that an unwashed Person looked unselected. A Person with stereotype `System` is a rack and is washed as a silhouette (15 %).
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

## Fixes

- The duality was reversed: emerald sat on the right (fly) and nothing on the left (hoist).
- `doc/DualityOfTheObject.md`: the Activity row now says *red = execution*, which matches the code.
- The chevron never brightened on hover. The rule `.aim-node:hover .aim-portal-chevron` could not match: `.aim-node` is on the body shape, a sibling of the chevron rather than its parent, and the chevron takes no pointer events. The same applied to `.aim-node:hover .aim-portal-door`. Both are replaced by door-driven rules.

## Notes for integrators

- **Breaking (CSS).** `.aim-portal-persona` and `.aim-portal-door` no longer set a base `fill`. The per-material wash comes from the shape attrs. A host stylesheet that set these fills now overrides the materials; remove such rules.
- **Changed value.** The exported `CascaisPalette.NetGold` was amber `#F59E0B` in 0.10.0 and is now `#D4AF37`. A host that drew lines with it should switch to `CascaisPalette.NetGoldStroke`. `CascaisPalette` now lives in `CascaisTheme.ts`, and the package root re-exports it as before.
- **`onNodeClick` semantics.** For a linked node this is tap 2 on the left half, not tap 1. A host that opened its inspector on `selection:changed` should move that to `onNodeClick` (D9). An always-visible rail may still update silently on selection.
- **aia-workbench.**
  - Bump to 0.11.0 in the same release as the `globals.css` civic-stripe flip (`--civic`, `--civic-v` green then red).
  - `globals.css` gains `--net-gold-stroke: #ab8722` for 1px lines on light grounds; `.proposal` uses it. The 3px accent bars (`.turn.person`, `.stencil-uc`) are colour fields and keep `--net-gold`.

## Validation

- `pnpm -r run build`: library and Studio pass.
- `node --test test/` (packages/canvas): 145 tests pass, 0 failures/skips. New or rewritten tests:
  - flag pair and wash-strength tokens
  - per-material door and persona washes
  - the Person flag at 10 %
  - door-driven press and hover rules, live and exported
  - Verde press and hover on the persona, and the `aim-inspectable` wrapper class only with `onNodeClick`
  - no ungated `:hover` in the theme CSS or in exported SVGs
  - exports at rest
  - the one-time heal in `updateExistingSvg`
  - in `x6Render.test.mjs`, the persona mirror on a card and on a Person rendered through a real X6 graph in JSDOM
- `pnpm -r run lint`: both packages pass.
- Browser check: not yet done after these fixes, in Studio or in aia-workbench. Dr. Burkhardt observed the earlier build in Studio (localhost:5199), which is how the dead hover rule and the unwashed Person surfaced. CR055 acceptance box 3 waits on a fresh look.
