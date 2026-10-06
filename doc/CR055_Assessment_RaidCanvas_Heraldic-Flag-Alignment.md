# CR055 Assessment: Portuguese Heraldic Flag Alignment in the Glass

**Date:** 2026-10-06
**Author:** Alan (`7012`), Visual Systems Architect & Glass Lead
**Governing CR:** [`CR055_AIA_to_RaidCanvas_Portuguese-Heraldic-Flag-Alignment.md`](../../AIA/doc/CR055_AIA_to_RaidCanvas_Portuguese-Heraldic-Flag-Alignment.md) (AIA `doc/`)
**Art direction:** Koyo (`7013`), [`Koyo-TheGlass-Guide.md`](../../AIA/doc/Koyo-TheGlass-Guide.md), answering [`PROMPT_ALAN_TO_KOYO_CR055_Heraldic_Flag_Alignment.md`](PROMPT_ALAN_TO_KOYO_CR055_Heraldic_Flag_Alignment.md)
**Release:** `@dr2rai/raid-canvas` 0.11.0, together with the aia-workbench dependency bump (see [ReleaseNotes0.11.0.md](ReleaseNotes0.11.0.md))

---

## 1. Acceptance

I accept CR055. The Glass showed the flag of Portugal reversed in two places:

- **Canvas.** An awakened linked node had its emerald door on the right (fly) and nothing on the left (hoist).
- **Chrome.** aia-workbench's civic stripe ran red, then green.

Both now read **Verde Esperança (hoist, left) · Net Gold (seam) · Vermelho Coragem (fly, right)**. That fits the Duality of the Object: the left is the Persona (context, inspection, where you stand) and the right is the Portal (execution, where you go).

## 2. Affected components

### RaidCanvas (`@dr2rai/raid-canvas`)

| Component | Change |
|---|---|
| `CascaisTheme.ts` (new) | The single source for every heraldic colour: `CascaisPalette` (moved here from `X6Shapes.ts`), `withAlpha`, `HeraldicWash`, `DualityWashStrength`. Adds the flag pair `BandeiraVerde #1E5631` and `BandeiraVermelho #D22B2B`. The gold family is `NetGold #D4AF37` (fills) and `NetGoldStroke #AB8722` (lines). |
| `X6Shapes.ts` | A new `persona` selector on every archetype: the door path mirrored across the seam, painted Verde. Doors and chevrons are painted Vermelho. Washes come from `DualityWashStrength`; a Person takes the flag across head and torso. Resizing an awakened node re-derives the persona too. Golds are split into fill and stroke. |
| `RaiBridge.ts` | The SVG export shows the node at rest: an unpainted door inside `<a>`, the Net Gold seam and a Vermelho chevron. `updateExistingSvg` heals older SVGs. |
| `RaidCanvas.tsx`, `StereotypeIcons.ts`, `RaidInspector.tsx`, `RaidPalette.tsx` | Hex literals replaced by palette names. Lines and borders use `NetGoldStroke`. |
| `styles/aoaim-theme.css` | The `--aim-*` mirror: `--aim-net-gold`, `--aim-net-gold-stroke`, `--aim-bandeira-verde`, `--aim-bandeira-vermelho`. The persona and door rules no longer force a fill, so the per-material washes apply. Chevron is 70 % at rest. Pressing the door (the whole right half), or hovering it with a mouse or trackpad, raises the door to 18 % and the chevron to 100 %; exports carry the same rules on their `<a>`. Hover rules are gated to cursor devices. |
| `styles/raid-ui.css` | daisyUI `success` and `error` move to the telemetry pair (`#10B981`, `#EF4444`); the flag pair stays `primary` and `secondary`. |
| Studio (`apps/playground`) | The Inspector tab comes forward on `onNodeClick`, not on selection. Presets no longer carry amber. |
| `doc/DualityOfTheObject.md`, `packages/canvas/README.md` | Rewritten for the flag. The Activity row now says *red = execution*, which matches the code. |

### aia-workbench (Glass chrome)

| Component | Change |
|---|---|
| `app/globals.css` | `--civic`, `--civic-v` and `.civic-stripe` run green, then red (green on top when vertical), from `var(--heraldic-green)` and `var(--castle-red)` instead of hex literals. |
| `app/globals.css` | New `--net-gold-stroke: #ab8722` for 1px lines on light grounds; `.proposal` uses it. The 3px accent bars (`.turn.person`, `.stencil-uc`) are colour fields and keep `--net-gold`. |
| `package.json` | Must move from `@dr2rai/raid-canvas@0.9.0` to 0.11.0 in the same release as the chrome flip. Otherwise the chrome reads green→red while canvas doors are still emerald on the right. |

## 3. Design decisions (Koyo D1–D9)

| # | Question | Decision | Implemented as |
|---|---|---|---|
| D1 | Flag hues | Keep the Cascais tokens `#1E5631` / `#D22B2B`, not the raw Pantone flag values. | `BandeiraVerde`, `BandeiraVermelho` = chrome `--heraldic-green`, `--castle-red` |
| D2 | Status vs flag | Keep them distinct. Heraldry is structure; status is telemetry. | `HeraldicGreen #10B981`, `CascaisRed #EF4444` unchanged |
| D3 | Person silhouette | First: the human figure stays whole. Revised (see §4): the whole flag at 10 %, so a selected Person does not look inert. | Verde persona and Vermelho door across head and torso at `DualityWashStrength.person` 0.10. A System rack is washed as a silhouette (15 %). |
| D4 | Whole flag vs tapped side | Whole flag on tap 1. Tap 2 commits: left = Inspector, right = step through. | Unchanged canvas lifecycle |
| D5 | Static exports | Neutral, with Net Gold seam and Vermelho chevron only. | No persona; door `fill` at alpha 0 inside `<a>`; chevron Vermelho 70 %; heal on save |
| D6 | Golds | One family. `#D4AF37` for fills, a denser gold for seams and hairlines (first `#C59B27`, revised to `#AB8722`, see §4). Drop `#F59E0B`. | `NetGold`, `NetGoldStroke`; `--aim-net-gold`, `--aim-net-gold-stroke`. `NetGold` was amber `#F59E0B` in 0.10.0. |
| D7 | Chrome | Green on top for `--civic-v`. Keep the red nav band over the green-then-red rule. daisyUI success/error use telemetry tokens. | `globals.css` as above; `raid-ui.css` |
| D8 | Wash strengths | Cards 10 %, Class 12–15 %, System/Venue/Stage 12–15 %, Person 10 % (revised from 0 %), Bar 15–18 %, door hover 18 %, chevron 70 % / 100 %. | `DualityWashStrength`: card 0.10, boundary 0.15, silhouette 0.15, bar 0.18, person 0.10, chevron 0.70, hover 0.18. Where Koyo gave a range, I took the upper bound. |
| D9 | When the Inspector appears | On tap 2. Tap 1 is selection and awakening. An always-visible rail may update silently on tap 1. | Studio switches to the Inspector tab on `onNodeClick` only. Edges still come forward on selection, since they have no tap gesture. |

## 4. Revisions after review

These points changed after Dr. Burkhardt looked at the first build in Studio and Koyo answered:

1. **Person wash.** I first read Koyo's D3 strictly and left a Person with no wash on either half. In Studio, an unwashed Person looked broken or unselected next to every other node raising the flag. Koyo's ruling: fill both halves at 10 %, the card strength. At that level the Vermelho half is a tint on Chalk White, not an injury; the earlier concern came from the old 25 % wash.
2. **Chevron hover.** The chevron never brightened. The rule `.aim-node:hover .aim-portal-chevron` could not match: `.aim-node` is on the body shape, a sibling of the chevron rather than its parent, and the chevron takes no pointer events. The same was true of `.aim-node:hover .aim-portal-door`, so only a direct door hover ever worked. Following Koyo, the door now drives both: `.aim-portal-door:hover ~ .aim-portal-chevron` on the canvas, `a:hover > …` in exports.
3. **Stroke gold.** Koyo's first pick, `#C59B27`, measures 2.35:1 on Calçada `#F4F4F0`, below the WCAG 1.4.11 minimum of 3:1 for lines; she had estimated ≈ 3.1. Koyo adopted `#AB8722`: the same hue, 3.06:1 on Calçada and 3.38:1 on white. It is `NetGoldStroke` in the canvas, `--aim-net-gold-stroke` in `aoaim-theme.css` and `--net-gold-stroke` in the workbench chrome.
4. **Hover is never load-bearing.** The iPad is the primary target and has no hover (Koyo, confirmed by Adele as a product rule). Every affordance is visible after tap 1. Pressing the door (`:active`) gives the 18 % / full-chevron feedback on any input. Every `:hover` rule in `aoaim-theme.css` and in exported SVGs sits behind `@media (hover: hover) and (pointer: fine)`, and a test keeps it that way. The Palette's hover tint reacts to `pointerType === 'mouse'` only.
5. **The left half answers too.** Dr. Burkhardt asked for the same feedback on the left, in Verde, wherever a left tap changes something. Pressing the persona, or hovering it with a cursor, raises it to 18 % Verde. It does so only when the host passes `onNodeClick`: RaidCanvas then marks its wrapper `aim-inspectable`. Without `onNodeClick`, a left tap does nothing, so the left half stays quiet. The persona now takes pointer events; tap 2 on it still routes to `onNodeClick`.

## 5. Open items

- **Ports on touch** (§6): decide how edges are drawn on the iPad.
- **Text over the halves.** The name, qualifier and glyph lie above the persona and the door and take pointer events. A press or hover that lands on the name gives no feedback on either half, and the name sits in the middle where fingers land. Tap routing is unaffected, since it goes by the tap's x position. Fix: let node text pass pointer events through to the half beneath. That needs a class on the text elements first.
- **Bar.** The Bar's rest wash (18 %) equals the press and hover level (18 %), so the Bar shows no feedback on either half. Koyo's range was 15–18 %; resting at 15 % would restore a visible step.
- **Pressing** relies on `:active` reaching the SVG path while X6 handles `mousedown`/`touchstart`. The door already depends on this, but neither half has been tried on an iPad.
- **Release:** publish canvas 0.11.0 and bump aia-workbench in one step (Koyo §3). This needs Dr. Burkhardt's go-ahead.
- **CR055 box 3** ("renders with Green on the left and Red on the right"): verified in code and in the X6/JSDOM render tests. It still needs a fresh browser look in Studio and in the workbench after the bump.

## 6. The one load-bearing hover: ports

Edges are drawn only from port magnets, and ports appear only on `node:mouseenter` (`configureAimGraph`) and on CSS hover. That is load-bearing hover. On an iPad it happens to work: Safari fires compatibility mouse events after a tap, so a tapped node shows its ports and keeps them until something else is tapped. That accident is not a design, and it breaks if X6 or WebKit changes the compatibility events. Proposal: show the ports of the selected node (tap 1) and keep `mouseenter` as cursor polish. That adds four magnets to the awakened flag, so Koyo should weigh in before I build it.
