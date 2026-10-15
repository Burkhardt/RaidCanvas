# Handover: Glass (Alan, 7012), state after the Claude App session of 2026-10-06

**From:** Alan (7012), Visual Systems Architect and Glass Lead
**To:** the next Alan session, and Zébio (7011) for CR056
**Branch:** `agents/strategic-handover-documentation`, checked out directly in `/Users/RSB/Projects/GitHub/RaidCanvas`
**Package:** `@dr2rai/raid-canvas` 0.11.0, published to npm on 2026-10-06 by RAI (tag `v0.11.0`). aia-workbench is on 0.11.0 (AIA commit `a7f24b9`).
**Release notes:** `doc/ReleaseNotes0.11.0.md` is the full account of what 0.11.0 contains.

## Standing rules

- I am **Alan (7012)**: not Zébio, not Adele.
- **Publish to npm only on RAI's explicit go.** Version numbers are Alan's to set; 1.0.0 is reserved for the complete product running in AIA 1.0.0. Commit when asked.
- **Never drive the shared Studio.** Start your own from the main checkout instead (AIA `.claude/launch.json`, entry `raid-studio`, port 5198).
- **No repeated hex literals:** use `CascaisPalette` and the theme tokens.
- **Never rename CR files.** Use they/them when someone's pronouns are not stated.
- **RAI's Shape standard:** the Person bust and the Place pin set the height; vectors only; one reusable element, no code per icon; the pictogram files are not the quality bar.

**Verification**, from the repository root:
1. `pnpm -r run build`
2. `pnpm -r run lint`
3. `cd packages/canvas && node --test test/` (203 tests; they run against `dist`, so build first)

## What 0.11.0 holds

- **CR055:** the flag of Portugal in the Duality. Verde wash 20 %, Vermelho 12 % (Koyo's second ruling).
- **CR053:** up to five glyphs per node.
- **Roles:** slots (`aim-slot`, `aim-restriction`), the Generic Role as a grey dashed ring at bust height, `onNodeArchetypeChange` with veto.
- **The Shape element** (`packages/canvas/src/ShapeFigures.ts`): Venue, Stage, Bar, System, Contract, Law, Court, Certificate, Checklist, one record each, one renderer live and one in the export. Adding a Shape is adding a record.
- **Object state:** `state` ↔ `aim-state`; a Contract shows a pen when ReadyToSign and a tick when Approved.
- **Archetype marks:** a Place with no Stage or Bar stands as the pin (no stereotype needed); Object cards have a 12-unit folded corner.
- **Tokens:** `HeraldicGreen` is Verde `#1E5631`; the emerald is `TelemetryGreen`.

## aia-workbench (AIA repo, commits `a731dcd` and `a7f24b9`)

`lib/aimSvg.ts` emits what 0.11.0 reads: `aim-kind="plc"`, the Class on the upper line, `fills: <Role>` edges pointing from the filler, `aim-slot` and `aim-restriction` on 1UCC slots, `aim-state`, and a radial layout for Activity and object projections.

## Since then (2026-10-14)

- **0.12.0, not published:** the edge grammar (`EdgeGrammar.ts`): one table for every edge, live and exported, with the Activity triad «invokes» (dashed, open arrow), «spawns» (dashed, hook at the start, open arrow), «precedes» (solid, open arrow). Studio preset *Activity Chaining*. 215 tests.
- **Proposal** for navigation into child Activities and the Living Stage editor and debugger: `AIA/doc/PROPOSAL_ALAN_Activity_Chaining_Navigation_and_Living_Stage_Editor.md`. Waiting on answers to its §6 (the `this.exec` clash in ADR-0010, the debugger relay, touch-first navigation, publishing 0.12.0, a CR to Zébio for projecting the relations).

## Open

1. **A publish workflow.** Agreed with RAI: a GitHub Action that builds, tests and publishes on a version tag. RAI adds the npm token as a repository secret. Until then RAI publishes by hand as `dr2rai`; the registry takes about five minutes to show a new version.
2. **In the workbench, now that it is on 0.11.0:**
   - size shaped nodes 120 × 110 in `SIZES` (a Contract arrives at card size today and is clamped by the canvas);
   - bucket moves: `onNodeArchetypeChange` on a slot moves the role key via `PATCH /api/v1/UseCase/{id}`, refused while a live Activity binds the role. `GET /api/v1/Activity` has no UseCase or role filter, so the guard filters client-side.
3. **CR056 (Zébio):** `AIA/doc/CR056_RaidCanvas_to_AIA_Stereotype-Catalogue-and-Where-Projection.md`. Read §4 first: four facts (`Class`, `State`, `Bucket`, `ValueRestriction`) and the catalogue's fields. The workbench already prefers those facts when present.
4. **Rest of the catalogue increment:** grades from the catalogue endpoint as the canvas's `ontology` override; Inspector chips only for compatible stereotypes, Shapes as a radio group; one stored stereotype list with `aim-stereotype-glyph` merged in; remove `Actor.svg` and `StickFigure`; drop `initiates` from the node chips.
5. **Koyo's Studio items:** replace the navy tab rail with the Calçada panel and gold active tab; replace the emoji chips with reduced Shapes (`renderShapeFigureSvg` with `scale`).
6. **Art details not settled:**
   - the ground under the pin is still the ellipse; Koyo's §5.2 describes a straight baseline with three hatched ticks;
   - badges in one ink: the pictogram catalogue is full-colour image files and cannot be recoloured when drawn;
   - the dashed outline of an unfilled role: keep or drop.
