# RaidCanvas 0.12.0 — Activity chaining: «invokes», «spawns», «precedes»

Date: 2026-10-14 · Package: `@dr2rai/raid-canvas@0.12.0`

Not yet published. Asked for in `PROMPT_ALAN_RAID_CANVAS_ACTIVITY_CHAINING_AND_DEBUGGER_EDITOR.md` (Adele and RAI); notation from the Ontology Compendium v1.9 §10.2 (the Triad of Activity relationships). The navigation half of that request and the Living Stage editor are a proposal first: `AIA/doc/PROPOSAL_ALAN_Activity_Chaining_Navigation_and_Living_Stage_Editor.md`.

## Changes

- **The edge grammar (`EdgeGrammar.ts`).** How every edge is drawn is now one table, read by the live canvas and the export alike:

  | Edge | Line | Start | End |
  |---|---|---|---|
  | association | solid | | filled arrow |
  | dependency | dashed `5,5` | | open arrow |
  | generalization | solid | | hollow triangle |
  | realization | dashed `5,5` | | hollow triangle |
  | aggregation | solid | hollow diamond | |
  | composition | solid | filled diamond | |
  | **«invokes»** | dashed `5,5` | | open arrow |
  | **«spawns»** | dashed `5,5` | hook (↪) | open arrow |
  | **«precedes»** | solid | | open arrow |
  | «observes» (ADR-0008) | dash-dot `6,3,2,3` | | filled arrow |

  A stereotype wins over the edge's kind, so `«precedes»` is solid even on a dependency. It is read from `aim-stereotype` first, then from the label, as a whole word with or without guillemets.
- **The relation is named.** An `«invokes»`, `«spawns»` or `«precedes»` edge without a label of its own shows its name in guillemets. A host's label always wins.
- **«spawns» has a hook at its start.** The Compendium calls it a "dashed hooked arrow". A second kind of arrowhead was indistinguishable from `«invokes»` at diagram size, so the hook sits at the source end, like the ↪ sign.
- Exports: `EDGE_KIND_LINES`, `EDGE_STEREOTYPE_LINES`, `EDGE_HEAD_PATHS`, `EDGE_TAIL_PATHS`, `ACTIVITY_RELATIONS`, `edgeStereotypeOf`, `edgeLineOf`, `edgeLabelOf`, `edgeHeadMarkerId`, `edgeTailMarkerId`.

## Fixes

- **A plain dependency looked different live and exported.** The live canvas drew an open arrow, the export a filled one. Both now draw it open.
- **Exported aggregations and compositions had no diamond.** They now carry it at the start of the line.
- `updateExistingSvg` adds any arrowhead or tail marker an older file lacks, so a saved diagram can show a relation drawn after it was saved.

## Notes for integrators

- **Changed drawing:** exported dependencies change from a filled to an open arrowhead, matching what the live canvas always drew.
- **New marker ids** in exported SVGs: `arrow-open`, `tail-diamond-open`, `tail-diamond-filled`, `tail-hook`. `arrow-classic` and `arrow-hollow` keep their ids.
- **aia-workbench:** draws these as soon as the projection sends Activity-to-Activity relationships with `stereotype` set to `invokes`, `spawns` or `precedes`. `«precedes»` is derived by the engine (Compendium §10.2): no Activity holds a pointer to another, so it must be projected, never stored.

## Validation

- `pnpm -r run build` and `pnpm -r run lint`: pass.
- `node --test test/` (packages/canvas): 215 tests pass. New: `edgeGrammar.test.mjs` (reading the stereotype, the line per edge, labels, the live markers, the exported markers and paths, live/export parity, healing older files).
- Looked at, live and exported: Studio has a new preset, *Activity Chaining · «invokes» «spawns» «precedes»*, with the Compendium's own examples. The hook of «spawns» sits above the line at its start in both renderers.
- X6 only draws a custom marker when the merged marker `name` is empty; the edge shape's default `classic` head is cleared for that reason (`name: null`).
