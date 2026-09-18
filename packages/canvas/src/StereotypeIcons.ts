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
 *
 * Fully integrated with the Cascais Palette and the Two-Tap Dynabook Duality philosophy:
 * Stereotype icons live in the Left Hemisphere (The Persona / The Anchor), remaining pristine
 * during dormant and awakened states.
 */

import { CascaisPalette } from './X6Shapes.js';

export type StereotypeId = 'stage' | 'venue' | 'bar' | 'customer' | 'headliner' | 'ai' | 'initiates' | 'system';

export interface StereotypeDefinition {
  id: StereotypeId;
  name: string;
  targetPit: 'Place' | 'Person' | 'Object' | 'Activity';
  description: string;
  width: number;
  height: number;
}

export const KNOWN_STEREOTYPES: Record<StereotypeId, StereotypeDefinition> = {
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
 * Normalizes an arbitrary stereotype string (e.g. "«Stage»", "Stage", "venue", "Stage, Bar", "Bar, initiates")
 * or array of stereotypes (per Ontology v1.3: e.g. ["Bar", "initiates"], ["initiates", "Stage"])
 * to a canonical known StereotypeId, or undefined if unrecognized.
 *
 * Prioritizes domain stereotypes (Stage, Venue, Bar, Customer, Headliner, AI, System).
 * If no domain stereotype is present, falls back to 'initiates' if present.
 */
export function resolveStereotype(rawStereotype?: string | readonly string[]): StereotypeId | undefined {
  if (!rawStereotype) return undefined;

  const items = Array.isArray(rawStereotype) ? rawStereotype : [String(rawStereotype)];
  let foundInitiates = false;

  for (const item of items) {
    if (!item) continue;
    const cleaned = String(item).replace(/[«»"]/g, '').toLowerCase().trim();
    const tokens = cleaned.split(/[\s,]+/);

    for (const token of tokens) {
      if (token === 'stage') return 'stage';
      if (token === 'venue' || token === 'place' || token === 'pin') return 'venue';
      if (token === 'bar' || token === 'hospitality') return 'bar';
      if (token === 'customer' || token === 'client' || token === 'buyer' || token === 'patron') return 'customer';
      if (token === 'headliner' || token === 'artist' || token === 'star') return 'headliner';
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
): string {
  const resolved = resolveStereotype(rawStereotype);
  if (!resolved) return '';

  const isInitiating = isInitiatingStereotype(rawStereotype);
  const strokeColor = isInitiating ? CascaisPalette.NetGold : primaryColor;
  const paths = getStereotypePaths(resolved);
  let svg = `      <g class="aim-stereotype-icon aim-icon-${resolved}" transform="translate(${x}, ${y})">\n`;

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
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${CascaisPalette.NetGold}" stroke-width="1.2" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${CascaisPalette.ChalkWhite}" />\n`;
  } else if (resolved === 'headliner') {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${CascaisPalette.NetGold}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />\n`;
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
