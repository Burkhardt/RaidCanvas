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

export type StereotypeId = 'stage' | 'venue' | 'bar' | 'headliner' | 'ai' | 'initiates';

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
    width: 28,
    height: 24,
  },
  venue: {
    id: 'venue',
    name: 'Venue',
    targetPit: 'Place',
    description: 'Cascais Location Pin with aperture and ground target ellipse.',
    width: 24,
    height: 26,
  },
  bar: {
    id: 'bar',
    name: 'Bar',
    targetPit: 'Place',
    description: 'Bar and hospitality cocktail glass with olive pick.',
    width: 24,
    height: 24,
  },
  headliner: {
    id: 'headliner',
    name: 'Headliner',
    targetPit: 'Person',
    description: 'Headliner artist performer crown and star badge.',
    width: 24,
    height: 24,
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
};

/**
 * Normalizes an arbitrary stereotype string (e.g. "«Stage»", "Stage", "venue", "Stage, Bar")
 * to a canonical known StereotypeId, or undefined if unrecognized.
 */
export function resolveStereotype(rawStereotype?: string): StereotypeId | undefined {
  if (!rawStereotype) return undefined;

  const cleaned = rawStereotype.replace(/[«»"]/g, '').toLowerCase().trim();
  const tokens = cleaned.split(/[\s,]+/);

  for (const token of tokens) {
    if (token === 'stage') return 'stage';
    if (token === 'venue' || token === 'place' || token === 'pin') return 'venue';
    if (token === 'bar' || token === 'hospitality') return 'bar';
    if (token === 'headliner' || token === 'artist' || token === 'star') return 'headliner';
    if (token === 'ai' || token === 'agent' || token === 'bot') return 'ai';
    if (token === 'initiates' || token === 'initiator') return 'initiates';
  }

  return undefined;
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
      // 1. Festival Truss Stage (media_1789674487269.png)
      // Bounding box: 28 x 24
      const fillD = [
        // Canopy Roof trapezoid
        'M 2 5.5 L 5.5 1.5 H 22.5 L 26 5.5 Z',
        // Left Tower Base pad
        'M 2 20.5 H 9 V 23 H 2 Z',
        // Right Tower Base pad
        'M 19 20.5 H 26 V 23 H 19 Z',
        // Left Speaker Cabinet
        'M 8.5 13 H 12 V 19.5 H 8.5 Z',
        // Right Speaker Cabinet
        'M 16 13 H 19.5 V 19.5 H 16 Z',
        // Front Stage Stepped Planks
        'M 8.5 20.5 H 19.5 V 21.8 H 8.5 Z',
        'M 9.5 22.2 H 18.5 V 23.5 H 9.5 Z',
      ].join(' ');

      const strokeD = [
        // Crossbeam rig under canopy
        'M 7.5 6.5 H 20.5',
        // Left Truss Uprights & Lattice Cross Braces
        'M 3.5 5.5 V 20.5 M 7.5 5.5 V 20.5',
        'M 3.5 5.5 L 7.5 10.5 M 7.5 5.5 L 3.5 10.5',
        'M 3.5 10.5 L 7.5 15.5 M 7.5 10.5 L 3.5 15.5',
        'M 3.5 15.5 L 7.5 20.5 M 7.5 15.5 L 3.5 20.5',
        // Right Truss Uprights & Lattice Cross Braces
        'M 20.5 5.5 V 20.5 M 24.5 5.5 V 20.5',
        'M 20.5 5.5 L 24.5 10.5 M 24.5 5.5 L 20.5 10.5',
        'M 20.5 10.5 L 24.5 15.5 M 24.5 10.5 L 20.5 15.5',
        'M 20.5 15.5 L 24.5 20.5 M 24.5 15.5 L 20.5 20.5',
        // 5 Spotlights hanging from rig
        'M 9.5 6.5 L 8.5 9',
        'M 11.8 6.5 V 9',
        'M 14 6.5 V 9',
        'M 16.2 6.5 V 9',
        'M 18.5 6.5 L 19.5 9',
        // Stage Main Floor Deck
        'M 7.5 19.5 H 20.5',
      ].join(' ');

      // 4 Stars on Canopy Roof (Chalk White / Net Gold)
      const starsD = [
        'M 8 2.2 L 8.4 3.2 L 9.5 3.3 L 8.7 4.1 L 8.9 5.2 L 8 4.6 L 7.1 5.2 L 7.3 4.1 L 6.5 3.3 L 7.6 3.2 Z',
        'M 12 2.2 L 12.4 3.2 L 13.5 3.3 L 12.7 4.1 L 12.9 5.2 L 12 4.6 L 11.1 5.2 L 11.3 4.1 L 10.5 3.3 L 11.6 3.2 Z',
        'M 16 2.2 L 16.4 3.2 L 17.5 3.3 L 16.7 4.1 L 16.9 5.2 L 16 4.6 L 15.1 5.2 L 15.3 4.1 L 14.5 3.3 L 15.6 3.2 Z',
        'M 20 2.2 L 20.4 3.2 L 21.5 3.3 L 20.7 4.1 L 20.9 5.2 L 20 4.6 L 19.1 5.2 L 19.3 4.1 L 18.5 3.3 L 19.6 3.2 Z',
      ].join(' ');

      return { strokeD, fillD, starsD, width: 28, height: 24 };
    }

    case 'venue': {
      // 2. Cascais Location Pin (media_1789674495092.png)
      // Bounding box: 24 x 26
      // Teardrop pin + ground ellipse
      const strokeD = [
        // Teardrop outer contour
        'M 12 20.5 C 8.2 15.5 5.5 12.3 5.5 9 A 6.5 6.5 0 1 1 18.5 9 C 18.5 12.3 15.8 15.5 12 20.5 Z',
        // Inner aperture circle
        'M 12 6.5 A 2.5 2.5 0 1 0 12 11.5 A 2.5 2.5 0 1 0 12 6.5 Z',
        // Ground target ellipse ring
        'M 5.5 22.5 C 5.5 21.2 8.4 20.2 12 20.2 C 15.6 20.2 18.5 21.2 18.5 22.5 C 18.5 23.8 15.6 24.8 12 24.8 C 8.4 24.8 5.5 23.8 5.5 22.5 Z',
      ].join(' ');

      const fillD = [
        // Solid pin fill with cutout aperture (compound path)
        'M 12 20.5 C 8.2 15.5 5.5 12.3 5.5 9 A 6.5 6.5 0 1 1 18.5 9 C 18.5 12.3 15.8 15.5 12 20.5 Z M 12 6.5 A 2.5 2.5 0 1 0 12 11.5 A 2.5 2.5 0 1 0 12 6.5 Z',
      ].join(' ');

      return { strokeD, fillD, width: 24, height: 26 };
    }

    case 'bar': {
      // 3. Hospitality / Bar Cocktail Glass
      // Bounding box: 24 x 24
      const strokeD = [
        // V-shaped martini bowl and stem
        'M 5 5 H 19 L 12 13.5 V 20.5',
        // Base plate
        'M 8 20.5 H 16',
        // Olive toothpick
        'M 8 7.5 L 16 3.5',
      ].join(' ');

      const fillD = [
        // Liquid fill in bowl
        'M 7 7.5 H 17 L 12 13.5 Z',
      ].join(' ');

      const accentFillD = [
        // Olive dot
        'M 12.5 5.5 A 1.2 1.2 0 1 1 12.4 5.5 Z',
      ].join(' ');

      return { strokeD, fillD, accentFillD, width: 24, height: 24 };
    }

    case 'headliner': {
      // 4. Headliner Artist Crown & Star
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

    case 'ai': {
      // 5. AI Neural Processor Chip
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
  rawStereotype: string | undefined,
  x: number,
  y: number,
  primaryColor = CascaisPalette.WarmGraphite,
  accentColor = CascaisPalette.NetGold,
): string {
  const resolved = resolveStereotype(rawStereotype);
  if (!resolved) return '';

  const paths = getStereotypePaths(resolved);
  let svg = `      <g class="aim-stereotype-icon aim-icon-${resolved}" transform="translate(${x}, ${y})">\n`;

  if (resolved === 'stage') {
    // Solid canopy and towers
    svg += `        <path d="${paths.fillD}" fill="${primaryColor}" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${primaryColor}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.starsD) {
      svg += `        <path d="${paths.starsD}" fill="${accentColor}" />\n`;
    }
  } else if (resolved === 'venue') {
    // Cascais pin with ground ring
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />\n`;
    svg += `        <path d="${paths.fillD}" fill="${primaryColor}" fill-rule="evenodd" opacity="0.9" />\n`;
  } else if (resolved === 'bar') {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (paths.fillD) svg += `        <path d="${paths.fillD}" fill="${accentColor}" opacity="0.3" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${accentColor}" />\n`;
  } else if (resolved === 'headliner') {
    svg += `        <path d="${paths.fillD}" fill="${accentColor}" />\n`;
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${primaryColor}" stroke-width="1.2" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${CascaisPalette.ChalkWhite}" />\n`;
  } else if (resolved === 'ai') {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${primaryColor}" stroke-width="1.4" stroke-linecap="round" />\n`;
    svg += `        <path d="${paths.fillD}" fill="${primaryColor}" opacity="0.12" />\n`;
    if (paths.accentFillD) svg += `        <path d="${paths.accentFillD}" fill="${accentColor}" />\n`;
  } else {
    svg += `        <path d="${paths.strokeD}" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-linecap="round" />\n`;
  }

  svg += `      </g>\n`;
  return svg;
}
