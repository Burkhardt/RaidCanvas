# CR055: Portuguese Heraldic Flag Alignment in the Glass (Green Hoist / Red Fly)

> **Naming Schema:** `CR<NNN>_<Requester>_to_<Provider>_<Topic>.md`  
> **Immutability Rule:** The provider agent must NEVER rename or modify this document filename.

**Date:** 2026-10-05  
**Requesting Agent / PM:** Adele (`7010`, PM AIA) & Dr. Rainer Burkhardt (`RAI`, Chief Product Officer / Chief Maker)  
**Target Provider / Repo:** RaidCanvas (`@dr2rai/raid-canvas`) & `aia-workbench` — Alan (`7012`, Visual Systems Architect & Glass Lead)  
**Status:** Proposed  
**Parent CR:** N/A (Builds upon [`CR033`](CR033_AIA_to_RaidCanvas_Ontological-deep-linking-and-navigation.md) and [`CR034`](CR034_AIA_to_RaidCanvas_Place-glyph-in-the-Cascais-theme.md))  

---

## 1. Objective & Context

In reviewing the visual language and heraldic styling of the Glass, Dr. Rainer Burkhardt raised a fundamental design and cultural observation regarding the National Flag of Portugal (*Bandeira de Portugal*).

In Portuguese national heraldry:
- **Green (*Verde Esperança*)** is on the **hoist (left side)**.
- **Red (*Vermelho Coragem*)** is on the **fly (right side)**.
- The **Armillary Sphere & Net Gold (*Ouro da Esfera Armilar*)** forms the vertical seam dividing them.

In our current implementation of the Glass (including the Portuguese Duality mechanism, portal doors, and theme accents), green / emerald tinting appears on the right hemisphere. This layout inadvertently inverts the national flag orientation and could be perceived as culturally backwards or critical of Portuguese heritage, akin to displaying a national flag upside down or in reverse.

This Change Request asks Alan (`7012`), as the sovereign custodian of The Glass, to review the existing visual styling and codebase, and determine how best to align the Glass with authentic Portuguese flag semantics.

---

## 2. Desired Direction & Scope

1. **Heraldic Orientation Principle:**
   - Where bicolour Portuguese heraldic styling, duality, or regional accents are represented, the canonical left-to-right orientation must be:
     - **Left (Hoist / Origin):** Green / Emerald.
     - **Center (Seam / Portal):** Gold / Net Gold.
     - **Right (Fly / Execution):** Red.

2. **Alan's Architectural Prerogative:**
   - Alan has complete design authority over how this is realized in `@dr2rai/raid-canvas` (node geometry, door clip paths, state shaders) and in the broader Glass (`aia-workbench`).
   - Alan should assess what changes are required in the canvas and coordinate with Koyo (`7013`, Brand & Art Direction) regarding holistic website or chrome styling if applicable.

---

## 3. Handover & Acceptance

- [ ] Alan reviews the codebase and confirms acceptance of the CR.
- [ ] Alan provides his architectural assessment of affected components across `RaidCanvas` and `aia-workbench`.
- [ ] Heraldic visual elements render with Green on the left (hoist) and Red on the right (fly).
