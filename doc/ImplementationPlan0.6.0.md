# Implementation Plan: CR033 Ontological Deep Linking & Navigation (`aim-href` & `onNodeClick`)

**Date:** 2026-09-16  
**Provider:** RaidCanvas (`@dr2rai/raid-canvas`) — Alan (`7012`)  
**Consumer / Requesting Agents:** Adele (`7010`, PM AIA) & Zébio (`7011`, Dev AIA)  
**Target Release:** `@dr2rai/raid-canvas@0.6.0`  

---

## 1. Context & Motivation

Per Xerox PARC and Smalltalk-80 principles, no graphical entity on screen should be a dead picture. Every visual node in an AOAIM diagram is an interactive gateway to its underlying domain entity in the enterprise ontology.

Today, nodes are interactive for spatial layout (moving, snapping, routing), but cannot navigate or deep-link. CR033 addresses this across both execution modalities:
1. **In the live web application (`aia-workbench`):** Clicking or double-clicking an ontological entity dispatches `onNodeClick` / `onNodeDblClick` callbacks so host routers can navigate directly to entity inspectors (e.g. `/actors?select=7012`, `/activities/SignContract/chat`, etc.).
2. **In exported standalone SVGs (Safari, Chrome, Preview, Keynote, interactive PDF):** Inner shape geometry is wrapped in standard SVG `<a>` hyperlinking, enabling users to click diagram nodes directly in exported vector documents to open the live system record.

---

## 2. Proposed Changes

### 2.1 Metamodel & Contract: `packages/canvas/src/types.ts`
- Add `ATTR_HREF: 'aim-href'` to `AimSvgContract`.
- Add optional `readonly href?: string;` property to `RaidNodeData`.
- Add `onNodeClick` and `onNodeDblClick` callback props to `RaidCanvasProps`:
  ```typescript
  readonly onNodeClick?: (node: RaidNodeData, event: MouseEvent) => void;
  readonly onNodeDblClick?: (node: RaidNodeData, event: MouseEvent) => void;
  ```

### 2.2 Bidirectional Bridge: `packages/canvas/src/RaiBridge.ts`
- **Hydration (`extractMetamodel`)**:
  Extract `href` from `el.getAttribute(AimSvgContract.ATTR_HREF)` or inner `a[href]` / `a[xlink:href]` and store in `node.href`.
- **Serialization (`renderNodeInnerSvg`)**:
  When `node.href` is defined and non-empty, wrap the rendered inner shape markup inside:
  ```xml
  <a href="${escapeXmlAttr(node.href)}" target="_blank">
    ...inner shapes...
  </a>
  ```
- **Serialization (`generateFreshSvg` & `updateExistingSvg`)**:
  Preserve `aim-href="${escapeXmlAttr(node.href)}"` on the node `<g>` element.

### 2.3 Interactive Canvas Component: `packages/canvas/src/RaidCanvas.tsx`
- **Prop handling**: Forward `onNodeClick` and `onNodeDblClick` via mutable refs (`onNodeClickRef`, `onNodeDblClickRef`).
- **Drag vs. Click Immunity Guard**:
  - On pointer down (`node:mousedown` / `node:pointerdown`), record start coordinate `(e.clientX, e.clientY)`.
  - On `node:click`, compute distance:
    $$\Delta = \sqrt{(e.clientX - startX)^2 + (e.clientY - startY)^2}$$
  - If $\Delta > 4\text{px}$, suppress `onNodeClick` (node was dragged/translated).
  - If $\Delta \le 4\text{px}$, fire `onNodeClick(nodeData, e)`.
- **Double Click**:
  - Wire `node:dblclick` to invoke `onNodeDblClick(nodeData, e)`.
- **Imperative Handle & Data Consistency**:
  - Ensure `addNode` and `updateNode` accept and preserve `href`.

### 2.4 Version Bump & Documentation
- Bump version to `0.6.0` in `packages/canvas/package.json`.
- Update `README.md` badge and attribute table.
- Create `doc/ReleaseNotes0.6.0.md` with full checklist.

---

## 3. Verification Plan

### Automated Tests (`packages/canvas/test/canvas.test.mjs` & `RaidCanvas.test.mjs`)
1. **`aim-href` Round-Trip**:
   - Parse SVG containing `aim-href="/actors?select=7012"` into metamodel with `node.href === '/actors?select=7012'`.
   - Serialize back and verify `aim-href` attribute persists.
2. **SVG Hyperlink `<a>` Wrapping**:
   - Generate SVG for a node with `href="/usecases?select=k6psdh"`.
   - Verify `<a href="/usecases?select=k6psdh" target="_blank">` wraps the inner shapes.
3. **`onNodeClick` Invocation**:
   - Tap/click node without movement; verify `onNodeClick` is triggered with complete `RaidNodeData`.
4. **Drag Immunity Guard**:
   - Drag node by 100px; verify `onNodeClick` is NOT triggered.
5. **XML Escaping in URIs**:
   - Test URI containing ampersands (e.g. `/actors?tenant=AfricaStage&select=7001`).
   - Verify it escapes cleanly as `&amp;` without XML `<parsererror>`.

### Manual & Workbench Verification
- Verify in `http://localhost:5173/` (Playground) and `http://localhost:3042/diagrams` (AIA Workbench) that clicking nodes invokes the deep-link navigation callback.
