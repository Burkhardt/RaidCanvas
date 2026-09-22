# Alan → Zébio: RaidCanvas 0.8.1

Date: 2026-09-22. Scope: Burkhardt/RaidCanvas only.

**Published and verified:** npm serves `@dr2rai/raid-canvas@0.8.1`; its `latest` tag points to `0.8.1`. Implementation commit `82ad761` is pushed to `origin/main`. RAI completed npm security-key authentication.

## Component status

| Component | Status |
| --- | --- |
| RaidCanvas | Selectable and keyboard-focusable waypoints; native geometry history; `setShowExpressions`; `onWaypointSelect`; `onCanvasStateChange.showExpressions`; optional `layoutOnly` |
| RaiBridge | Diagram visibility defaults to true, imports canonical/data-prefixed spelling, exports canonical `aim-show-expressions`; preserves expressions when hidden |
| RaidCanvasToolbar | DaisyUI routing glyph group and optional formula toggle; existing history/viewport controls preserved |
| RaidInspector | Selected-point/individual/all-point deletion; unselected canvas formula switch; Expression label; conditional Provenance |
| RaidPropertyTree | Empty arrays are leaves; bendPoints `[]` displays `(auto)` |
| X6 shapes / theme | Hidden formula projection without semantic loss; separated edge labels; fixed hover transform that displaced vertices |
| Studio | New 0.8.1 showcase on port 5173; direct reuse of package controls; independent per-preset SVG snapshots during the session |
| RaidPalette / other archetypes | Existing 0.8.0 behavior retained |

## Integrate in aia-workbench

1. Consume the published exact 0.8.1 package, retaining both `@dr2rai/raid-canvas/styles` and `@dr2rai/raid-canvas/ui.css` imports.
2. Add `showExpressions` to the local canvas-state value. Wire toolbar/Inspector visibility callbacks to `canvasRef.current?.setShowExpressions(visible)` and render their state from `onCanvasStateChange`.
3. Track `RaidWaypointSelection | null` from `onWaypointSelect`; select/refresh that edge in the host Inspector. Pass the value as `waypoint`. Wire `onUpdateWaypoints(id, points)` to `updateEdge(id, { bendPoints: points })`, then refresh the selected edge snapshot. Supply no mutation callback in viewer mode.
4. Keep 1AOC and 1UCC as separate SVG artifacts. Save the returned SVG unchanged so each retains its own root preference. Visibility is not a separate global user setting and is independent of geometry undo/redo.
5. For authenticated blueprint arrangement, `layoutOnly` allows node movement, routing and vertices while blocking semantic mutations through the component UI/handle. Host inspector mutation callbacks must follow the same policy. `getGraph()` exposes raw X6 and is not a security boundary; enforce authorization on the server.
6. Wire 1UCC SVG saving to the appropriate UseCase endpoint in AIA. Endpoint implementation, Activity.UseCase specialization, package bumping and workbench editability remain your responsibility.

The earlier Roles/Pre/Exec/Post/Close inspector composition is not implemented by this narrowed ergonomics release. Existing contextPanel/headerActions/footer slots remain available for domain context; agree the reusable phase contract with Alan before introducing a workaround in the workbench.

## Verification and limits

113 package tests pass; library and Studio build/lint pass. Vite retains the bundle-size advisory. UI checks cover selected-point deletion, clear-all and undo, direct routing glyphs, and expression persistence. Studio snapshots last until page reload; exported artifacts carry persisted preferences. No Workbench or .NET gates were run because this milestone is confined to RaidCanvas.

Release notes: `doc/ReleaseNotes0.8.1.md`. Zébio can now consume the published version.
