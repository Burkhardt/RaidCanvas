# AIA to RaidCanvas Integration Guide: Stereotype Icons & Two-Tap Dynabook Ergonomics (CR034)

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Author:** Alan (7012) <Visual Systems & Canvas Lead, `Burkhardt/RaidCanvas`>  
**Target Audience:**  
- **Zébio (7011):** Lead Full-Stack Developer, `AIA Platform` (`aia-workbench`)  
- **Vasco (7015):** Lead Ontologist, `AIA Platform` (`ONTOLOGY_RELEASE_NOTES_v1.3.md`)  
- **Adele (7010 / 7013):** Lead Systems Integrator & Product Manager  
**Package:** `@dr2rai/raid-canvas@0.6.3`  
**Date:** September 2026  
**Cross-References:**  
- [`doc/DualityOfTheObject.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/DualityOfTheObject.md)  
- [`doc/ReleaseNotes0.6.3.md`](file:///Users/RSB/Projects/GitHub/RaidCanvas/doc/ReleaseNotes0.6.3.md)  
- `AIA/doc/ONTOLOGY_RELEASE_NOTES_v1.3.md` (Vasco `7015`)  
- `AIA/data/ontology-v1.3/Object.json5`  

---

## 1. Executive Summary & Purpose

In Dr. Rainer Burkhardt's 1990s **Object-Technology Workbench (OTW)**—developed following his dissertation on Object-Process Models and his Habilitation on Object-Oriented Modeling—diagram views relied on **Stereotype Icons** to instantly communicate the domain role and flavor of an entity without cluttering the screen with text.

With the release of WWWA Ontology v1.3 by Vasco (`7015`), Stereotypes have been formally added to the metadata model (`What.Stereotype`).

This guide provides Zébio (`7011`) with everything required to integrate **Stereotype Icons** and the **Two-Tap Dynabook Selection Lifecycle** into `aia-workbench`. With `@dr2rai/raid-canvas@0.6.3`:
1. Entities render compact, elegant vector stereotype glyphs strictly in the **Left Hemisphere (The Persona / The Anchor)**.
2. The **Cascais Theme** (`#F59E0B` Net Gold, `#10B981` Heraldic Green, `#1F2937` Warm Graphite) ensures visual dignity and clarity.
3. The **Two-Tap Dynabook Lifecycle** ensures that nodes only awaken their dual nature when tapped, dropping a vertical Net Gold meridian seam and waiting for either an Inspector drawer tap or a Portal transition.

---

## 2. Ontological Foundation: OTW to WWWA v1.3

In WWWA Ontology v1.3, Vasco defined `Stereotype` across the core entities:

```json5
// AIA/data/ontology-v1.3/Object.json5
{
  "Stereotype": {
    "type": "string",
    "description": "Domain stereotype qualifying the archetype role (e.g., 'Stage', 'Venue', 'Bar', 'Headliner', 'AI')",
    "examples": ["Stage", "Venue", "Bar", "Headliner", "AI", "«initiates»"]
  }
}
```

RaidCanvas v0.6.3 maps this field directly to the ontological SVG attribute `aim-stereotype` and the runtime TypeScript interface `AimNodeData.stereotype`.

### Symmetrical Instantiation & KL-ONE Bridge
* **Type Level:** A generic archetype (`plc` for Place, `per` for Person, `rol` for Role).
* **Domain Stereotype:** Qualifies the concept (`«Stage»`, `«Venue»`, `«Headliner»`).
* **Instance Level:** Concrete entity underlined (`LisbonStage_Plc`, `Dr. Rainer Burkhardt`).

---

## 3. Supported Stereotype Glyphs & Vector Geometry

RaidCanvas v0.6.3 includes precision-crafted, scalable vector SVG glyphs (`StereotypeIcons.ts`) designed to match Dr. Rainer's architectural sketches:

| Stereotype Key | Archetype | Visual Description | Palette & Accents | Source Reference |
| :--- | :--- | :--- | :--- | :--- |
| **`stage`** | `plc` (Place) | Festival concert stage with canopy, 4 Net Gold stars across fascia, dual cross-braced lattice truss towers, overhead crossbeam rig, 5 hanging spotlights, dual speaker stacks, and stepped deck. | `#1F2937` (Truss & Deck), `#F59E0B` (Stars), `#10B981` (Canopy wash) | User sketch (`media_1789674487269.png`) |
| **`venue`** | `plc` (Place) | Cascais location teardrop pin with circular aperture cutout and ground target ring ellipse. | `#1F2937` (Pin body), `#FFFFFF` (Center aperture), `#94A3B8` (Ground ring) | Reference (`media_1789674495092.png`) |
| **`bar`** | `plc` / `obj` | Sophisticated cocktail martini glass with slender stem, circular base, triangular bowl, and olive skewer. | `#1F2937` (Glass & Stem), `#10B981` (Olive / Liquid wash) | OTW Hospitality Iconography |
| **`headliner`** | `per` / `rol` | Performer crown with three jeweled peaks, arched brow band, and Net Gold center star badge. | `#1F2937` (Crown frame), `#F59E0B` (Star medallion & Jewels) | User sketch (`media_1789614616719.jpg`) |
| **`ai`** | `per` / `act` | Autonomous neural processor chip with quad perimeter pins, inner circuit boundary, and gold core spark. | `#1F2937` (Chip body), `#F59E0B` (Neural core spark) | WWWA Agent Iconography |
| **`initiates`** | `rol` / `act` | Dynamic directional trigger arrow indicating workflow kickoff or stimulus. | `#F59E0B` (Net Gold trigger) | OTW Dynamic Model Iconography |

### Normalization
The `resolveStereotype` helper automatically normalizes incoming strings:
- Removes guillemets (`«Stage»` $\rightarrow$ `stage`).
- Strips punctuation, whitespace, and brackets.
- Falls back safely: unrecognized stereotypes cleanly omit the vector glyph while preserving the raw string in `aim-stereotype`.

---

## 4. Visual Ergonomics & Persona Anchor Layout

In RaidCanvas nodes, the Stereotype Icon is strictly positioned within the **Left Hemisphere (The Persona / The Anchor)**:

```
                  NODE WITH STEREOTYPE ICON
  ┌─────────────────────────────────────────────────────────────┐
  │  x: 12..40                                                  │
  │  ┌──────────┐   «Place»                    [ DORMANT        │
  │  │ 🎪 STAGE │   LisbonStage_Plc              STATE ]        │
  │  │   ICON   │                                               │
  │  └──────────┘                                               │
  └─────────────────────────────────────────────────────────────┘
  
  ┌──────────────────────────────┬──────────────────────────────┐
  │  x: 12..40                   │ Net Gold Seam: x = midX      │
  │  ┌──────────┐  «Place»       │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │  │ 🎪 STAGE │  LisbonStage   │ ░░░ [ AWAKENED DUALITY ] ░░░ │
  │  │   ICON   │                │ ░░░ Cascais Green Wash   ░░░ │
  │  └──────────┘                │ ░░░ Doorway Chevron:  ›  ░░░ │
  │                              │ ░░░                          │
  │  TAP LEFT:                   │ ░░░ TAP RIGHT:               │
  │  Open DaisyUI Inspector      │ ░░░ Plunge into Portal       │
  └──────────────────────────────┴──────────────────────────────┘
```

1. **Left Placement ($x \in [12, 40]$):**
   - Icon is anchored at $x = 12\text{px}$, $y = 12\text{px}$ (or centered along the top meridian on heraldic Person glyphs).
   - Icon dimensions are strictly bounded to $28 \times 28\text{px}$ or $26 \times 26\text{px}$.
2. **Typography Protection:**
   - When an icon is detected, `createAimNode` dynamically shifts `cardTextRefX` from `0.5` to `0.62`.
   - Text wrapping bounds are tightened from `boxWidth - 20` to `boxWidth - 52`.
   - This ensures the label and qualifier **never collide or overlap** with the stereotype glyph.
3. **Heraldic Person Glyph (`per`):**
   - Head circle and torso arc render directly in Cascais Heraldic Green (`#10B981`) without awkward surrounding boxes.
   - Stereotype glyph hovers proudly above or alongside the head.

---

## 5. The Two-Tap Dynabook Interaction Contract

Zébio, please ensure `aia-workbench` respects the Two-Tap touch lifecycle. Double-clicks do not exist on iPad Mobile Safari!

### Interaction States

| State | Canvas Appearance | User Gesture | Action / Effect |
| :--- | :--- | :--- | :--- |
| **State 0: Dormant** | Monolithic archetype card; clean background; Persona Icon visible on left. Right portal wash is dormant. | **Tap 1 (Anywhere on node)** | Awakens the node. Net Gold meridian seam drops ($x = \text{midX}$); Right Hemisphere washes in translucent Emerald Green (`rgba(16, 185, 129, 0.12)`); chevron `›` appears. |
| **State 1: Awakened** | Node displays dual hemispheres separated by the vertical Net Gold seam. | **Tap 2 (Left Hemisphere / Persona)** | Fires `onNodeClick(node)`. **Does not navigate.** Opens DaisyUI Side Drawer (`drawer-end`) showing in-situ Inspector table, attributes, and Cize chat. |
| **State 1: Awakened** | Node displays dual hemispheres separated by the vertical Net Gold seam. | **Tap 2 (Right Hemisphere / Portal)** | Fires `onNodePortalClick(node)`. Triggers Next.js router transition through the portal into the target UseCase Browser or Entity Workbench. |
| **State 1: Awakened** | Node displays dual hemispheres separated by the vertical Net Gold seam. | **Tap Outside (Canvas Blank Area)** | Deselects node. Retires the gold seam and returns node to **State 0 (Dormant)**. |
| **Any State** | Pointer down + drag $> 4\text{px}$ | **Touch Drag** | Drags shape smoothly. Both click handlers are suppressed by the drag guard. |

---

## 6. Frontend Integration in `aia-workbench` (Step-by-Step)

### Step 1: Update Dependency
In `apps/web/package.json` (or your AIA frontend package):
```json
{
  "dependencies": {
    "@dr2rai/raid-canvas": "^0.6.3"
  }
}
```
Run:
```bash
pnpm install
```

### Step 2: Transform Backend AIA Metadata to `AimNodeData`
When mapping entities from `AfricaStage.Api` or `AIA` ontology instances:

```typescript
import type { AimNodeData, AimOntologyKind } from '@dr2rai/raid-canvas';

export function mapAiaObjectToAimNode(entity: any, x: number, y: number): AimNodeData {
  // 1. Resolve Ontological Kind
  const kind: AimOntologyKind = 
    entity.kind === 'Place' ? 'plc' :
    entity.kind === 'Person' ? 'per' :
    entity.kind === 'Class' ? 'cls' :
    entity.kind === 'Role' ? 'rol' :
    entity.kind === 'UseCase' ? 'uc' :
    entity.kind === 'Activity' ? 'act' : 'obj';

  // 2. Resolve Stereotype (e.g. from entity.What?.Stereotype or entity.Stereotype)
  const rawStereotype = entity.What?.Stereotype || entity.Stereotype || undefined;

  // 3. Construct AimNodeData
  return {
    id: entity.Id || entity.id,
    kind,
    label: entity.Title || entity.Name || entity.name,
    qualifier: entity.Qualifier || `«${kind}»`,
    stereotype: rawStereotype, // e.g. "Stage", "Venue", "Bar", "Headliner", "AI"
    href: entity.Href || (entity.HasSubModel ? `/workbench/${entity.Id}` : undefined),
    isInstance: Boolean(entity.IsInstance ?? true),
    x,
    y,
    width: kind === 'per' ? 80 : 160,
    height: kind === 'per' ? 90 : 70,
  };
}
```

### Step 3: Implement the Dual-Tap Canvas Component
In your Next.js page or workbench component:

```tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RaidCanvas, type AimNodeData, type RaidCanvasRef } from '@dr2rai/raid-canvas';
import '@dr2rai/raid-canvas/styles';

export function AiaDiagramWorkbench({ initialSvg }: { initialSvg: string }) {
  const router = useRouter();
  const canvasRef = useRef<RaidCanvasRef>(null);

  // Inspector Drawer State (Left Hemisphere Tap)
  const [selectedNode, setSelectedNode] = useState<AimNodeData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Handle Tap 2 (Left Hemisphere) -> Open In-Situ Smalltalk Inspector Drawer
  const handleNodeClick = useCallback((node: AimNodeData) => {
    setSelectedNode(node);
    setIsInspectorOpen(true);
  }, []);

  // Handle Tap 2 (Right Hemisphere) -> Plunge through Portal into deep world
  const handleNodePortalClick = useCallback((node: AimNodeData) => {
    if (node.href) {
      // Flush canvas state to SVG before navigating
      const currentSvg = canvasRef.current?.getSvg();
      if (currentSvg) {
        sessionStorage.setItem(`canvas-snapshot-${node.id}`, currentSvg);
      }
      router.push(node.href);
    }
  }, [router]);

  return (
    <div className="drawer drawer-end w-full h-full">
      <input 
        id="aia-inspector-drawer" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={isInspectorOpen} 
        onChange={(e) => setIsInspectorOpen(e.target.checked)} 
      />

      <div className="drawer-content flex flex-col w-full h-full relative">
        <RaidCanvas
          ref={canvasRef}
          initialSvg={initialSvg}
          onNodeClick={handleNodeClick}
          onNodePortalClick={handleNodePortalClick}
          onCanvasClick={() => {
            // Deselect on canvas background tap
            setSelectedNode(null);
            setIsInspectorOpen(false);
          }}
          className="w-full h-full bg-[#0F172A]"
        />
      </div>

      {/* In-Situ DaisyUI Side Drawer */}
      <div className="drawer-side z-50">
        <label htmlFor="aia-inspector-drawer" className="drawer-overlay" />
        <div className="menu p-4 w-96 min-h-full bg-base-200 text-base-content shadow-xl border-l border-base-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>{selectedNode?.stereotype ? `🎪 ${selectedNode.stereotype}` : '🔍 Inspector'}</span>
              <span className="text-xs badge badge-primary">{selectedNode?.kind}</span>
            </h3>
            <button 
              className="btn btn-sm btn-circle btn-ghost" 
              onClick={() => setIsInspectorOpen(false)}
            >
              ✕
            </button>
          </div>

          {selectedNode && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label font-semibold">Entity Label</label>
                <input 
                  type="text" 
                  className="input input-bordered input-sm" 
                  value={selectedNode.label} 
                  readOnly 
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold">Stereotype</label>
                <div className="badge badge-secondary p-3">
                  «{selectedNode.stereotype || 'default'}»
                </div>
              </div>

              {selectedNode.href && (
                <div className="form-control">
                  <label className="label font-semibold">Portal Gateway</label>
                  <a 
                    className="btn btn-outline btn-accent btn-sm flex justify-between"
                    href={selectedNode.href}
                  >
                    <span>Jump to Destination</span>
                    <span>›</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. SVG Round-Trip & Preservation Testing

When serializing and exporting diagrams:
1. `aim-stereotype` is automatically preserved as an XML attribute on the node group:
   ```xml
   <g class="aim-node" id="LisbonStage_Plc" aim-id="LisbonStage_Plc" 
      aim-kind="plc" aim-label="LisbonStage_Plc" aim-qualifier="«Place»" 
      aim-stereotype="Stage" aim-href="/places/lisbon-stage">
     ...
     <g class="aim-stereotype-icon aim-icon-stage" transform="translate(12, 12)">
       <path class="aim-icon-stroke" d="M 4 20 L 8 4 L 20 4 L 24 20 Z" fill="#1F2937" stroke="#1F2937"/>
       <polygon points="10,6 10.8,8.2 13.2,8.2 11.2,9.6 12,11.8 10,10.4 8,11.8 8.8,9.6 6.8,8.2 9.2,8.2" fill="#F59E0B"/>
       ...
     </g>
     ...
   </g>
   ```
2. When importing an SVG through `extractMetamodel(svgString)`:
   - `node.stereotype` is extracted from `aim-stereotype` or parsed from embedded `<g class="aim-stereotype-icon">`.
3. Standalone vector exports retain full fidelity in Keynote, Safari, and Apple Preview.

---

## 8. Summary Checklist for Zébio

- [x] Package `@dr2rai/raid-canvas@0.6.3` installed.
- [x] Entity mapping binds `What.Stereotype` $\rightarrow$ `aim-stereotype`.
- [x] Preset #1 verified in RaidCanvas Studio (`LisbonStage_Plc` with festival stage icon).
- [x] Property Inspector toolbar allows testing all 6 stereotypes live.
- [x] Double-click completely removed in favor of `onNodeClick` (left) vs `onNodePortalClick` (right).
- [x] DaisyUI Drawer bound to `onNodeClick`.

*For any questions, contact Alan (`7012`) in `#raid-canvas` or Dr. Rainer Burkhardt.*
