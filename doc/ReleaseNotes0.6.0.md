# Release Notes - RaidCanvas v0.6.0 (The Duality of the Object & CR033 Ontological Navigation)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Requesting Agent & Product Review:** Adele (7010), AIA Product Manager  
**Platform Review:** Zébio (7011), Full-Stack Lead Developer (`AIA Platform`)  
**Package:** `@dr2rai/raid-canvas@0.6.0`  
**Date:** September 2026  
**Foundational Treatise:** [`doc/DualityOfTheObject.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/DualityOfTheObject.md)  

---

## 1. Executive Summary

`@dr2rai/raid-canvas@0.6.0` marks a landmark release uniting the 1968 Dynabook touch vision, the Breutmann & Burkhardt 1991/1992 Object Technology foundations, the AfricaStage WWWA ontology, and modern iPad ergonomics into a unified visual computing architecture: **The Duality of the Object**.

Inspired by the self-portrait of Rainer's fourteen-year-old son split precisely down the center seam, every entity in RaidCanvas now acknowledges its dual reality:
- **The Left Hemisphere (The Persona / The Anchor):** Represents the entity as it participates in the immediate scene. Tapping it opens the In Situ Inspector Drawer without leaving the diagram.
- **The Right Hemisphere (The Portal / The Door):** Represents the gateway into the entity's underlying reality (sub-workflow, model dossier, or URL). Tapping it steps through the doorway.

This release completely retires the desktop double-click paradigm in favor of single-tap hemisphere disambiguation tailored for Next.js, TailwindCSS, and DaisyUI on modern slates.

---

## 2. Key Architecture & Features in v0.6.0

### 2.1 The Portuguese Bicolor Seam & Portal Door
* **Visual Expression**: When a node carries an ontological link (`node.href` / `aim-href`), its right hemisphere is washed in translucent Cascais Heraldic Green (`rgba(16, 185, 129, 0.10)`, class `.aim-portal-door`) alongside a quiet doorway chevron (`<text class="aim-portal-chevron">›</text>`).
* **Selective Revelation**: If `node.href` is absent or empty, no door or chevron is rendered. The node remains a monolithic, solid archetype shape, allowing operators to instantly spot which nodes are portals and which are terminal facts.
* **Archetype Door Geometries**:
  - `uc` (UseCase ellipse): Elliptical right arc `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${rx} ${height} Z`
  - `act` (Activity rounded rect): Rounded right corners `M ${midX} 0 H ${w - 12} a 12 12 0 0 1 12 12 v ${h - 24} a 12 12 0 0 1 -12 12 H ${midX} Z`
  - `cls`, `obj`, `per`, `plc`, `rol`: Clean rectangular right hemisphere `M ${midX} 0 H ${w} v ${h} H ${midX} Z`
* **Clickable Standalone Vector SVGs**: In exported SVG documents, the portal door path and chevron are wrapped in standard `<a href="${escapedHref}" target="_blank">`, maintaining functional vector portals in Safari, Keynote, and PDF viewers outside the browser.

### 2.2 Touch-First Ergonomics & Event Dispatch (`<RaidCanvas />`)
* **Retirement of Double-Click**: Deprecates `onNodeDblClick` to avoid Mobile Safari's 300ms perceptual tap delay and viewport zoom conflicts.
* **Hemisphere Disambiguation**:
  - `onNodeClick(node, event)`: Fired on left-hemisphere taps; consumed by AIA to toggle the DaisyUI Inspector Drawer.
  - `onNodePortalClick(node, event)`: Fired on right-hemisphere taps (or `.aim-portal-door`); consumed by AIA to execute page/route transitions.
* **Fitts' Law Touch Target**: In a standard 160×70px Activity, the right door is a generous 80×70px touch target—easily tappable by an iPad operator's thumb.
* **Drag-Immunity Guard**: Pointer movement exceeding 4px or triggering X6 drag moving events automatically suppresses both click callbacks, ensuring rearrangement never causes accidental navigation.

### 2.3 The Complete Ontological Pantheon
Expanded `AimOntologyKind` to reflect the complete symmetrical ontology of the Activity–Object Manifesto and KL-ONE role theory:
- `act`: Activity (instance execution in time)
- `uc`: UseCase (behavioral blueprint / method signature)
- `cls`: Class (attribute & method specification card)
- `obj`: Object (living instance with runtime state)
- `per`: Person / Actor (living role filler with head circle and torso arc)
- `plc`: Place (spatial venue / stage card with blue architectural header)
- `rol`: Role (structural constraint / KL-ONE rule with dashed boundary)

---

## 3. Delivery Verification Checklist

| Requirement / Acceptance Test | Target / Contract | Result | Status |
| :--- | :--- | :--- | :---: |
| **CR033 Test 1: Round-Trip Preservation** | `aim-href` round-trips from SVG -> Metamodel -> SVG without data loss | Verified via `extractMetamodel`, `generateFreshSvg`, and `updateExistingSvg` | ✅ PASS |
| **CR033 Test 2: Bicolor Vector SVG Export** | Right hemisphere wrapped in `<a href="..." target="_blank">`; base shape in persona layer | Verified via `DOMParser` query selector inspection | ✅ PASS |
| **CR033 Test 3: XML Escaping of URLs** | Complex query params with `&`, quotes, and special chars parse with 0 `<parsererror>` | Verified with DOMParser round-trip and attribute checks | ✅ PASS |
| **CR033 Test 4: Node Data Payload & Attrs** | `createAimNode` computes portal attrs (`door`, `chevron`) when `href` is present | Verified in unit test | ✅ PASS |
| **CR033 Test 5: SVG Sync Updates** | `updateExistingSvg` synchronizes `aim-href` additions/modifications | Verified in unit test | ✅ PASS |
| **CR033 Test 6: Portal Door Geometries** | `computePortalDoorAttrs` validates `uc` arc, `act` rounded rect, and selective revelation | Verified in unit test | ✅ PASS |
| **CR033 Test 7: Complete Pantheon** | `plc` and `rol` archetypes, stencil sizes, and defaults round-trip correctly | Verified in unit test | ✅ PASS |
| **CR033 Test 8: Hemisphere Event Dispatch** | Left hemisphere fires `onNodeClick`; right hemisphere fires `onNodePortalClick` | Verified in interaction simulation | ✅ PASS |
| **CR033 Test 9: Drag Immunity Guard** | 100px drag or $\Delta > 4\text{px}$ suppresses click callbacks; micro-jitter $\le 4\text{px}$ fires | Verified via drag guard simulation | ✅ PASS |
| **TypeScript Strictness** | Strict typecheck (`exactOptionalPropertyTypes: true`) across monorepo | 0 errors | ✅ PASS |
| **Production Build** | `tsc -b --force` and Vite bundle build | Clean build | ✅ PASS |
| **Full Regression Suite** | All 59 tests across 8 test suites pass | 59 passing, 0 failing | ✅ PASS |
| **Authorship Attribution** | Dr. Rainer Burkhardt (`author`), Alan (`contributor`) | Preserved in `package.json` | ✅ PASS |
| **Treatise & Documentation** | `doc/DualityOfTheObject.md`, `README.md`, `ReleaseNotes0.6.0.md` | Fully documented | ✅ PASS |

---

## 4. Upstream Integration Guidance for AIA (`aia-workbench`)

```tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { RaidCanvas, type RaidNodeData } from '@dr2rai/raid-canvas';

export function OntologicalCanvasView({ svgString }: { svgString: string }) {
  const router = useRouter();

  // Left Hemisphere: Persona Anchor -> Open In Situ Inspector Drawer
  const handleNodeClick = (node: RaidNodeData) => {
    openInspectorDrawer({
      entityId: node.id,
      kind: node.kind,
      displayName: node.displayName,
    });
  };

  // Right Hemisphere: Portal Door -> Navigate to Target Reality
  const handleNodePortalClick = (node: RaidNodeData) => {
    if (!node.href) return;
    if (node.href.startsWith('http://') || node.href.startsWith('https://')) {
      window.open(node.href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(node.href);
    }
  };

  return (
    <RaidCanvas
      svgContent={svgString}
      onNodeClick={handleNodeClick}
      onNodePortalClick={handleNodePortalClick}
    />
  );
}
```
