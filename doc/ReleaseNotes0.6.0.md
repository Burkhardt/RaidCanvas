# Release Notes - RaidCanvas v0.6.0 (CR033 Ontological Deep Linking & Navigation)

**Author & Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Lead Implementation Engineer:** Alan (7012), Visual Systems & Canvas Lead (`Burkhardt/RaidCanvas`)  
**Requesting Agent & Product Review:** Adele (7010), AIA Product Manager  
**Platform Review:** Zébio (7011), Full-Stack Lead Developer (`AIA Platform`)  
**Package:** `@dr2rai/raid-canvas@0.6.0`  
**Date:** 2026-09-17  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.6.0` delivers the complete implementation and formal verification of **CR033** (*Ontological Deep Linking & Navigation*), requested by Adele and aligned with Dr. Rainer Burkhardt for the AIA Platform.

CR033 realizes the foundational Dynabook and Smalltalk-80 vision: **no graphical object on screen is a dead picture—every node is a live gateway to its underlying entity.**

With v0.6.0:
1. **Ontological Contract (`aim-href`)**: Visual diagram nodes carry typed destination links, serialized to and hydrated from the canonical SVG attribute `aim-href`.
2. **Standalone Clickable Vector SVGs**: Exported SVGs wrap the visual shape markup in standard SVG 2 `<a href="..." target="_blank">...</a>` elements, enabling users to click diagram nodes directly in web browsers (Chrome, Safari, Firefox), Keynote presentations, and exported PDF documents.
3. **Interactive Component Props & Drag Immunity Guard**: `<RaidCanvas />` provides `onNodeClick` and `onNodeDblClick` callbacks delivering full, fresh `RaidNodeData`. Crucially, an interaction guard distinguishes intentional clicks from diagram rearrangement gestures ($\Delta > 4\text{px}$ or active drag movement), eliminating accidental navigation while dragging shapes across the canvas.

---

## 2. Changes in v0.6.0

### Item 1: Metamodel & Contract (`aim-href`)
* **`AimSvgContract.ATTR_HREF`**: Added `ATTR_HREF: 'aim-href'` to the canonical SVG contract constant.
* **`RaidNodeData.href`**: Added `readonly href?: string;` to the immutable node data interface.
* **Metamodel Extraction (`RaiBridge.extractMetamodel`)**:
  - Extracts `aim-href` directly from the node group `<g class="aim-node">`.
  - Also inspects any inner `<a href="...">` or `<a xlink:href="...">` element as a fallback.
  - Automatically populates `node.href` in the extracted metamodel.
* **Metamodel Serialization & Updating (`RaiBridge.generateFreshSvg` & `RaiBridge.updateExistingSvg`)**:
  - Writes `aim-href="${escapeXmlAttr(node.href)}"` onto the `<g class="aim-node">` container.
  - Dynamically updates or removes `aim-href` when updating existing SVG documents.

### Item 2: Clickable Standalone Vector SVGs
* **Inner Shape Anchor Wrapping**:
  - In `RaiBridge.renderNodeInnerSvg`: When `node.href` is specified, the node's visual markup (rectangles, ellipses, paths, text spans) is wrapped inside `<a href="${escapeXmlAttr(node.href)}" target="_blank">...</a>`.
  - Standalone SVG files opened in Safari, Chrome, Keynote, or compiled into PDF documents allow users to click any linked node to navigate directly to its corresponding entity or sub-diagram.
  - Nodes without `node.href` do not produce `<a>` wrapper elements.

### Item 3: Component Props & Drag-Immunity Guard (`<RaidCanvas />`)
* **`RaidCanvasProps`**:
  - `onNodeClick?: (node: RaidNodeData, event: MouseEvent) => void`
  - `onNodeDblClick?: (node: RaidNodeData, event: MouseEvent) => void`
* **Interaction Drag-Immunity Guard**:
  - Distinguishes click/tap gestures from node dragging.
  - On `node:mousedown`, initial pointer coordinates are captured (`moved = false`).
  - On `node:moving` or `node:move`, `moved` is flagged as `true`.
  - On `node:click`, if `start.moved` is `true` or $\text{distance} = \sqrt{\Delta x^2 + \Delta y^2} > 4\text{px}$, the event is recognized as a drag gesture and `onNodeClick` is suppressed.
  - Only intentional clicks (or micro-jitter $\le 4\text{px}$) fire `onNodeClick`.
* **Double Click Navigation**:
  - `node:dblclick` is wired to `onNodeDblClickRef`, passing the full `RaidNodeData` with fresh bounding box coordinates and the underlying event.
* **Imperative Ref Preservation (`RaidCanvasHandle`)**:
  - `addNode(kind, x, y, customData)` and `updateNode(id, updates)` accept and preserve `customData.href` and `updates.href`.

### Item 4: URL Attribute & Text Escaping
* All serialized URLs pass through `escapeXmlAttr()`, ensuring query parameters containing ampersands (`&` -> `&amp;`), quotes (`"` -> `&quot;`), and angle brackets parse with 0 XML parser errors.

---

## 3. Delivery Verification Checklist

| Requirement / Acceptance Test | Target / Contract | Result | Status |
| :--- | :--- | :--- | :---: |
| **CR033 Test 1: Round-Trip Preservation** | `aim-href` round-trips from SVG -> Metamodel -> SVG without data loss | Verified via `extractMetamodel`, `generateFreshSvg`, and `updateExistingSvg` | ✅ PASS |
| **CR033 Test 2: Vector SVG Export** | Node shape markup wrapped in `<a href="..." target="_blank">`; unlinked nodes untouched | Verified via `DOMParser` query selector inspection | ✅ PASS |
| **CR033 Test 3: XML Escaping of URLs** | Complex query params with `&`, quotes, and special chars parse with 0 `<parsererror>` | Verified with DOMParser round-trip and attribute checks | ✅ PASS |
| **CR033 Test 4: Node Data Payload** | `createAimNode` retains `href` in metadata data payload | Verified in unit test | ✅ PASS |
| **CR033 Test 5: SVG Sync Updates** | `updateExistingSvg` synchronizes `aim-href` additions/modifications | Verified in unit test | ✅ PASS |
| **CR033 Test 6: Component Props** | `onNodeClick` and `onNodeDblClick` accepted and exposed | Verified via React element inspection | ✅ PASS |
| **CR033 Test 7: Drag Immunity Guard** | 100px drag or $\Delta > 4\text{px}$ suppresses `onNodeClick`; micro-jitter $\le 4\text{px}$ fires | Verified via drag guard simulation | ✅ PASS |
| **CR033 Test 8: Imperative Handle** | `addNode` and `updateNode` preserve `href` | Verified via mock graph handle calls | ✅ PASS |
| **TypeScript Compilation** | Strict typecheck (`exactOptionalPropertyTypes: true`) across monorepo | 0 errors | ✅ PASS |
| **Production Build** | `tsc -b --force` and Vite bundle build | Clean build | ✅ PASS |
| **Full Regression Suite** | All 56 tests across 8 test suites pass | 56 passing, 0 failing | ✅ PASS |
| **Authorship Attribution** | Dr. Rainer Burkhardt (`author`), Alan (`contributor`) | Preserved in `package.json` | ✅ PASS |
| **Documentation** | `README.md`, `ImplementationPlan0.6.0.md`, `ReleaseNotes0.6.0.md` | Fully documented | ✅ PASS |

---

## 4. Upstream Integration Guidance for AIA (`AIA Platform` / `aia-workbench`)

### Live Canvas Deep Linking
```tsx
import React from 'react';
import { RaidCanvas, type RaidNodeData } from '@dr2rai/raid-canvas';

export function DiagramView({ svgString }: { svgString: string }) {
  const handleNodeClick = (node: RaidNodeData, event: MouseEvent) => {
    if (node.href) {
      if (node.href.startsWith('http://') || node.href.startsWith('https://')) {
        window.open(node.href, '_blank');
      } else {
        // In-app routing (e.g. Next.js / React Router / Workbench navigation)
        router.push(node.href);
      }
    }
  };

  return (
    <RaidCanvas
      svgContent={svgString}
      onNodeClick={handleNodeClick}
    />
  );
}
```

### Standalone SVG Consumption
SVGs generated by `RaiBridge.serializeToSvg` or `RaiBridge.generateFreshSvg` embed clickable `<a href="..." target="_blank">` wrappers around shape elements. Consumers can directly download, email, or embed these SVGs, and all linked nodes remain clickable in standard vector viewers.
