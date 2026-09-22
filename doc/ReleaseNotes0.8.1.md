# RaidCanvas 0.8.1 — Canvas ergonomics

Date: 2026-09-22 · Package: `@dr2rai/raid-canvas@0.8.1`

Published to npm and verified as `latest`. Source commit: `82ad761`.

## Changes

- Direct canvas waypoint selection with larger, stationary hover targets, a persistent selected highlight, and keyboard focus/Enter/Space selection.
- Inspector selected-point deletion, individual P1/P2/P3 deletion and Clear All Bend Points. Geometry changes participate in native X6 undo/redo. Delete/Backspace removes the active waypoint before considering entity deletion.
- Compact DaisyUI routing glyphs: Orthogonal, Straight, Curved. Existing routing callback values remain `manhattan`, `normal`, `smooth`.
- Per-diagram formula visibility, persisted as root `aim-show-expressions`. The `data-aim-show-expressions` spelling is also accepted on input. Legacy SVG defaults to visible. Hidden formulas keep their semantic metadata; restoring geometry history does not override the current visibility preference.
- Formula toggle in the reusable toolbar and the Inspector's canvas settings. Expression labels sit above capsules to avoid collisions on short edges.
- Optional `layoutOnly` canvas mode separates arrangement from semantic mutation through the component UI/handle.
- Inspector tab renamed Expression; Provenance omitted without valid statement records. Empty arrays are no longer expandable disclosures; empty bendPoints show `(auto)`.
- Studio's new first preset demonstrates three conditions and manual vertices. Preset switching retains independent SVG snapshots for the current session.

## Validation

- `pnpm -r run build`: library and Studio pass. Vite reports the existing >500 kB bundle advisory.
- `pnpm -r run test`: 113 tests pass, 0 failures/skips.
- `pnpm -r run lint`: both packages pass.
- Studio browser verification: direct waypoint selection; Inspector deletion and clear-all; undo restores vertices; hidden expressions remain hidden after undo; routing glyphs update immediately; preset switching preserves independent visibility; live SVG retains condition metadata when capsules are hidden. Desktop and narrow pane layouts inspected.

No AIA or aia-workbench code is part of this release. Integration is owned by Zébio.
