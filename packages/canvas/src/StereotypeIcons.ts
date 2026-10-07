/**
 * @file StereotypeIcons.ts
 * @description Vector stereotype iconography for the AOAIM / WWWA ontological contract.
 *
 * Implements Dr. Rainer Burkhardt's 1990s Object-Technology Workbench (OTW) visual stereotypes
 * and the WWWA Ontology v1.3 release (Vasco `7015`):
 * - Stage: Festival truss concert stage with canopy, stars, lattice towers, spotlights, and steps.
 * - Venue: Cascais teardrop location pin with circular aperture and ground target ellipse.
 * - Bar: Hospitality cocktail martini glass with stem, base, and olive pick.
 * - Headliner: Performer crown / artist star badge.
 * - AI: Autonomous agent / neural processor chip with circuitry pins.
 * - Contract, Law, Court, Certificate, Checklist: the document family for Objects (Koyo `7013`). They are
 *   named and resolved here; their drawings, like every free-standing Shape's, are records in
 *   `ShapeFigures.ts`.
 *
 * Fully integrated with the Cascais Palette and the Two-Tap Dynabook Duality philosophy:
 * Stereotype icons live in the Left Hemisphere (The Persona / The Anchor), remaining pristine
 * during dormant and awakened states.
 */

import { CascaisPalette } from './X6Shapes.js';

/** The Shapes only an Object can wear: documents, each drawn on the same sheet. */
export type ObjectShapeId = 'contract' | 'law' | 'court' | 'certificate' | 'checklist';

export type StereotypeId = 'stage' | 'venue' | 'bar' | 'customer' | 'headliner' | 'ai' | 'initiates' | 'system' | 'lead' | 'observer' | ObjectShapeId;

/**
 * The words that name each Object Shape. Law is legislation and Court is a ruling that interprets a
 * law; both are documents, so neither is ever drawn as a building.
 */
const OBJECT_SHAPE_WORDS: Record<ObjectShapeId, readonly string[]> = {
  contract: ['contract'],
  law: ['law', 'legislation'],
  court: ['court', 'ruling'],
  certificate: ['certificate'],
  checklist: ['checklist', 'runbook'],
};

function objectShapeOf(token: string): ObjectShapeId | undefined {
  return (Object.keys(OBJECT_SHAPE_WORDS) as ObjectShapeId[]).find((id) => OBJECT_SHAPE_WORDS[id].includes(token));
}

export function isObjectShape(id: StereotypeId | undefined): id is ObjectShapeId {
  return id !== undefined && id in OBJECT_SHAPE_WORDS;
}

/** How a Contract is drawn for its object's state: plain, with a pen (`ReadyToSign`) or with a tick (`Approved`). */
export type ContractState = 'default' | 'readyToSign' | 'approved';

/** Read a Contract's drawing off the object's state, however the state is spelled. */
export function contractStateOf(state: string | null | undefined): ContractState {
  const key = (state ?? '').replace(/[\s_-]+/g, '').toLowerCase();
  if (key === 'readytosign') return 'readyToSign';
  if (key === 'approved') return 'approved';
  return 'default';
}

export interface StereotypeDefinition {
  id: StereotypeId;
  name: string;
  targetPit: 'Place' | 'Person' | 'Object' | 'Activity';
  description: string;
  width: number;
  height: number;
}

export const KNOWN_STEREOTYPES: Record<StereotypeId, StereotypeDefinition> = {
  observer: {
    id: 'observer',
    name: 'Observer',
    targetPit: 'Person',
    description: 'Supervisory observer or board member of an Activity (ADR-0008).',
    width: 24,
    height: 18,
  },
  lead: {
    id: 'lead',
    name: 'Lead',
    targetPit: 'Person',
    description: 'Lead role / Helmsman at the wheel (rudder).',
    width: 36,
    height: 36,
  },
  stage: {
    id: 'stage',
    name: 'Stage',
    targetPit: 'Place',
    description: 'Live Performance Stage with festival truss, canopy roof, spotlights, and stage steps.',
    width: 48,
    height: 44,
  },
  venue: {
    id: 'venue',
    name: 'Venue',
    targetPit: 'Place',
    description: 'Cascais Location Pin with aperture and ground target ellipse (Actor-sized glyph).',
    width: 45,
    height: 54,
  },
  bar: {
    id: 'bar',
    name: 'Bar',
    targetPit: 'Place',
    description: 'Bar and hospitality cocktail glass with olive pick.',
    width: 44,
    height: 48,
  },
  customer: {
    id: 'customer',
    name: 'Customer',
    targetPit: 'Person',
    description: 'Customer or buyer with crown on head.',
    width: 24,
    height: 24,
  },
  headliner: {
    id: 'headliner',
    name: 'Headliner',
    targetPit: 'Person',
    description: 'Headliner artist performer with hollow 5-point star on chest.',
    width: 16,
    height: 16,
  },
  ai: {
    id: 'ai',
    name: 'AI',
    targetPit: 'Person',
    description: 'Autonomous machine actor / neural processor chip.',
    width: 24,
    height: 24,
  },
  initiates: {
    id: 'initiates',
    name: 'initiates',
    targetPit: 'Person',
    description: 'Initiating role or trigger actor.',
    width: 20,
    height: 20,
  },
  system: {
    id: 'system',
    name: 'System',
    targetPit: 'Person',
    description: 'System or backend server stack actor (dual-chassis rack).',
    width: 44,
    height: 44,
  },
  contract: {
    id: 'contract',
    name: 'Contract',
    targetPit: 'Object',
    description: 'Binding agreement on a document sheet; a pen when ready to sign, a tick when approved.',
    width: 36,
    height: 50,
  },
  law: {
    id: 'law',
    name: 'Law',
    targetPit: 'Object',
    description: 'Legislation: a document sheet carrying the section mark.',
    width: 36,
    height: 50,
  },
  court: {
    id: 'court',
    name: 'Court',
    targetPit: 'Object',
    description: 'A ruling that interprets a law: a document sheet carrying a gavel.',
    width: 36,
    height: 50,
  },
  certificate: {
    id: 'certificate',
    name: 'Certificate',
    targetPit: 'Object',
    description: 'Certified document: a sheet with a gold seal and ribbon tails.',
    width: 36,
    height: 50,
  },
  checklist: {
    id: 'checklist',
    name: 'Checklist',
    targetPit: 'Object',
    description: 'Checklist or runbook: a clipboard with ticked and open rows.',
    width: 34,
    height: 50,
  },
};

/**
 * Checks whether an arbitrary stereotype string or array includes 'initiates' / 'initiator'.
 */
export function isInitiatingStereotype(rawStereotype?: string | readonly string[]): boolean {
  if (!rawStereotype) return false;
  const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
  for (const item of items) {
    if (!item) continue;
    const cleaned = String(item).replace(/[«»"]/g, '').toLowerCase();
    const tokens = cleaned.split(/[\s,]+/);
    for (const token of tokens) {
      if (token === 'initiates' || token === 'initiator') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks whether an arbitrary stereotype string or array includes a specific target StereotypeId.
 */
export function hasStereotype(rawStereotype: string | readonly string[] | undefined, target: StereotypeId): boolean {
  if (!rawStereotype) return false;
  const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
  for (const item of items) {
    if (!item) continue;
    const cleaned = String(item).replace(/[«»"]/g, '').toLowerCase().trim();
    const tokens = cleaned.split(/[\s,]+/);
    for (const token of tokens) {
      if (target === 'lead' && ['lead', 'leader', 'helm', 'helmsman', 'rudder', 'captain'].includes(token)) return true;
      if (target === 'headliner' && ['headliner', 'artist', 'star'].includes(token)) return true;
      if (target === 'customer' && ['customer', 'client', 'buyer', 'patron'].includes(token)) return true;
      if (target === 'stage' && token === 'stage') return true;
      if (target === 'venue' && ['venue', 'place', 'pin'].includes(token)) return true;
      if (target === 'bar' && ['bar', 'hospitality'].includes(token)) return true;
      if (target === 'ai' && ['ai', 'agent', 'bot'].includes(token)) return true;
      if (target === 'system' && ['system', 'server', 'service', 'daemon', 'backend'].includes(token)) return true;
      if (target === 'observer' && ['observer', 'observes', 'supervisory', 'supervisor', 'board', 'oversight'].includes(token)) return true;
      if (target === 'initiates' && ['initiates', 'initiator'].includes(token)) return true;
      if (isObjectShape(target) && OBJECT_SHAPE_WORDS[target].includes(token)) return true;
    }
  }
  return false;
}

/**
 * Normalizes an arbitrary stereotype string (e.g. "«Stage»", "Stage", "venue", "Stage, Bar", "Bar, initiates")
 * or array of stereotypes (per Ontology v1.3: e.g. ["Bar", "initiates"], ["initiates", "Stage"])
 * to a canonical known StereotypeId, or undefined if unrecognized.
 *
 * Prioritizes domain stereotypes (Stage, Venue, Bar, Customer, Headliner, AI, System, Observer).
 * If no domain stereotype is present, falls back to 'initiates' if present.
 *
 * Pass the node's `kind` to make the result shape-aware: on a Place the first Stage / Venue / Bar
 * decides the shape, whatever Lead or Headliner precedes it. On an Object the first Contract / Law /
 * Court / Certificate / Checklist does; those are documents and resolve on no other kind.
 */
export function resolveStereotype(rawStereotype?: string | readonly string[], kind?: string): StereotypeId | undefined {
  if (!rawStereotype) return undefined;

  if (kind === 'plc') {
    const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
    for (const item of items) {
      for (const token of String(item ?? '').replace(/[«»"]/g, '').toLowerCase().trim().split(/[\s,]+/)) {
        if (token === 'stage') return 'stage';
        if (token === 'venue' || token === 'place' || token === 'pin') return 'venue';
        if (token === 'bar' || token === 'hospitality') return 'bar';
      }
    }
  }

  if (kind === 'obj') {
    const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
    for (const item of items) {
      for (const token of String(item ?? '').replace(/[«»"]/g, '').toLowerCase().trim().split(/[\s,]+/)) {
        const shape = objectShapeOf(token);
        if (shape) return shape;
        // System is an Object's Shape too, so it competes in the order written.
        if (hasStereotype(token, 'system')) return 'system';
      }
    }
  }

  // Dual-Stereotype Persona Rule:
  // If an actor carries both Lead and Headliner (in any order, e.g. "Headliner, Lead" or "Lead, Headliner"),
  // it must resolve to 'lead' so that the Helmsman wheel is rendered and the Headliner star medal is displayed.
  if (hasStereotype(rawStereotype, 'lead') && hasStereotype(rawStereotype, 'headliner')) {
    return 'lead';
  }

  const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
  let foundInitiates = false;

  for (const item of items) {
    if (!item) continue;
    const cleaned = String(item).replace(/[«»"]/g, '').toLowerCase().trim();
    const tokens = cleaned.split(/[\s,]+/);

    for (const token of tokens) {
      if (token === 'lead' || token === 'leader' || token === 'helm' || token === 'helmsman' || token === 'rudder' || token === 'captain') return 'lead';
      if (token === 'stage') return 'stage';
      if (token === 'venue' || token === 'place' || token === 'pin') return 'venue';
      if (token === 'bar' || token === 'hospitality') return 'bar';
      if (token === 'customer' || token === 'client' || token === 'buyer' || token === 'patron') return 'customer';
      if (token === 'headliner' || token === 'artist' || token === 'star') return 'headliner';
      if (token === 'observer' || token === 'observes' || token === 'supervisory' || token === 'supervisor' || token === 'board' || token === 'oversight') return 'observer';
      if (token === 'ai' || token === 'agent' || token === 'bot') return 'ai';
      if (token === 'system' || token === 'server' || token === 'service' || token === 'daemon' || token === 'backend') return 'system';
      if (token === 'initiates' || token === 'initiator') foundInitiates = true;
    }
  }

  return foundInitiates ? 'initiates' : undefined;
}

export interface StereotypePaths {
  strokeD: string;
  fillD: string;
  accentFillD?: string;
  pinD?: string;
  starsD?: string;
  width: number;
  height: number;
}

/**
 * Generates exact vector path coordinates for a known stereotype icon in local bounds.
 */
export function getStereotypePaths(id: StereotypeId): StereotypePaths {
  switch (id) {
    case 'stage': {
      // 1. Festival Truss Stage (media_1789692974058.png)
      // Bounding box: 48 x 44 (matching Actor and Venue stature)
      const fillD = [
        // Canopy Roof trapezoid
        'M 3.5 9.6 L 9.6 2.6 H 38.4 L 44.5 9.6 Z',
        // Left Tower Base pad
        'M 3.5 35.8 H 15.7 V 40.2 H 3.5 Z',
        // Right Tower Base pad
        'M 32.3 35.8 H 44.5 V 40.2 H 32.3 Z',
        // Left Speaker Cabinet
        'M 15 22.7 H 21 V 34 H 15 Z',
        // Right Speaker Cabinet
        'M 27 22.7 H 33 V 34 H 27 Z',
        // Front Stage Stepped Planks
        'M 15 35.8 H 33 V 38 H 15 Z',
        'M 16.5 38.8 H 31.5 V 41 H 16.5 Z',
      ].join(' ');

      const strokeD = [
        // Crossbeam rig under canopy
        'M 13 11.4 H 35',
        // Left Truss Uprights & Lattice Cross Braces
        'M 6 9.6 V 35.8 M 13 9.6 V 35.8',
        'M 6 9.6 L 13 18.3 M 13 9.6 L 6 18.3',
        'M 6 18.3 L 13 27 M 13 18.3 L 6 27',
        'M 6 27 L 13 35.8 M 13 27 L 6 35.8',
        // Right Truss Uprights & Lattice Cross Braces
        'M 35 9.6 V 35.8 M 42 9.6 V 35.8',
        'M 35 9.6 L 42 18.3 M 42 9.6 L 35 18.3',
        'M 35 18.3 L 42 27 M 42 18.3 L 35 27',
        'M 35 27 L 42 35.8 M 42 27 L 35 35.8',
        // 5 Spotlights hanging from rig
        'M 16.5 11.4 L 14.8 15.7',
        'M 20.5 11.4 V 15.7',
        'M 24 11.4 V 15.7',
        'M 27.5 11.4 V 15.7',
        'M 31.5 11.4 L 33.2 15.7',
        // Stage Main Floor Deck
        'M 13 34 H 35',
      ].join(' ');

      // 4 Stars on Canopy Roof (Chalk White / Net Gold)
      const starsD = [
        'M 14 3.8 L 14.7 5.6 L 16.6 5.8 L 15.2 7.2 L 15.6 9.1 L 14 8 L 12.4 9.1 L 12.8 7.2 L 11.4 5.8 L 13.3 5.6 Z',
        'M 21 3.8 L 21.7 5.6 L 23.6 5.8 L 22.2 7.2 L 22.6 9.1 L 21 8 L 19.4 9.1 L 19.8 7.2 L 18.4 5.8 L 20.3 5.6 Z',
        'M 28 3.8 L 28.7 5.6 L 30.6 5.8 L 29.2 7.2 L 29.6 9.1 L 28 8 L 26.4 9.1 L 26.8 7.2 L 25.4 5.8 L 27.3 5.6 Z',
        'M 35 3.8 L 35.7 5.6 L 37.6 5.8 L 36.2 7.2 L 36.6 9.1 L 35 8 L 33.4 9.1 L 33.8 7.2 L 32.4 5.8 L 34.3 5.6 Z',
      ].join(' ');

      return { strokeD, fillD, starsD, width: 48, height: 44 };
    }

    case 'venue': {
      // 2. Cascais Location Pin (media_1789674495092.png)
      // Bounding box: 45 x 54 (Tall glyph matching 50% sized-up Actor glyph stature)
      const strokeD = [
        // Teardrop outer contour
        'M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z',
        // Inner aperture circle
        'M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z',
        // Ground target ellipse ring
        'M 7.5 49.5 C 7.5 47.25 14.25 45.75 22.5 45.75 C 30.75 45.75 37.5 47.25 37.5 49.5 C 37.5 51.75 30.75 53.25 22.5 53.25 C 14.25 53.25 7.5 51.75 7.5 49.5 Z',
      ].join(' ');

      const fillD = [
        // Solid pin fill with cutout aperture
        'M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z',
      ].join(' ');

      return { strokeD, fillD, width: 45, height: 54 };
    }

    case 'bar': {
      // 3. Hospitality / Bar Cocktail Glass (media_1789692945215.png)
      // Bounding box: 44 x 48 (matching Actor and Venue stature)
      const strokeD = [
        // V-shaped martini bowl and stem
        'M 7 8 H 37 L 22 28 V 44',
        // Base plate
        'M 12 44 H 32',
        // Olive toothpick
        'M 8 8 L 34 2',
      ].join(' ');

      const fillD = [
        // Liquid fill in bowl
        'M 12.25 15 H 31.75 L 22 28 Z',
      ].join(' ');

      const accentFillD = [
        // Olive dot
        'M 24 9.5 A 2.2 2.2 0 1 1 23.9 9.5 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 44, height: 48 };
    }

    case 'customer': {
      // 4. Customer / Buyer Crown on Head
      // Bounding box: 24 x 24
      const fillD = [
        // Crown body
        'M 4 17.5 L 4 9.5 L 8.5 13 L 12 7 L 15.5 13 L 20 9.5 L 20 17.5 Z',
        // Crown base band
        'M 4 17.5 H 20 V 20 H 4 Z',
      ].join(' ');

      const strokeD = [
        'M 4 17.5 L 4 9.5 L 8.5 13 L 12 7 L 15.5 13 L 20 9.5 L 20 17.5 Z M 4 17.5 H 20 V 20 H 4 Z',
      ].join(' ');

      const accentFillD = [
        // Three jewels on points
        'M 4 9.5 A 1 1 0 1 1 3.9 9.5 Z',
        'M 12 7 A 1 1 0 1 1 11.9 7 Z',
        'M 20 9.5 A 1 1 0 1 1 19.9 9.5 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 24, height: 24 };
    }

    case 'headliner': {
      // 5. Headliner Artist 5-Point Star on Chest (media_1789693770549.png)
      // Bounding box: 16 x 16, hollow with rounded joins
      const strokeD = 'M 8 0.5 L 10.1 5.1 L 15.6 5.5 L 11.4 9.1 L 12.7 14.5 L 8 11.6 L 3.3 14.5 L 4.6 9.1 L 0.4 5.5 L 5.9 5.1 Z';
      const fillD = '';
      return { strokeD, fillD, width: 16, height: 16 };
    }

    case 'ai': {
      // 6. AI Neural Processor Chip
      // Bounding box: 24 x 24
      const strokeD = [
        // Circuitry pins
        'M 9.5 4.5 V 7.5 M 12 4.5 V 7.5 M 14.5 4.5 V 7.5',
        'M 9.5 16.5 V 19.5 M 12 16.5 V 19.5 M 14.5 16.5 V 19.5',
        'M 4.5 9.5 H 7.5 M 4.5 12 H 7.5 M 4.5 14.5 H 7.5',
        'M 16.5 9.5 H 19.5 M 16.5 12 H 19.5 M 16.5 14.5 H 19.5',
        // Chip boundary
        'M 7.5 7.5 H 16.5 V 16.5 H 7.5 Z',
      ].join(' ');

      const fillD = [
        // Chip body
        'M 7.5 7.5 H 16.5 V 16.5 H 7.5 Z',
      ].join(' ');

      const accentFillD = [
        // Neural core spark / diamond in center
        'M 12 9.5 L 14.5 12 L 12 14.5 L 9.5 12 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 24, height: 24 };
    }

    case 'system': {
      // 7. System / Server Stack Actor (media_1789695646331.png)
      // Bounding box: 44 x 44 (matching Actor stature)
      const fillD = [
        // Top chassis body
        'M 6 3 H 38 A 4 4 0 0 1 42 7 V 15 A 4 4 0 0 1 38 19 H 6 A 4 4 0 0 1 2 15 V 7 A 4 4 0 0 1 6 3 Z',
        // Bottom chassis body
        'M 6 25 H 38 A 4 4 0 0 1 42 29 V 37 A 4 4 0 0 1 38 41 H 6 A 4 4 0 0 1 2 37 V 29 A 4 4 0 0 1 6 25 Z',
      ].join(' ');

      const strokeD = [
        // Top chassis outer border
        'M 6 3 H 38 A 4 4 0 0 1 42 7 V 15 A 4 4 0 0 1 38 19 H 6 A 4 4 0 0 1 2 15 V 7 A 4 4 0 0 1 6 3 Z',
        // Bottom chassis outer border
        'M 6 25 H 38 A 4 4 0 0 1 42 29 V 37 A 4 4 0 0 1 38 41 H 6 A 4 4 0 0 1 2 37 V 29 A 4 4 0 0 1 6 25 Z',
        // Left & Right connecting neck uprights
        'M 13 19 V 25 M 31 19 V 25',
      ].join(' ');

      const accentFillD = [
        // Top chassis: LED dot and drive bay slot
        'M 10 8.8 A 2.2 2.2 0 1 1 9.9 8.8 Z',
        'M 17 9.5 H 33.5 A 1.5 1.5 0 0 1 35 11 A 1.5 1.5 0 0 1 33.5 12.5 H 17 A 1.5 1.5 0 0 1 15.5 11 A 1.5 1.5 0 0 1 17 9.5 Z',
        // Bottom chassis: LED dot and drive bay slot
        'M 10 30.8 A 2.2 2.2 0 1 1 9.9 30.8 Z',
        'M 17 31.5 H 33.5 A 1.5 1.5 0 0 1 35 33 A 1.5 1.5 0 0 1 33.5 34.5 H 17 A 1.5 1.5 0 0 1 15.5 33 A 1.5 1.5 0 0 1 17 31.5 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 44, height: 44 };
    }

    case 'lead': {
      // 8. Lead Role: Sketch Offset (Δ = 45.0°) Helmsman Rudder Wheel (media_1790622846477.png)
      // Hub at (0, 0) (translated to cx - 12, 58 in actor frame, i.e. 48, 58 when cx=60).
      // 4 Spokes: 165°, 120°, 75°, 30° (strictly equidistant Δ = 45°).
      // Spokes start at chest horizon y = -4 (y = 54 in actor frame) up to peg tips:
      // - 165°: (-14.9, -4.0) -> (-21.7, -5.8)
      // - 120°: (-2.3, -4.0) -> (-11.2, -19.5)
      // - 75°:  (1.1, -4.0) -> (5.8, -21.7)   [apex at y=-22.5, 4.5px air gap below chin]
      // - 30°:  (6.9, -4.0) -> (19.5, -11.2) [forearm contact meets 30° peg at (20, -11)]
      // Outer rim arc: R = 18 from (-17.4, -4.7) to (15.6, -9.0)
      const strokeD = [
        'M -14.9 -4 L -21.7 -5.8',
        'M -2.3 -4 L -11.2 -19.5',
        'M 1.1 -4 L 5.8 -21.7',
        'M 6.9 -4 L 19.5 -11.2',
        'M -17.4 -4.7 A 18 18 0 0 1 15.6 -9.0',
      ].join(' ');

      // 4 Handle Peg Knob Caps (R=1.5 dual-semicircles) at peg tips:
      // (-22.5, -6.0), (-12.0, -20.5), (6.0, -22.5), (20.5, -11.8)
      const fillD = [
        'M -24.0 -6.0 A 1.5 1.5 0 1 1 -21.0 -6.0 A 1.5 1.5 0 1 1 -24.0 -6.0 Z',
        'M -13.5 -20.5 A 1.5 1.5 0 1 1 -10.5 -20.5 A 1.5 1.5 0 1 1 -13.5 -20.5 Z',
        'M 4.5 -22.5 A 1.5 1.5 0 1 1 7.5 -22.5 A 1.5 1.5 0 1 1 4.5 -22.5 Z',
        'M 19.0 -11.8 A 1.5 1.5 0 1 1 22.0 -11.8 A 1.5 1.5 0 1 1 19.0 -11.8 Z',
      ].join(' ');

      // Headliner Star shifted to center chest (60.5, 45) per Dr. Rainer's sketch (media_1790624147859.png)
      // Centered at (+12.5, -13.0) relative to hub, nestling between 75° spoke and steering arm
      const starsD = 'M 12.5 -16.5 L 13.8 -13.8 L 16.8 -13.5 L 14.5 -11.4 L 15.3 -8.5 L 12.5 -10.0 L 9.7 -8.5 L 10.5 -11.4 L 8.2 -13.5 L 11.2 -13.8 Z';

      return { strokeD, fillD, starsD, width: 44, height: 24 };
    }

    case 'observer': {
      // 9. Observer / Supervisory Board Member (ADR-0008, aim-observer-icon.svg)
      // Bounding box: 24 x 18
      const strokeD = [
        'M 2 9.5 C 6 4 18 4 22 9.5 C 18 15 6 15 2 9.5 Z',
        'M 7.8 9.5 A 4.2 4.2 0 1 0 16.2 9.5 A 4.2 4.2 0 1 0 7.8 9.5 Z',
        'M 4.5 4 Q 12 1.8 19.5 4',
      ].join(' ');

      const fillD = [
        'M 9.8 9.5 A 2.2 2.2 0 1 0 14.2 9.5 A 2.2 2.2 0 1 0 9.8 9.5 Z',
      ].join(' ');

      const accentFillD = [
        'M 13.5 8.2 A 0.7 0.7 0 1 1 13.4 8.2 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 24, height: 18 };
    }

    case 'initiates':
    default: {
      const strokeD = 'M 6 10 L 12 4 L 18 10 M 12 5 V 16';
      const fillD = '';
      return { strokeD, fillD, width: 20, height: 20 };
    }
  }
}

/**
 * Renders an embedded SVG group for a stereotype icon, suitable for inclusion in
 * SVG documents (e.g. RaiBridge.renderNodeInnerSvg).
 */
export function renderStereotypeIconSvg(
  rawStereotype: string | readonly string[] | undefined,
  x: number,
  y: number,
  primaryColor: string = CascaisPalette.WarmGraphite,
  _accentColor: string = CascaisPalette.NetGold,
  transformOverride?: string,
  kind?: string,
): string {
  const resolved = resolveStereotype(rawStereotype, kind);
  if (!resolved) return '';

  const isInitiating = isInitiatingStereotype(rawStereotype);
  const strokeColor = isInitiating ? CascaisPalette.NetGoldStroke : primaryColor;
  const paths = getStereotypePaths(resolved);
  const transform = transformOverride ?? `translate(${x}, ${y})`;
  let svg = `      <g class="aim-stereotype-icon aim-icon-${resolved}" transform="${transform}">\n`;

  if (resolved === 'stage') {
    // Stage canopy, rig, and stars
    svg += `        <path d="${paths.fillD}" fill="${CascaisPalette.ChalkWhite}" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.starsD) {
      svg += `        <path d="${paths.starsD}" fill="${strokeColor}" />\n`;
    }
  } else if (resolved === 'venue') {
    // Cascais pin with ground ring (Chalk White body with strokeColor outline)
    svg += `        <path d="${paths.fillD}" fill="${CascaisPalette.ChalkWhite}" fill-rule="evenodd" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />\n`;
  } else if (resolved === 'bar') {
    // Hospitality cocktail glass with olive
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.fillD) svg += `        <path d="${paths.fillD}" fill="${CascaisPalette.ChalkWhite}" opacity="0.4" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${strokeColor}" />\n`;
  } else if (resolved === 'customer') {
    svg += `        <path d="${paths.fillD}" fill="${CascaisPalette.NetGold}" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="1.2" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${CascaisPalette.ChalkWhite}" />\n`;
  } else if (resolved === 'lead') {
    // Sketch Offset (Δ = 45.0°) Helmsman Rudder Wheel
    svg += `        <g stroke="${CascaisPalette.NetGoldStroke}" stroke-linecap="round">\n`;
    svg += `          <path d="${paths.strokeD}" fill="none" stroke-width="2.0" stroke-linejoin="round" />\n`;
    if (paths.fillD) svg += `          <path d="${paths.fillD}" fill="${CascaisPalette.NetGold}" />\n`;
    svg += `        </g>\n`;
    if (hasStereotype(rawStereotype, 'headliner') && paths.starsD) {
      svg += `        <path d="${paths.starsD}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />\n`;
    }
  } else if (resolved === 'headliner') {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />\n`;
  } else if (resolved === 'observer') {
    // Observer supervisory eye glyph — True Cyclops (ADR-0008)
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.fillD) svg += `        <path d="${paths.fillD}" fill="${strokeColor}" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${CascaisPalette.NetGold}" />\n`;
  } else if (resolved === 'ai') {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.4" stroke-linecap="round" />\n`;
    svg += `        <path d="${paths.fillD}" fill="${strokeColor}" opacity="0.12" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${strokeColor}" />\n`;
  } else if (resolved === 'system') {
    svg += `        <path d="${paths.fillD}" fill="${CascaisPalette.ChalkWhite}" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${strokeColor}" />\n`;
  } else {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" />\n`;
  }

  svg += `      </g>\n`;
  return svg;
}
