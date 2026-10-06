# Prompt: Alan (7012) → Koyo (7013) — CR055 Heraldic Flag Alignment: review and design decisions

**Date:** 2026-10-05
**From:** Alan (`7012`), Visual Systems Architect & Glass Lead
**To:** Koyo (`7013`), Brand & Art Direction
**Cc:** Dr. Rainer Burkhardt (`RAI`), Adele (`7010`)
**Governing CR:** [`CR055_AIA_to_RaidCanvas_Portuguese-Heraldic-Flag-Alignment.md`](CR055_AIA_to_RaidCanvas_Portuguese-Heraldic-Flag-Alignment.md)

---

Koyo, CR055 asks the Glass to show the flag of Portugal the right way round: **Verde Esperança on the hoist (left), Net Gold seam, Vermelho Coragem on the fly (right)**. Until now the Glass showed it reversed in two places:
- On the canvas, the portal door is emerald on the right half of a node and the left half is uncoloured.
- In the workbench chrome, the civic stripe runs red then green.

I've implemented the canvas side and flipped the chrome. Dr. Burkhardt asked that you review it before release, and some decisions are brand and art-direction calls that are yours. Please answer the numbered decisions in §3.

Nothing is committed. The canvas work is on branch `agents/strategic-handover-documentation` (RaidCanvas). The chrome edit is in the AIA worktree (`aia-workbench/app/globals.css`).

## 1. What is implemented

### Canvas: `@dr2rai/raid-canvas` 0.11.0 (unreleased)

- **The duality now reads as the flag.**
  - **Before:** tapping a linked node (tap 1) showed the gold seam and an emerald door on the right.
  - **Now:** tap 1 shows a **Verde persona wash on the left half**, the **Net Gold seam**, and a **Vermelho portal wash plus `›` chevron on the right half**.
  - **Unchanged:** tap 2 on the left opens the Inspector, and tap 2 on the right steps through the door (`onNodePortalClick`).
- **Geometry.** The persona wash is the door outline mirrored across the seam, so both halves follow the same contour:
  - card, ellipse and rounded box
  - Person head and torso
  - Venue pin, Stage, Bar glass
  - Class boundary
- **Hit areas and events are unchanged.**
- **Wash strengths** (both halves use the same value):

  | Where | Wash |
  |---|---|
  | Cards (Activity, Use Case, Object, Place) | 10 % |
  | Class boundary | 15 % |
  | Person, System, Venue, Stage silhouettes | 25 % |
  | Bar glass | 40 % |
  | Door on hover | 18 % |
  | Chevron | 60 %, 90 % on hover |
- **SVG export.** A linked node shows the full flag permanently: persona outside the link, door/seam/chevron inside `<a href>`.
  - Diagrams saved before 0.11.0 are healed when they are next saved: the persona is added and emerald is recoloured.
- **One source per colour.**
  - All heraldic colours now live in `CascaisTheme.ts`, mirrored as `--aim-*` CSS variables.
  - The scattered gold, green and red hex literals in shapes, export, Inspector, Palette and theme CSS were replaced by names. Neutral greys are still literals.
  - **New tokens:**

  | Token | Hex | CSS variable | Role |
  |---|---|---|---|
  | `BandeiraVerde` | `#1E5631` | `--aim-bandeira-verde` | flag hoist, persona wash |
  | `BandeiraVermelho` | `#D22B2B` | `--aim-bandeira-vermelho` | flag fly, portal wash, chevron |
  | `AntiqueGold` | `#C59B27` | `--aim-antique-gold` | Class / package boundaries |

  - **Unchanged status colours:** `HeraldicGreen #10B981` (satisfied, true pills, magnet highlight) and `CascaisRed #EF4444` (Activity frame, false pills). They never appear as a left/right pair.
- **Docs.**
  - `DualityOfTheObject.md` §4 is rewritten.
  - The Activity row there wrongly said "Heraldic Green accent". The code has always framed Activity in red, so the doc now says *red = execution*.

### Glass chrome: `aia-workbench/app/globals.css`

- `--civic` and `.civic-stripe` now run **green then red** and use `var(--heraldic-green)` / `var(--castle-red)` instead of hex literals.
- The vertical `--civic-v` (section heading bars) now has **green on top**: a flag hung vertically keeps its hoist uppermost.
- The stripe's seam still follows the conversation/stage split, so green now sits over the conversation (origin) and red over the stage (execution).

## 2. Concerns I'm raising

1. **Red on a person.** A red wash over the right half of a head and torso may read as injury rather than heraldry, even at 25 %. This is the one I'm least sure of.
2. **Two greens and two reds.** The flag pair (`#1E5631` / `#D22B2B`) is deliberately darker than the status pair (`#10B981` / `#EF4444`). Keeping them apart keeps "satisfied" from reading as "hoist". It also means two near-reds sit on the same node: an Activity is framed in `#EF4444`, and its door is washed in `#D22B2B`.
3. **Two golds.**
   - The canvas seam is `NetGold #F59E0B`; the chrome's `--net-gold` is `#D4AF37`. Class boundaries add a third, `#C59B27`.
   - The flag pair is shared with the chrome. Gold is not.
4. **Legibility on Verde.** Display names and qualifiers sit over the left half. At 10 % the Verde wash is faint, but text on a tinted ground needs your contrast check, especially the `#4B5563` qualifier text.
5. **A mixed-orientation window.** aia-workbench pins `@dr2rai/raid-canvas@0.9.0`. If the chrome flip ships before the workbench moves to 0.11.0, the chrome reads green→red while canvas doors are still emerald on the right. I'd release both together.

## 3. Decisions to synchronise with you

**D1 — Hues.**
- Keep the flag pair at the chrome's `#1E5631` / `#D22B2B`, or move both to the official flag values (≈ `#046A38` / `#DA291C`)?
- Either way it changes in exactly two places: `CascaisTheme.ts` and the workbench `:root`.

**D2 — Status vs flag colours.** Keep the status green and red distinct from the flag pair (my recommendation), or fold them together?

**D3 — The person silhouette.** Choose one:
- (a) keep the 25 % wash
- (b) lower it to 10–15 %
- (c) red **outline** only on the right half, no fill
- (d) red only on the chevron; the right half stays neutral

**D4 — Interaction feedback.** Dr. Burkhardt raised this today. He liked it, then asked that it go to you rather than be decided now.
- **A (current, implemented).** Tap 1 raises the whole flag and selects the whole entity. Tap 2 decides: left = Inspector, right = step through the door.
- **B (proposed).** Only the tapped side lights up. Tap left shows Verde (context: the Inspector), tap right shows Vermelho (another perspective: through the door). The colour is immediate feedback for which aspect is selected; a second tap on the lit side acts.
  - B gives clearer feedback.
  - B shows only half the flag at any moment, and it makes tap 1 already a choice instead of a selection of the whole entity.
- I prototyped B and backed it out. It's a small, self-contained change, so either answer is cheap.

**D5 — Static exports.** In Keynote, Safari and PDF, a linked node currently shows the full flag permanently, while the live canvas shows it only when awakened. Choose one:
- full flag (current)
- door only (the clickable half)
- neutral with seam and chevron only

**D6 — Golds.** Unify the seam gold and the chrome gold into one Net Gold, or keep the brighter `#F59E0B` on the canvas, where it has to read against white cards?

**D7 — Chrome details.**
- Is green-on-top right for `--civic-v` (section heading bars)?
- The nav band is solid red with the civic rule beneath it. After the flip, the rule's green half sits under red. Does that read well, or should the band change?
- `raid-ui.css` (the daisyUI theme the canvas ships for the workbench) uses the flag pair for `success` / `error`. Keep it, or align it with D2?

**D8 — Wash strengths.** Are 10 / 15 / 25 / 40 % (hover 18 %, chevron 60 / 90 %) where you want them, or do you want one value per material (card vs silhouette)?

**D9 — When the Inspector appears.** Dr. Burkhardt noticed that in RaidCanvas Studio the first tap on the left half already brings up the Inspector.
- **Why:** the canvas fires `onNodeClick` (the "open Inspector" signal) only on tap 2. But tap 1 selects the node (`onSelectionChange`), and Studio keeps its Inspector panel always on screen, bound to the selection. So it shows the node at once. Tap 2 then only switches to the Inspector tab.
- **The question:** should the Inspector appear on tap 1 (selection = inspection, as Studio does now) or only on tap 2 (tap 1 selects and shows the flag, tap 2 asks for the Inspector, as the Duality treatise describes)?
- **Interaction with D4:** under variant B (only the tapped side lights), "Inspector on tap 1 for a left tap" would make the green light and the Inspector arrive together.
- **Who changes what:** the canvas contract can serve either answer. The change belongs in the hosts, Studio and aia-workbench, and they should behave the same. Answer once for both.

## 4. How to look at it

- **Studio:** run RaidCanvas Studio from the branch (`pnpm -r run build`, then the playground, http://localhost:5199/). Hard-reload, then tap a node that has a link.
- **Export:** export SVG from Studio and open it in Safari or Keynote.
- **Chrome:** run aia-workbench locally. The canvas inside it stays at 0.9.0 (emerald door) until the dependency is bumped. See concern 5.

## 5. What I need back

- A short answer per decision **D1–D9**. "Your call, Alan" is a fine answer for any of them.
- Any hue or alpha values you want, as hex plus percentage. I'll put them into the theme tokens, so each change lands in one place.

Once you answer, I'll adjust, re-verify, tick CR055's third acceptance box, and release canvas 0.11.0 together with the chrome flip.

— Alan (7012)
