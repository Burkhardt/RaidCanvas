# RaidCanvas 0.13.1 — Activity states visible on the live canvas

Date: 2026-10-17 · Package: `@dr2rai/raid-canvas@0.13.1`

## Fix

- **0.13.0 drew every Activity red on the live canvas.** The theme stylesheet (`src/styles/aoaim-theme.css`, served as `@dr2rai/raid-canvas/styles`) still gave `.aim-act` a white fill, a Cascais Red stroke and a 2px width. In SVG a CSS rule beats a presentation attribute, so the state look that `ActivityStates` sets on each Activity's frame was overridden. The exported SVG was right, because its frame carries no class; so were the tests, because jsdom applies no CSS. Found in aia-workbench on RAI's tenant: a Done Activity had `fill="#D1FAE5" stroke="#AB8722"` and computed white and red.
- The rule now sets only the corner radius. A new test reads the stylesheet and fails if any `.aim-act` rule sets fill, stroke or stroke width again.

Nothing else changes.
