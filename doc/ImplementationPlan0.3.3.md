# RaidCanvas v0.3.3 Implementation Plan
## Package Authorship Attribution & CR030 Priority Fix

**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead  
**Target Package:** `@dr2rai/raid-canvas@0.3.3`  
**Date:** 2026-09-15  
**Upstream Collaboration:** Adele (7010) & Zébio (`aia-workbench`)

---

## 1. Context & Objectives

In Sprint 2638, upstream testing by Zébio and Adele in `aia-workbench` confirmed that `@dr2rai/raid-canvas@0.3.2` delivered the full canonical archetype shape serialization (4 head circles, 4 torso paths, 2 instance underlines, and connected edge paths with arrowheads) across 1,032 .NET tests and 130 Vitest tests.

However, upstream testing uncovered two urgent requirements for **v0.3.3**:
1. **Package Authorship Attribution Alignment**:
   As the modern TypeScript heir to Rainer Burkhardt's C++ `GrafObj` library published under the `@dr2rai` namespace, root `package.json` and `packages/canvas/package.json` must declare the formal npm `author` and `contributors` fields. `README.md` and release documents must also reflect this attribution.
2. **CR030 Defect (XML Text & Attribute Escaping in `RaiBridge.ts`)**:
   When nodes or edges contain characters like `&`, `<`, `>`, `"`, or `'` (for instance, the flagship Activity `"AIA Platform Genesis & Bootstrap"`), `DOMParser.parseFromString` fails with `xmlParseEntityRef: no name` and returns a `<parsererror>` node. This results in the loss of that node and all subsequent diagram elements during hydration or re-serialization.

### Critical Constraints
- **Ordering Hazard**: Escaping must occur **strictly after** `wrapAimText` converts `<wbr>` / `<wbr/>` to `\u200B` soft-breaks. Escaping beforehand would convert `<wbr>` to `&lt;wbr&gt;` and cause literal HTML tags to render.
- **Serialization Boundary**: In-memory metamodels (`RaidMetamodel`, `RaidNodeData`, `RaidEdgeData`) must store decoded plain text. Escaping belongs exclusively to the XML serialization layer.

---

## 2. Technical File Changes

### 2.1 Package Metadata & Attribution
- **`package.json` (root)**:
  Add:
  ```json
  "author": "Dr. Rainer Burkhardt <Rainer@Burkhardt.com> (https://github.com/Burkhardt)",
  "contributors": [
    "Alan (7012) <Visual Systems & Canvas Lead>"
  ]
  ```
- **`packages/canvas/package.json`**:
  - Bump `"version": "0.3.3"`.
  - Add identical `author` and `contributors` metadata.
- **`README.md`**:
  - Update header to explicitly credit:
    - Author & Principal Architect: Dr. Rainer Burkhardt
    - Lead Implementation Engineer: Alan (7012)

### 2.2 `packages/canvas/src/RaiBridge.ts`
- Implement `escapeXmlText(str: string): string`:
  Replaces `&` with `&amp;`, `<` with `&lt;`, and `>` with `&gt;`.
- Implement `escapeXmlAttr(str: string): string`:
  Replaces `&` with `&amp;`, `<` with `&lt;`, `>` with `&gt;`, `"` with `&quot;`, and `'` with `&apos;`.
- In `renderSvgText`:
  - Execute `wrapAimText(text)` first.
  - Escape each resulting line using `this.escapeXmlText(line)` before injecting into `<text>` or `<tspan>`.
- In `generateFreshSvg`:
  - Escape all node and edge attribute values (`id`, `displayName`, `stereotype`, `sourcePort`, `targetPort`, `diagramId`, etc.) via `this.escapeXmlAttr`.
  - Escape edge label text via `this.escapeXmlText(edge.label)`.
- In `updateExistingSvg`:
  - Shape fragments parsed via `parser.parseFromString` now receive well-formed escaped XML from `renderNodeInnerSvg`, preventing `<parsererror>` exceptions.
- Export `escapeXmlText` and `escapeXmlAttr` as utility functions.

### 2.3 `packages/canvas/src/index.ts`
- Re-export `escapeXmlText` and `escapeXmlAttr`.

### 2.4 `packages/canvas/test/canvas.test.mjs`
- Implement 5 acceptance test suites for CR030:
  1. Ampersand round-trip (`"AIA Platform Genesis & Bootstrap"`).
  2. Angle bracket sanitization (`"<script>alert(1)</script>"`).
  3. Quote attribute safety (`'the "Lisbon" rehearsal'`).
  4. Multi-node retention (no truncation after special character node).
  5. `<wbr>` soft-break seam compatibility.

---

## 3. Verification Plan

1. `pnpm -r run build && pnpm -r run typecheck`.
2. `pnpm -r run test` (verify all existing 26 tests + new CR030 acceptance tests pass).
3. Confirm clean serialization and re-parsing in DOMParser without `<parsererror>`.
4. Document all delivered items in `doc/ReleaseNotes0.3.3.md`.
