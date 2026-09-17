# The Duality of the Object
## Toward an Enactive, Wisdom-Centric Canvas Architecture
### Uniting the Dynabook Vision, the WWWA Ontology, KL-ONE Roles, and the Bicolor Touch Paradigm

**Principal Architect:** Dr. Rainer Burkhardt <Rainer@Burkhardt.com>  
**Visual Systems & Canvas Lead:** Alan (7012) (`Burkhardt/RaidCanvas`)  
**Contributors & Reviewers:** Adele (7010), AIA Product Manager; Zébio (7011), Full-Stack Lead Developer  
**Date:** September 2026  
**Inspiration:** *The portrait of a 14-year-old at the vertical seam between his everyday persona and his inner cosmos.*

---

> *"The best way to predict the future is to invent it."*  
> — Alan Kay, 1971
>
> *"The primary artifact of software engineering is not software. It is the explicit representation of the knowledge—and ultimately the wisdom—of a domain. Software becomes merely one execution mechanism of that representation."*  
> — The Activity–Object Manifesto, 2026

---

## 1. Prologue: The Boy at the Seam

In September 2026, during the engineering of `@dr2rai/raid-canvas@0.6.0`, Rainer Burkhardt shared a drawing created by his fourteen-year-old son: a pencil self-portrait split precisely down the vertical center line.

```
                  THE BOY AT THE SEAM
         ┌───────────────────┬───────────────────┐
         │                   │    *  * .   .  *  │
         │   (The Everyday   │   *  ELECTRIC *   │
         │      Persona)     │  *   BLUE EYE   * │
         │                   │   * AURA & WAVES *│
         │   Calm, earthly,  │  *   INNER COSMOS *
         │   grounded face,  │   *  UNFOLDING  * │
         │   brown hair,     │    *   INTO    *  │
         │   clear gaze      │   * THE UNSEEN *  │
         │                   │    *    WORLD    *│
         └───────────────────┴───────────────────┘
                   ▲                   ▲
                   │                   │
             Outer Reality       Inner Reality
             (The Anchor)        (The Portal)
```

On the left hemisphere sits the everyday boy: calm, clear-eyed, earthly, grounded in physical space.  
On the right hemisphere erupts the inner cosmos: an electric, luminous blue eye, swirling clouds of mythical energy, water glyphs across the chest, and an entire universe of unspoken thoughts and latent potential.

Without reading a single academic paper on human-computer interaction, a fourteen-year-old boy articulated the foundational philosophical challenge of modern visual computing:

> **Every meaningful entity in a system possesses a duality:**  
> **An outer persona that participates in the immediate scene,**  
> **and an inner world that contains its deeper reality.**

For fifty years, computer software forgot this duality. Software rendered objects as flat, dead rectangular stickers or passive SVG paths. Clicking an object was reduced to a binary collision: either an accidental selection or a disruptive, jarring leap to an entirely different screen.

This document formalizes the **Duality of the Object**: a unified architectural, ontological, and ergonomic framework that brings together the 1968 Dynabook tablet vision, the Breutmann & Burkhardt 1991/1992 Object Technology foundations, the AfricaStage WWWA ontology, KL-ONE role theory, and an iPad-native touch language.

---

## 2. The Dynabook & The Enactive Mode of Thought

### 2.1 The Meadow in 1968
When Alan Kay built the cardboard mockup of the **Dynabook** in 1968—imagining children sketching, modeling physics, and exploring music in a meadow—there was **no mouse on that grass**. There were no pull-down menu bars. There were certainly no double-clicks.

There was only a slate, a stylus, a finger, and a human mind operating in what psychologist Jerome Bruner identified as the **Enactive Mode**:
* **Enactive:** Learning and thinking by doing, holding, touching, gesturing.
* **Iconic:** Recognizing spatial structures, visual schemas, colors, and topological relationships.
* **Symbolic:** Reasoning with formal language, text, mathematical logic, and code.

The desktop mouse, pioneered by Doug Engelbart, was a brilliant mechanical proxy for a world bounded by cathode-ray tubes. But as computing transitioned to desktop operating systems, an unnatural compromise was struck: **the double-click**.

### 2.2 Why the Double-Click Is Dead
The double-click was never an organic human gesture. It was an accidental engineering hack invented because early mice had only one physical button, and software needed a way to disambiguate *"I want to select this object on the screen"* from *"I want to open this object"*.

On a modern slate—an iPad running Mobile Safari with Next.js, TailwindCSS, and DaisyUI—the double-click is an **active anti-pattern**:
1. **Viewport Interference:** Mobile Safari reserves double-taps for viewport zoom gestures.
2. **The 300ms Perceptual Tax:** When an interface listens for double-clicks, it must hesitate for 300 milliseconds on every single touch to determine whether a second tap is incoming, destroying the illusion of immediate physical manipulation.
3. **Ergonomic Strain:** Double-tapping rapidly on a glass pane introduces micro-slips and muscle tension alien to natural touch.

In an iPad-first universe:
* **Double-click does not exist.**
* **Triple-click is completely alien.**
* **There is only touch, tap, drag, pinch, and gaze.**

The question then becomes: *How can an operator touch an object to manipulate it in the diagram without accidentally ripping themselves away from the canvas?*

The answer lies in his son's drawing: **the vertical split.**

---

## 3. The Complete Ontological Pantheon

To serve as a genuine Knowledge Representation workbench, our canvas cannot restrict itself to a handful of ad-hoc shapes. It must reflect the full, symmetrical ontology established across the *Activity–Object Manifesto*, the *WWWA Whitepaper*, and the *AfricaStage OT Convergence Manifesto*.

```
                      THE SYMMETRICAL ONTOLOGY
   
     ┌─────────────────────────────────────────────────────────┐
     │                    BEHAVIORAL REALM                     │
     │                                                         │
     │     UseCase (Template)   ────────►   Activity (Instance)│
     │     «Operation Blueprint»            «Execution in Time»│
     └────────────────────────────┬────────────────────────────┘
                                  │
                       Executes in Namespace of
                                  │
     ┌────────────────────────────▼────────────────────────────┐
     │                    STRUCTURAL REALM                     │
     │                                                         │
     │     Class (Blueprint)    ────────►   Object (Instance)  │
     │     «Attribute Schema»               «Living State»     │
     └─────────────────────────────────────────────────────────┘
                                  │
                      Enacted in Context of
                                  │
     ┌────────────────────────────▼────────────────────────────┐
     │                    CONTEXTUAL ARENA                     │
     │                                                         │
     │     Role (KL-ONE Rule)   ────────►   Person (Actor)     │
     │     «Structural Constraint»          «Role Filler»      │
     │                                                         │
     │     Place (Where)        ────────►   Stage / Arena      │
     │     «Spatial Context»                «Physical Reality» │
     └─────────────────────────────────────────────────────────┘
```

RaidCanvas recognizes seven primary archetypes, each mapped to a distinct ontological role:

| Archetype | Ontological Domain | WWWA Pit | Visual Geometry | Primary Semantics |
| :--- | :--- | :--- | :--- | :--- |
| **`act` (Activity)** | Dynamic Behavior | `Activity` (`Action`) | Rounded Box ($r=12$), Heraldic Green accent | Execution over time; a process step or running method instance. |
| **`uc` (UseCase)** | Behavioral Blueprint | Meta-Activity | Ellipse, Cascais Net Gold accent border | The specification of an operation; the method signature. |
| **`obj` (Object)** | Concrete State | `Object` (`What`) | Sharp Rectangle, SilverLine/Graphite border | A living instance with concrete properties; holds state. |
| **`cls` (Class)** | Structural Blueprint | `Object` (`Kind: Cls`) | Three-compartment Card (Header, Attrs, Methods) | The conceptual schema defining potential attributes (*Farben*). |
| **`per` (Person / Actor)** | Agency | `Person` (`Who`) | Heraldic Glyph (Head Circle + Torso Arc) | The living human or autonomous agent; the role filler. |
| **`plc` (Place)** | Spatial Context | `Place` (`Where`) | Architectural Box with Spatial Header | The physical venue, stage, or virtual space anchoring the action. |
| **`rol` (Role)** | Structural Constraint | Dynamic Relation | Connecting Tag / Stereotyped Edge | The KL-ONE relation constraint (Value & Number restriction). |

### 3.1 Structural Symmetry: Symmetrical Instantiation
Following the 1991/1992 Breutmann & Burkhardt foundations (*Objektorientierte Systeme*), true Object Technology demands symmetry between structure and behavior:
* If an **Activity** is a runtime instance of a **UseCase**,
* Then an **Object** must be a runtime instance of a **Class**.

Activities are not detached, procedural functions drifting in the void. An Activity is a **Method** executing inside the scope of its target Object (`Object.Activity`). Within that execution, pre- and post-conditions evaluate naturally against the `this` pointer of the Object.

### 3.2 KL-ONE: The Role–RoleFiller Architecture (Brachman & Schmolze, 1985)
To keep systems malleable and ontologically sound, AfricaStage and RaidCanvas inherit the foundational semantic networking principles of **KL-ONE** (*Ronald J. Brachman & James G. Schmolze*, "An Overview of the KL-ONE Knowledge Representation System", *Cognitive Science*, 1985):

* **The Role (Concept / Type Level):** Specifies a structural relationship constraint—defining a *Value Restriction* (what kind of concept may participate, e.g., must be a `Person`) and a *Number Restriction* (cardinality, e.g., $1..1$ or $1..*$). In classic 1985 KL-ONE notation, a Role is represented as an **open circle (`○`)** anchored along the relationship line between generic concepts.
* **The Role Filler (Individual / Instance Level):** The concrete entity bound to that role at runtime. In KL-ONE notation, the Role Filler is represented as a **filled dot (`●`)** on the instance relationship link, with a dashed projection arrow pointing up to the open circle Role.

```
                     THE KL-ONE ROLE–FILLER BRIDGE
  
    ┌────────────────────────────────────────────────────────────────────────┐
    │  TYPE WORLD: Pure Specifications & Constraints (No Instances)          │
    │                                                                        │
    │         Class: System ──────────( ○ Owner )──────────► Class: Person   │
    └──────────────────────▲───────────────▲──────────────────────▲──────────┘
                           │               │                      │
                   (is-a)  │               │ (fills role)         │ (is-a)
                           │               │                      │
    ┌──────────────────────┴───────────────┴──────────────────────┴──────────┐
    │  INSTANCE WORLD: Living Individuals & Concrete State                   │
    │                                                                        │
    │         Object: <u>AIA</u> ─────────( ● )──────────────► Object: <u>RAI</u>    │
    │                                RoleFiller                              │
    │                            ("Rainer füllt die                          │
    │                            Rolle Owner für AIA")                       │
    └────────────────────────────────────────────────────────────────────────┘
```

When an entity is rendered on the canvas:
1. **The Individual Persona:** Represented with its proper name (*Dr. Rainer Burkhardt* or *RAI*).
2. **The Active Role:** Rendered through its ontological qualifier (*Owner*, *Assignee*, *Performer*) and its stereotype (`«initiates»`, `«binds»`).
3. **The Instance Rule:** In accordance with standard UML and AOAIM conventions, only concrete individuals are underlined (`<u>AIA</u>`, `<u>RAI</u>`, `aim-instance="true"`). Generic classes and roles remain clean.

### 3.3 The Epistemological Bridge: Why UseCase Diagrams Have No Instances
A critical realization in knowledge architecture is the separation between the **Type World** and the **Instance World**:
* **UseCase Diagrams live exclusively in the Type World.** A UseCase Diagram is composed entirely of blueprints, classes, and roles (`Customer`, `Sign Contract`, `Verify Identity`). It contains **zero instances**. There is no "Dr. Rainer Burkhardt" inside a UseCase Diagram—only the role of `Customer` or `Initiator`.
* **The RoleFiller Diagram connects the two worlds.** It is the mathematical and visual bridge that projects living objects (`<u>AIA</u>`, `<u>AfricaStage</u>`, `<u>RAI</u>`) upward onto their conceptual types (`System`, `Person`) through the specific roles they fulfill (`Owner`, `Admin`).

### 3.4 The AfricaStage Convergence: Attributes as Roles and Values as RoleFillers
In the AfricaStage platform, when an operator opens the details of an Object (e.g. `Object · GageElementary26e : Show`), the system renders both a property inspector table and an in-situ role-filler diagram:
* **Relational Roles:**
  - `GageElementary26e` fills the role `Show`.
  - `Rainer Burkhardt` fills the role `Performer`.
  - `GageElementarySchool` fills the role `Venue` (Place).
* **Attribute Roles:**
  - In true KL-ONE epistemology, **attributes are simply roles whose Value Restriction is a primitive datatype**, and **attribute values are their RoleFillers**:
    - Role `Title` $\rightarrow$ Value Restriction `String` $\rightarrow$ RoleFiller `"Gage Elementary Multicultural Festival"`.
    - Role `Workspace` $\rightarrow$ Value Restriction `Boolean` $\rightarrow$ RoleFiller `true`.
    - Role `Program` $\rightarrow$ Value Restriction `List<Activity>` $\rightarrow$ RoleFiller `[Act: Welcome, Act: German Folk Dance, ...]`.

Every entity in the universe is thus a locus of roles filled by other entities, while simultaneously acting as a role filler in the surrounding context. The canvas is the interactive medium through which this web of meaning is explored and manipulated.

---

## 4. The Duality Principle: Persona and Portal

How does an iPad user interact with these rich entities? We apply the vertical split directly to the SVG geometry.

Every node in RaidCanvas is divided into two distinct hemispheres:

```
                      THE DUAL HEMISPHERES
  ┌─────────────────────────────────┬─────────────────────────────────┐
  │                                 │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │   LEFT HEMISPHERE:              │ ░░░ RIGHT HEMISPHERE:         ░░░ │
  │   THE PERSONA (THE ANCHOR)      │ ░░░ THE PORTAL (THE DOOR)     ░░░ │
  │                                 │ ░░░                           ░░░ │
  │   • Base background fill        │ ░░░ • Translucent Green wash  ░░░ │
  │   • Archetype identity          │ ░░░   (Cascais Heraldic Glow) ░░░ │
  │   • Qualifier & Display Name    │ ░░░ • The Gateway to Depth    ░░░ │
  │                                 │ ░░░                           ░░░ │
  │   GESTURES:                     │ ░░░ GESTURES:                 ░░░ │
  │   • TAP: Opens Inspector        │ ░░░ • TAP: Dives through door ░░░ │
  │     (DaisyUI Side Drawer)       │ ░░░   into entity / sub-model ░░░ │
  │   • DRAG: Moves node in space   │ ░░░ • DRAG: Moves node safely ░░░ │
  └─────────────────────────────────┴─────────────────────────────────┘
                    ▲                               ▲
                    │                               │
             Belongs to the                  Belongs to the
             Current Scene                   Inner Universe
```

### 4.1 The Left Hemisphere: The Persona (The Anchor)
* **Visual Expression:** Rendered in the entity’s foundational archetype palette (Chalk White, Canvas Cream, or Warm Graphite). It contains the head glyph, the qualifier, and the display name.
* **Semantic Meaning:** Represents the entity as it exists *in this current diagram*.
* **Touch Ergonomics:**
  * **Single Tap:** Selects the node and opens the **In Situ Smalltalk Inspector Drawer** (DaisyUI `drawer-end`) on the right side of the screen. The user **never leaves the diagram**. The canvas remains mounted, zoom and pan are preserved, and the entity's live attributes, conversation with Cize, and preconditions appear alongside the canvas.
  * **Touch Drag:** Drags the node across the canvas to reposition it. Our $\Delta > 4\text{px}$ drag-immunity guard ensures that rearranging shapes never triggers an accidental inspection or navigation.

### 4.2 The Right Hemisphere: The Portal (The Door)
* **Visual Expression:** A subtle, luminous vertical wash of Cascais Heraldic Green (`rgba(16, 185, 129, 0.08)` to `0.14`). At its right boundary sits a quiet, translucent doorway affordance (`›`).
* **Semantic Meaning:** Represents the doorway into the entity’s *underlying reality*—its child diagram, its source code, its place on the map, or its detailed dossier.
* **Touch Ergonomics:**
  * **Single Tap:** Directly engages the portal, transitioning the application perspective into the underlying world (e.g. stepping into a sub-activity workflow or opening the full entity workbench).
  * **Fitts' Law Mastery:** In a standard 160×70px Activity, the right door is a massive **80×70px touch target**. Unlike tiny 16×16px corner links, an iPad operator can tap this portal blindly with their right thumb while holding the tablet.

### 4.3 The Portuguese Bicolor Seam & The Two-Tap Dynabook Lifecycle
The visual inspiration draws directly upon the Portuguese national flag and the Cascais heraldic heritage:
* On the flag, green and red share a proud, dignified vertical meridian, with the armillary sphere anchoring the transition.
* On our canvas, the boundary between the Persona and the Portal is marked by the **Net Gold (`#F59E0B`) Meridian Seam** (`stroke-width="1.5"`).
* **The Two-Tap Dynabook Selection Lifecycle:**
  * **State 0 (Dormant):** The node rests in a quiet, monolithic state displaying its pure ontological archetype and Persona Anchor. The right hemisphere is calm, preserving canvas serenity.
  * **Tap 1 (Awakened Duality):** Tapping the node awakens its dual nature. The vertical **Net Gold Meridian Seam** drops down the center line ($x = \text{midX}$). The Right Hemisphere illuminates with the translucent Cascais Emerald Green portal wash (`rgba(16, 185, 129, 0.12)`) and reveals the subtle doorway chevron (`›`). The node is now actively waiting for the operator's next intent.
  * **Tap 2 — Left Hemisphere (The Persona):** Tapping the left side opens the in-situ Smalltalk-style **DaisyUI Inspector Drawer** (`drawer-end`), allowing immediate inspection and editing of attributes, role fillers, and conversations with Cize without leaving the diagram.
  * **Tap 2 — Right Hemisphere (The Portal):** Tapping the right door plunges through the portal, dispatching `onNodePortalClick` to transition to the underlying UseCase Browser, Sub-Activity workflow, or Venue Map.
  * **Tap Outside:** Deselects the node, smoothly retiring the gold seam and returning the node to its dormant state.

### 4.4 Stereotype Iconography and the Persona Anchor (OTW to WWWA)
In the 1990s, Dr. Rainer Burkhardt developed the **Object-Technology Workbench (OTW)** following his dissertation on Object-Process Models and his Habilitation on Object-Oriented Modeling. A defining breakthrough of OTW was the introduction of **Stereotype Icons** inside model views—compact, highly legible glyphs that instantly communicate the domain flavor and operational role of an entity without cluttering the diagram with verbose text.

With the release of WWWA Ontology v1.3 (authored by Vasco, Lead Ontologist, `7015`), this philosophy is natively resurrected in RaidCanvas through the `aim-stereotype` SVG contract.

1. **The Persona Anchor ($x \in [12, 40]$):**
   * The Stereotype Icon lives within the **Left Hemisphere (The Persona)** or crowns the entity top meridian.
   * By anchoring the icon on the far left of standard cards, the entity's ontological qualifier and display name shift gracefully to the right (`cardTextRefX: 0.62`), with text wrapping adjusted (`boxWidth - 52`) to prevent visual collisions.
   * On **Heraldic Person nodes (`per`)**, the stereotype glyph hovers with dignity above or beside the green head and shoulder silhouette, eliminating unnecessary rectangular frames. Typography dynamically spaces (`refY: 58 + qualifierLines * 16`) across an expanded boundary (`Math.max(boxWidth, 140)`) to eliminate collisions between qualifiers and titles.
   * On **Place / Venue nodes (`plc`)**, assigning a stereotype transforms the card into a **frameless** entity (`fill: 'transparent', stroke: 'transparent'`), centering the location glyph at the top ($y=8$) in **Net Gold** (`#F59E0B`)—matching the Person and UseCase vector strokes—with centered typography underneath. When unstereotyped, Place nodes render a crisp theme red frame (**Cascais Red** `#D22B2B`) with the legacy blue window header completely excised.

2. **The Cascais Palette & Vector Glyphs:**
   * **🎪 `Stage` (Place / Venue):** Sourced directly from festival stage architecture—a trapezoidal canopy adorned with 4 Net Gold stars across the fascia, dual cross-braced lattice truss towers, an overhead crossbeam rig with 5 hanging spotlights, dual speaker stacks, and a stepped stage deck. Rendered in frameless Net Gold glyph mode.
   * **📍 `Venue` (Place):** The classic Cascais location teardrop pin with a circular aperture cutout hovering over a ground target ring ellipse. Rendered in frameless Net Gold glyph mode.
   * **🍸 `Bar` / `Lounge` (Place / Object):** A refined cocktail martini glass with slender stem, weighted base, and angular olive skewer.
   * **⭐ `Headliner` (Person / Role):** An artist performer crown with three jewels, a Net Gold star medallion, and curved brow band.
   * **🤖 `AI` / `Agent` (Person / Actor):** An autonomous neural processor chip with quad perimeter connector pins and a luminous Net Gold center core.
   * **⚡ `Initiates` (Role / Relation):** A sharp Net Gold directional trigger arrow signifying dynamic stimulus and workflow kickoff.

3. **Ontological Round-Trip Integrity:**
   * In `.raid` and AOAIM models: declared via `stereotype: "Stage"`.
   * In ontological SVG: serialized as `aim-stereotype="Stage"` and embedded as clean, self-contained vector paths inside the node's `<g>` container.
   * In Keynote, Safari, or vector PDF exports: icons render flawlessly with crisp vector geometry at any zoom level.

---

## 5. Wisdom Over Software: The Canvas as a Living Workbench

The *Activity–Object Manifesto* reminds us:
> *"The purpose of software engineering is no longer simply to build software. Its purpose is to capture, organize, evolve and apply the wisdom of a domain."*

A diagram drawn in RaidCanvas is not a vector drawing for a slide deck. It is the visual projection of a living domain model:

1. **The Model Is Primary:** The underlying `.raid` model and its `aim-*` ontological contract exist independently of the canvas viewport.
2. **The Visual Method Signature:** The single-UseCase diagram is the visual signature of an executable method:
   - The Oval (`uc`) defines the operation.
   - The bound Person (`per`) specifies the required KL-ONE role filler.
   - The bound Objects (`obj`) and Places (`plc`) define the execution scope.
3. **The Multimodal Workbench:**
   - **Humans** provide intent, intuition, and spatial arrangement through touch.
   - **AI (Cize, Yebo)** acts as the semantic translator and shock absorber, converting conversational human requests into rigid ontological state changes.
   - **The Model** provides the deterministic agenda via forward and backward chaining.
   - **RaidCanvas** delivers the malleable, touch-first medium that binds them together.

---

## 6. Implementation Architecture in RaidCanvas

The Duality of the Object is realized through concrete engineering across the `@dr2rai/raid-canvas` codebase:

### 6.1 Metamodel Contract (`types.ts`)
* Nodes carry `href?: string` (`AimSvgContract.ATTR_HREF: 'aim-href'`).
* Nodes declare their ontological kind across the full pantheon: `'act' | 'uc' | 'cls' | 'obj' | 'per' | 'plc' | 'rol'`.

### 6.2 SVG Synchronization Bridge (`RaiBridge.ts`)
* When `node.href` is present, `RaiBridge.renderNodeInnerSvg` splits the background shape into the dual-hemisphere structure:
  - Left `<rect>` or `<path>`: The base archetype fill.
  - Right `<rect>` or `<path>`: The translucent Cascais Green portal wash (`class="aim-portal-door"`).
* In standalone vector SVG exports (for Keynote, Safari, Preview, and PDF), the right hemisphere is wrapped in `<a href="${escapedHref}" target="_blank">`, maintaining clickable vector portals outside the browser.

### 6.3 Touch-First Event Dispatch (`RaidCanvas.tsx`)
* `<RaidCanvas />` exposes:
  - `onNodeClick(node, event)`: Fired on left-hemisphere taps; consumed by AIA to toggle the DaisyUI Inspector Drawer.
  - `onNodePortalClick(node, event)`: Fired on right-hemisphere taps; consumed by AIA to execute route transitions.
  - `canvasRef.current.getSvg()`: Synchronous, instantaneous serialization that flushes pending canvas state before any page transition can unmount the DOM.

---

## 7. Epilogue: The Living Slate

Alan Kay often remarked:
> *"Context is worth 80 IQ points."*

When an engineer or an artist looks at a diagram on an iPad, they should not feel the cold distance of a database viewer. They should feel the warmth of dynamic media.

By splitting the object in two, we honor the truth that a fourteen-year-old saw with his colored pencils: that every human being, every process, and every entity in our world has an anchor in the present, and a door into the infinite.

That is the Duality of the Object. That is the foundation of the RaidCanvas architecture.

---

### References
1. Bernd Breutmann; Rainer Burkhardt: *Objektorientierte Systeme: Grundlagen – Werkzeuge – Einsatz*. Carl Hanser Verlag, München/Wien, 1992. ISBN 3-446-16527-4.
2. Ronald J. Brachman; James G. Schmolze: "An Overview of the KL-ONE Knowledge Representation System." *Cognitive Science*, 9 (1985), 171–216.
3. Rainer Burkhardt; Eliza: *The WWWA Architecture: Master Specification for the AfricaStage Backend*. AfricaStage Documentation, March 2026.
4. Rainer Burkhardt et al.: *The Activity–Object Manifesto: Toward Wisdom-Centric Software Engineering in the Age of Artificial Intelligence*. AfricaStage & AIA Platform, 2026.
5. Rainer Burkhardt: *The AfricaStage OT Convergence Manifesto: Evolving the WWWA Ontology into a Native Object Technology Workbench*. July 2026.
6. Alan Kay: *A Personal Computer for Children of All Ages*. Proceedings of the ACM National Conference, Boston, August 1972.
