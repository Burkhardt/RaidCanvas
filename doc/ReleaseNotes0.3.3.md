# Release Notes: @dr2rai/raid-canvas 0.3.3
## Package Authorship Attribution & CR030 XML Escaping Priority Fix

**Release Date:** September 15, 2026  
**Package:** `@dr2rai/raid-canvas@0.3.3`  
**Git Tag:** [`v0.3.3`](https://github.com/Burkhardt/RaidCanvas/releases/tag/v0.3.3)  
**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead  
**Upstream Collaboration:** Adele (7010) & Zébio (`aia-workbench`)

---

## 1. Delivery Checklist

| Item | Status | Verification & Details |
| :--- | :--- | :--- |
| **Package Authorship Metadata Alignment** | **DELIVERED** | Declared `author` ("Dr. Rainer Burkhardt <Rainer@Burkhardt.com> (https://github.com/Burkhardt)") and `contributors` ("Alan (7012) <Visual Systems & Canvas Lead>") in root `package.json` and `packages/canvas/package.json` |
| **README & Doc Attribution Header** | **DELIVERED** | Explicitly credited Dr. Rainer Burkhardt (Author & Principal Architect) and Alan (7012) (Lead Implementation Engineer) in `README.md`, `doc/ImplementationPlan0.3.3.md`, and `doc/ReleaseNotes0.3.3.md` |
| **CR030: Ampersand Round-Trip** | **DELIVERED** | Flagship Activity `"AIA Platform Genesis & Bootstrap"` serializes to `&amp;` and re-parses with **0 `<parsererror>` nodes**, round-tripping to identical in-memory text |
| **CR030: Angle Bracket Injection Defense** | **DELIVERED** | `"<script>alert(1)</script>"` serializes to `&lt;script&gt;alert(1)&lt;/script&gt;` with 0 injected `<script>` DOM elements |
| **CR030: Quote Preservation in Attributes** | **DELIVERED** | `'the "Lisbon" rehearsal'` escapes quotes as `&quot;` in attributes without attribute truncation |
| **CR030: Multi-Node Retention (No Truncation)** | **DELIVERED** | Diagram with ampersands in Node 1 retains **100% of following nodes and connecting edges** during fresh export and existing SVG updates |
| **CR030: `<wbr>` Seam Compatibility** | **DELIVERED** | `wrapAimText` processes `<wbr>` / `<wbr/>` before XML serialization; renders clean multi-line `<tspan>` elements without literal `wbr` characters |
| **Automated Test Suite** | **PASSED** | **32 / 32 unit tests passing** across 5 test suites (`pnpm -r run test`), including 6 dedicated CR030 acceptance tests |
| **Monorepo Build & Typecheck** | **PASSED** | 0 errors across TypeScript 7.0.2 compiler and Vite bundler |
| **Implementation Plan & Release Notes** | **COMMITTED** | Recorded in `doc/ImplementationPlan0.3.3.md` and `doc/ReleaseNotes0.3.3.md` |

---

## 2. Key Defect Resolution: CR030 XML Text & Attribute Escaping

### A. Context & The Defect
When diagram nodes or edges contained XML special characters (`&`, `<`, `>`, `"`, `'`), such as the flagship Activity `"AIA Platform Genesis & Bootstrap"`:
1. `DOMParser.parseFromString(..., 'image/svg+xml')` in browsers or headless environments encountered an unescaped entity (`xmlParseEntityRef: no name`) and emitted a `<parsererror>` document.
2. In `updateExistingSvg`, the inner shape markup fragment returned a `<parsererror>`, failing to append the node's visual elements.
3. In downstream parsers, the parsing error broke the XML tree, dropping that node and all subsequent nodes and edges in the diagram.
4. Attribute values containing double quotes (e.g. `'the "Lisbon" rehearsal'`) prematurely closed attribute delimiters.

### B. Architectural Fix & Ordering Constraint

#### 1. Standalone XML Escaping Utilities
`RaiBridge.ts` now provides and exports dedicated escaping helpers:
```typescript
export function escapeXmlText(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeXmlAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

#### 2. Critical `<wbr>` Seam Ordering
Escaping in `renderSvgText` occurs **strictly after** `wrapAimText` converts `<wbr>` and `<wbr/>` to `\u200B` zero-width breaks and splits text into lines. If escaping had occurred prior to wrapping, `<wbr>` would have become `&lt;wbr&gt;`, failing regex replacement and causing raw HTML tags to render.
```typescript
const wrapped = wrapAimText(text);
const lines = wrapped.split('\n');
// ...
tspans += `<tspan x="${cx}" y="${y}">${escapeXmlText(line)}</tspan>`;
```

#### 3. Strict Serialization Boundary
The in-memory model (`RaidMetamodel`, `RaidNodeData`, `RaidEdgeData`) retains pure, unescaped text strings (`"AIA Platform Genesis & Bootstrap"`). Escaping is strictly confined to the serialization boundary:
- Attribute string interpolations in `generateFreshSvg` use `escapeXmlAttr`.
- Text node interpolations in `renderSvgText` and edge labels use `escapeXmlText`.
- `updateExistingSvg` validates that parsed fragments contain 0 `<parsererror>` roots before appending to the DOM.

---

## 3. Verification & Acceptance Test Summary

* **Build & Typecheck**:
  ```bash
  pnpm -r run build && pnpm -r run typecheck
  # Output: 0 errors across packages/canvas and apps/playground
  ```
* **Test Suite Execution**:
  ```bash
  pnpm -r run test
  # Output: 32 tests across 5 suites passed (0 failures)
  ```
  - `escapeXmlText and escapeXmlAttr helper functions escape characters correctly`: **PASSED**
  - `Ampersand round-trip: "AIA Platform Genesis & Bootstrap" round-trips with 0 <parsererror> nodes and identical decoded text`: **PASSED**
  - `Angle brackets: "<script>alert(1)</script>" renders literal text without DOM injection`: **PASSED**
  - `Quotes: 'the "Lisbon" rehearsal' keeps attributes valid`: **PASSED**
  - `No node truncation: Diagram with ampersand in the first node retains 100% of following nodes/edges`: **PASSED**
  - `<wbr> seam compatibility: Labels with <wbr> break cleanly without rendering literal wbr characters`: **PASSED**

---

## 4. Upstream Integration Guide (`aia-workbench`)

Adele and Zébio can update to `0.3.3` in `aia-workbench`:

```bash
pnpm update @dr2rai/raid-canvas@0.3.3
```

All diagrams containing special characters, ampersands, and soft-break `<wbr>` tags will now export, update, and re-parse with 100% fidelity in Chrome, Safari, macOS QuickLook/Preview, and downstream SVG renderers.
