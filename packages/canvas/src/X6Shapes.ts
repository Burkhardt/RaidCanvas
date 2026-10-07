import { classAttributeLines, isInstanceNode, restrictionTag } from './RoleModel.js';
/**
 * @file X6Shapes.ts
 * @description Custom AntV X6 shape registrations for the AOAIM ontological contract.
 *
 * Implements:
 * - 4-way orthogonal ports (top, right, bottom, left) with magnet snap points.
 * - Manhattan orthogonal routing with rounded corners (radius: 8).
 * - Entity archetypes: UseCase (uc), Activity (act), Class (cls), Object (obj), Person (per).
 * - Cascais Heraldry design tokens.
 */

import { Graph, Shape, Node, Edge, type NodeMetadata, type EdgeMetadata } from '@antv/x6';
import type {
  AimOntologyKind,
  AimEdgeKind,
  AimRoutingMode,
  RaidNodeData,
  RaidEdgeData,
  RaidBoundaryData,
  OrthogonalPortId,
  Bounds,
} from './types.js';
import {
  resolveStereotype,
  isInitiatingStereotype,
  getStereotypePaths,
  hasStereotype,
} from './StereotypeIcons.js';
import {
  resolveStereotypeGlyph,
  resolveStereotypeGlyphs,
  getStereotypeGlyphUrl,
  computeStereotypeGlyphLayout,
  GLYPH_EDGE_SIZE,
} from './StereotypeGlyphs.js';
import { CascaisPalette, DualityWashStrength, GenericRoleLine, HeraldicWash } from './CascaisTheme.js';
import {
  SHAPE_DETAIL_WIDTH,
  SHAPE_LINE_WIDTH,
  shapeFigureOf,
  shapeFigurePlacement,
  shapeNodeWidth,
  type ShapeFigure,
} from './ShapeFigures.js';

export { CascaisPalette };

/**
 * Computes maximum line length (characters per line) dynamically
 * derived from the bounding box width and font size.
 *
 * Adheres to standard Cascais padding (16px) and proportional typography (0.44 * fontSize).
 * Guarantees:
 * - 180px box at 13px font yields 28 characters per line.
 * - 90px box at 12px font yields 14 characters per line.
 * - Narrower boxes wrap sooner.
 */
export function computeMaxLineLength(boxWidth: number, fontSize: number = 13): number {
  const availableWidth = Math.max(20, boxWidth - 16);
  const approxCharWidth = fontSize * 0.44;
  return Math.max(10, Math.floor(availableWidth / approxCharWidth));
}

/**
 * Formats and wraps node label text for AOAIM entities.
 * Automatically wraps on whitespace when exceeding target length,
 * and treats `<wbr>` / `<wbr/>` tags and hyphens as soft word-break opportunities
 * within long unbroken words or strings.
 */
export function wrapAimText(rawText: string, maxLineLength: number = 18): string {
  if (!rawText) return '';

  const lines = rawText.split('\n');
  const resultLines: string[] = [];

  for (const line of lines) {
    if (!line) {
      resultLines.push('');
      continue;
    }

    // Replace <wbr> / <wbr/> with zero-width break marker \u200B,
    // and allow breaking after hyphens within words
    const normalized = line
      .replace(/<wbr\s*\/?>/gi, '\u200B')
      .replace(/-(?=[a-zA-Z0-9])/g, '-\u200B');

    const spaceWords = normalized.split(/\s+/).filter(Boolean);
    if (spaceWords.length === 0) continue;

    let currentLine = '';

    for (let wordIdx = 0; wordIdx < spaceWords.length; wordIdx++) {
      const spaceWord = spaceWords[wordIdx]!;
      const chunks = spaceWord.split('\u200B').filter(Boolean);

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx]!;
        const isFirstChunkOfWord = chunkIdx === 0;

        if (!currentLine) {
          currentLine = chunk;
        } else if (isFirstChunkOfWord) {
          // Break or space before a new whitespace-separated word
          if (currentLine.length + 1 + chunk.length <= maxLineLength) {
            currentLine += ' ' + chunk;
          } else {
            resultLines.push(currentLine);
            currentLine = chunk;
          }
        } else {
          // Soft-break opportunity within a word (<wbr> or hyphen):
          // Glues together without space if it fits; breaks without space if it overflows
          if (currentLine.length + chunk.length <= maxLineLength) {
            currentLine += chunk;
          } else {
            resultLines.push(currentLine);
            currentLine = chunk;
          }
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines.join('\n');
}

/**
 * Port configuration generating 4 orthogonal snap anchors.
 */
export function createOrthogonalPorts() {
  const portMarkup = [
    {
      tagName: 'circle',
      selector: 'portBody',
    },
  ];

  const portAttrs = {
    portBody: {
      r: 4,
      magnet: true,
      stroke: CascaisPalette.WarmGraphite,
      fill: CascaisPalette.ChalkWhite,
      strokeWidth: 1.5,
      style: {
        visibility: 'hidden',
      },
    },
  };

  return {
    groups: {
      top: {
        position: 'top',
        markup: portMarkup,
        attrs: portAttrs,
      },
      right: {
        position: 'right',
        markup: portMarkup,
        attrs: portAttrs,
      },
      bottom: {
        position: 'bottom',
        markup: portMarkup,
        attrs: portAttrs,
      },
      left: {
        position: 'left',
        markup: portMarkup,
        attrs: portAttrs,
      },
    },
    items: [
      { id: 'port-top' satisfies OrthogonalPortId, group: 'top' },
      { id: 'port-right' satisfies OrthogonalPortId, group: 'right' },
      { id: 'port-bottom' satisfies OrthogonalPortId, group: 'bottom' },
      { id: 'port-left' satisfies OrthogonalPortId, group: 'left' },
    ],
  };
}

/**
 * Guard flag to ensure shapes are registered only once per runtime.
 */
let shapesRegistered = false;

/** Line pitch of a 12 px label, used to stack the slot's `: <Class>` tag under the role name. */
const SLOT_LINE_HEIGHT = 15;

/** CR053: image slots for a node's pictograms, `glyph` first. Every node shape carries all of them. */
export const GLYPH_SELECTORS = ['glyph', 'glyph2', 'glyph3', 'glyph4', 'glyph5'] as const;
const EXTRA_GLYPH_MARKUP = GLYPH_SELECTORS.slice(1).map((selector) => ({ tagName: 'image', selector }));

/**
 * Register all AOAIM ontological shapes with AntV X6.
 * Safe to call multiple times (idempotent).
 */
export function registerAimShapes(): void {
  if (shapesRegistered) {
    return;
  }

  // 1. AimUseCaseNode ('uc') — Ellipse with Net Gold border
  Shape.Ellipse.define({
    shape: 'aim-uc',
    overwrite: true,
    width: 140,
    height: 70,
    markup: [
      {
        tagName: 'ellipse',
        selector: 'body',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'qualifier',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 2,
        class: 'aim-node aim-uc',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      qualifier: {
        text: '',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.35,
      },
      label: {
        text: 'UseCase',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.5,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 2. AimActivityNode ('act') — Rounded rectangle with Heraldic Green border
  Shape.Rect.define({
    shape: 'aim-act',
    overwrite: true,
    width: 150,
    height: 60,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'qualifier',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.CascaisRed,
        strokeWidth: 2,
        rx: 12,
        ry: 12,
        class: 'aim-node aim-act',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      qualifier: {
        text: '',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.35,
      },
      label: {
        text: 'Activity',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.5,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 3. AimClassNode ('cls') — Compartmentalized class card
  Shape.Rect.define({
    shape: 'aim-cls',
    overwrite: true,
    width: 180,
    height: 100,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'rect',
        selector: 'header',
      },
      {
        tagName: 'text',
        selector: 'title',
      },
      {
        tagName: 'line',
        selector: 'divider1',
      },
      {
        tagName: 'text',
        selector: 'attributes',
      },
      {
        tagName: 'line',
        selector: 'divider2',
      },
      {
        tagName: 'text',
        selector: 'methods',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        class: 'aim-node aim-cls',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      header: {
        fill: CascaisPalette.CanvasCream,
        stroke: 'none',
        height: 28,
      },
      title: {
        text: 'Class',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        refX: 0.5,
        refY: 14,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
      divider1: {
        stroke: CascaisPalette.SilverLine,
        strokeWidth: 1,
        refX: 0,
        refY: 28,
        refWidth: '100%',
      },
      attributes: {
        text: '+ id: string\n+ state: string',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        refX: 8,
        refY: 34,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
      },
      divider2: {
        stroke: CascaisPalette.SilverLine,
        strokeWidth: 1,
        refX: 0,
        refY: 65,
        refWidth: '100%',
      },
      methods: {
        text: '+ execute(): void',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        refX: 8,
        refY: 71,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 4. AimObjectNode ('obj') — Instance card
  Shape.Rect.define({
    shape: 'aim-obj',
    overwrite: true,
    width: 160,
    height: 80,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        // The folded corner, above the washes
        tagName: 'path',
        selector: 'fold',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'qualifier',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.SilverLineDark,
        strokeWidth: 1.5,
        class: 'aim-node aim-obj',
      },
      fold: {
        fill: CascaisPalette.SilverLine,
        stroke: CascaisPalette.SilverLineDark,
        strokeWidth: 1.5,
        strokeLinejoin: 'round',
        class: 'aim-obj-fold',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      qualifier: {
        text: '',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.35,
      },
      label: {
        text: 'instance: Type',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'none',
        refX: 0.5,
        refY: 0.5,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 5. AimPersonNode ('per') — Person / Actor glyph
  Shape.Rect.define({
    shape: 'aim-per',
    overwrite: true,
    width: 120,
    height: 110,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        tagName: 'path',
        selector: 'torso',
      },
      {
        tagName: 'circle',
        selector: 'head',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconPin',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'qualifier',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        pointerEvents: 'all',
        style: { pointerEvents: 'all' },
        class: 'aim-node aim-per',
      },
      torso: {
        d: 'M 81 54 v -6 a 10 10 0 0 0 -10 -10 H 49 a 10 10 0 0 0 -10 10 v 6',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      head: {
        cx: 60,
        cy: 20,
        r: 12,
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 2.2,
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconPin: {
        d: '',
        fill: CascaisPalette.ChalkWhite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-pin',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      qualifier: {
        text: '',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        textDecoration: 'none',
        refX: 0.5,
        refY: 66,
      },
      label: {
        text: 'Actor',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        textDecoration: 'none',
        refX: 0.5,
        refY: 84,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 6. AimPlaceNode ('plc') — Spatial Venue / Stage card
  Shape.Rect.define({
    shape: 'aim-plc',
    overwrite: true,
    width: 160,
    height: 70,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'rect',
        selector: 'header',
      },
      {
        tagName: 'path',
        selector: 'iconFill',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'path',
        selector: 'iconStroke',
      },
      {
        tagName: 'path',
        selector: 'iconAccent',
      },
      {
        // CR053: OTW stereotype pictogram (badge on cards, silhouette on actors / frameless places)
        tagName: 'image',
        selector: 'glyph',
      },
      ...EXTRA_GLYPH_MARKUP,
      {
        tagName: 'text',
        selector: 'qualifier',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.SilverLineDark,
        strokeWidth: 1.5,
        class: 'aim-node aim-plc aim-plc-framed',
      },
      header: {
        display: 'none',
        height: 0,
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        fillRule: 'evenodd',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'none',
        class: 'aim-portal-seam',
      },
      iconFill: {
        d: '',
        fill: CascaisPalette.WarmGraphite,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-fill',
      },
      iconStroke: {
        d: '',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        display: 'none',
        class: 'aim-stereotype-icon-stroke',
      },
      iconAccent: {
        d: '',
        fill: CascaisPalette.NetGold,
        stroke: 'none',
        display: 'none',
        class: 'aim-stereotype-icon-accent',
      },
      chevron: {
        text: '›',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        display: 'none',
        class: 'aim-portal-chevron',
      },
      qualifier: {
        text: '',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 0.5,
        refY: 0.38,
      },
      label: {
        text: 'Place',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 0.5,
        refY: 0.62,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // Roles are selectable relationship junctions, not domain persistence kinds.
  for (const kind of ['rol', 'rf']) {
    const { width, height } = getDefaultNodeBounds(kind);
    // The Generic Role is a grey dashed ring; the legacy RoleFiller stays a small solid dot.
    const line = kind === 'rol'
      ? { stroke: GenericRoleLine.stroke, strokeWidth: GenericRoleLine.strokeWidth, strokeDasharray: GenericRoleLine.dash }
      : { stroke: CascaisPalette.WarmGraphite, strokeWidth: 2 };
    Shape.Circle.define({
      shape: `aim-${kind}`, overwrite: true, width, height,
      markup: [{ tagName: 'circle', selector: 'body' }, { tagName: 'text', selector: 'label' }],
      attrs: {
        body: { refCx: '50%', refCy: '50%', refR: '50%', ...line, fill: kind === 'rf' ? CascaisPalette.AccentBlue : CascaisPalette.ChalkWhite },
        label: { refX: 0.5, refY: -14, textAnchor: 'middle', textVerticalAnchor: 'middle', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', fill: CascaisPalette.WarmGraphite },
      },
      ports: createOrthogonalPorts(),
    });
  }

  // 8. AimEdge — Orthogonal Manhattan edge (undirected line segment without arrow)
  Shape.Edge.define({
    shape: 'aim-edge',
    overwrite: true,
    router: {
      name: 'manhattan',
      args: {
        padding: 20,
        startDirections: ['top', 'right', 'bottom', 'left'],
        endDirections: ['top', 'right', 'bottom', 'left'],
      },
    },
    connector: {
      name: 'rounded',
      args: {
        radius: 8,
      },
    },
    attrs: {
      line: {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: null,
        class: 'aim-edge',
      },
    },
  });

  // 9. AimArrow — Orthogonal Manhattan edge with classic arrowhead (directed)
  Shape.Edge.define({
    shape: 'aim-arrow',
    overwrite: true,
    router: {
      name: 'manhattan',
      args: {
        padding: 20,
        startDirections: ['top', 'right', 'bottom', 'left'],
        endDirections: ['top', 'right', 'bottom', 'left'],
      },
    },
    connector: {
      name: 'rounded',
      args: {
        radius: 8,
      },
    },
    attrs: {
      line: {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 7,
        },
        class: 'aim-edge aim-arrow',
      },
    },
  });

  // 8a. AimBoundaryClass ('aim-boundary-class', 'aim-boundary') — Class Context Boundary Box with inset label & Duality
  Shape.Rect.define({
    shape: 'aim-boundary-class',
    overwrite: true,
    width: 320,
    height: 220,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'rect',
        selector: 'headerBg',
      },
      {
        tagName: 'text',
        selector: 'headerText',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: 'rgba(248, 250, 252, 0.65)',
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        strokeDasharray: '6,4',
        rx: 8,
        ry: 8,
        class: 'aim-boundary aim-boundary-class',
      },
      headerBg: {
        display: 'none',
        fill: 'none',
        stroke: 'none',
        class: 'aim-boundary-header-bg',
      },
      headerText: {
        text: 'Class: Scope',
        fill: CascaisPalette.WarmGraphite,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        refX: 14,
        refY: 18,
        class: 'aim-boundary-header-text',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        d: '',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        class: 'aim-portal-door',
      },
      seam: {
        display: 'none',
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -20,
        refY: 20,
        class: 'aim-portal-chevron',
      },
    },
  });

  // Default aim-boundary alias
  Shape.Rect.define({
    shape: 'aim-boundary',
    overwrite: true,
    width: 320,
    height: 220,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        // CR055: Verde wash on the Persona (left / hoist), mirror of the Vermelho door
        tagName: 'path',
        selector: 'persona',
      },
      {
        tagName: 'path',
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
      },
      {
        tagName: 'rect',
        selector: 'headerBg',
      },
      {
        tagName: 'text',
        selector: 'headerText',
      },
      {
        tagName: 'text',
        selector: 'chevron',
      },
    ],
    attrs: {
      body: {
        fill: 'rgba(248, 250, 252, 0.65)',
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        strokeDasharray: '6,4',
        rx: 8,
        ry: 8,
        class: 'aim-boundary',
      },
      headerBg: {
        display: 'none',
        fill: 'none',
        stroke: 'none',
        class: 'aim-boundary-header-bg',
      },
      headerText: {
        text: 'Class: Scope',
        fill: CascaisPalette.WarmGraphite,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        refX: 14,
        refY: 18,
        class: 'aim-boundary-header-text',
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        d: '',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        class: 'aim-portal-door',
      },
      seam: {
        display: 'none',
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 1,
        refDx: -20,
        refY: 20,
        class: 'aim-portal-chevron',
      },
    },
  });

  // 8b. AimBoundaryPackage ('aim-boundary-package') — UML Tabbed Folder notation per media_1789883224444.png
  Shape.Rect.define({
    shape: 'aim-boundary-package',
    overwrite: true,
    width: 340,
    height: 240,
    markup: [
      {
        tagName: 'path',
        selector: 'folderTab',
      },
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'headerText',
      },
    ],
    attrs: {
      body: {
        fill: 'rgba(248, 250, 252, 0.70)',
        stroke: '#1E293B',
        strokeWidth: 1.5,
        strokeDasharray: 'none',
        rx: 6,
        ry: 6,
        refY: 26,
        refWidth: '100%',
        refHeight: '100%',
        refHeight2: -26,
        class: 'aim-boundary aim-boundary-package',
      },
      folderTab: {
        d: 'M 0 26 L 0 6 A 6 6 0 0 1 6 0 L 140 0 L 162 26 Z',
        fill: CascaisPalette.ChalkWhite,
        stroke: '#1E293B',
        strokeWidth: 1.5,
        class: 'aim-boundary-tab',
      },
      headerText: {
        text: 'Package: Scope',
        fill: '#1E293B',
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        refX: 12,
        refY: 14,
        class: 'aim-boundary-header-text',
      },
    },
  });

  shapesRegistered = true;
}

/**
 * CR055: the Persona wash is the portal door mirrored across the seam, so every silhouette (head and torso,
 * pin, rack, rounded card, ellipse) gets an exact left half without a second set of path geometry.
 */
function personaWash(d: string, seamX: number, evenOdd = false) {
  return {
    d,
    transform: `matrix(-1 0 0 1 ${2 * seamX} 0)`,
    display: 'block',
    fill: HeraldicWash.verde(DualityWashStrength.verde),
    ...(evenOdd ? { fillRule: 'evenodd' } : {}),
    class: 'aim-portal-persona',
  };
}

/** Side of an Object card's folded corner: a 12-unit bevel at 45 degrees (Koyo). */
export const OBJECT_FOLD = 12;

/** An Object card's outline with its top-right corner folded: the archetype mark of an Object. */
export function objectCardOutline(width: number, height: number): string {
  return `M 0 0 H ${width - OBJECT_FOLD} L ${width} ${OBJECT_FOLD} V ${height} H 0 Z`;
}

/** The flap the folded corner leaves turned down; its long edge is the card's bevel. */
export function objectFoldFlap(width: number): string {
  return `M ${width - OBJECT_FOLD} 0 V ${OBJECT_FOLD} H ${width} Z`;
}

/**
 * Cuts the corner off the live card's rectangle. One unit beyond the box on every side, so the border
 * line stays whole along the edges; `fill-box` so the bevel is measured from the card, not its border.
 */
const OBJECT_CARD_CLIP = `polygon(-1px -1px, calc(100% - ${OBJECT_FOLD + 1}px) -1px, calc(100% + 1px) ${OBJECT_FOLD + 1}px, calc(100% + 1px) calc(100% + 1px), -1px calc(100% + 1px)) fill-box`;

/** The selectors every node that stands as a Shape is built from, in paint order. */
const SHAPE_FIGURE_MARKUP = [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'path', selector: 'iconFill' },
  // The flag washes lie on the white ground and under the lines
  { tagName: 'path', selector: 'persona' },
  { tagName: 'path', selector: 'door' },
  { tagName: 'line', selector: 'seam' },
  { tagName: 'path', selector: 'iconStroke' },
  { tagName: 'path', selector: 'iconDetail' },
  { tagName: 'path', selector: 'iconAccent' },
  { tagName: 'image', selector: 'glyph' },
  ...EXTRA_GLYPH_MARKUP,
  { tagName: 'text', selector: 'qualifier' },
  { tagName: 'text', selector: 'label' },
  { tagName: 'text', selector: 'chevron' },
];

/** Ink of a node's Shape: gold when it initiates, graphite otherwise. */
function shapeInk(data: RaidNodeData): string {
  return isInitiatingStereotype(data.stereotype) ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
}

/** The drawing of any Shape, from its record: white ground, lines, detail, accent. */
function shapeFigureIconAttrs(figure: ShapeFigure, data: RaidNodeData) {
  const { x, y } = shapeFigurePlacement(figure, data.bounds.width);
  const transform = `translate(${x}, ${y})`;
  const ink = shapeInk(data);
  const accent = figure.accent?.(data.state);
  const stroke = { transform, stroke: ink, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  return {
    iconFill: { d: figure.outline, transform, fill: CascaisPalette.ChalkWhite, fillRule: 'evenodd', 'fill-rule': 'evenodd', stroke: 'none', display: 'block', class: 'aim-stereotype-icon-fill' },
    iconStroke: { ...stroke, d: figure.line, strokeWidth: SHAPE_LINE_WIDTH, display: 'block', class: 'aim-stereotype-icon-stroke' },
    iconDetail: { ...stroke, d: figure.detail ?? '', strokeWidth: SHAPE_DETAIL_WIDTH, display: figure.detail ? 'block' : 'none', class: 'aim-stereotype-icon-detail' },
    iconAccent: { d: accent?.d ?? '', transform, fill: accent?.color ?? ink, stroke: 'none', display: accent ? 'block' : 'none', class: 'aim-stereotype-icon-accent' },
    iconPin: { d: '', display: 'none' },
  };
}

/**
 * The awakened duality of any Shape. Both washes are the Shape's own outline, clipped at the seam: the
 * left half is the Persona, the right half the Portal door. Nothing is drawn twice and no Shape needs a
 * half of its own.
 */
function shapeFigurePortalAttrs(figure: ShapeFigure, data: RaidNodeData) {
  const { cx, x, y, width, height } = shapeFigurePlacement(figure, data.bounds.width);
  const half = { d: figure.outline, transform: `translate(${x}, ${y})`, display: 'block', fillRule: 'evenodd', 'fill-rule': 'evenodd' };
  return {
    persona: { ...half, fill: HeraldicWash.verde(DualityWashStrength.verde), style: { clipPath: 'inset(0 50% 0 0)' }, class: 'aim-portal-persona' },
    door: { ...half, fill: HeraldicWash.vermelho(DualityWashStrength.vermelho), style: { clipPath: 'inset(0 0 0 50%)' }, class: 'aim-portal-door' },
    seam: { x1: cx, y1: y, x2: cx, y2: y + height, stroke: CascaisPalette.NetGoldStroke, strokeWidth: 1.5, display: 'block', class: 'aim-portal-seam' },
    chevron: {
      text: '›',
      // Beside the Shape. X6 adds refX and refDx together, so the shape's default right-edge offset is cleared.
      refX: cx + width / 2 + 12,
      refDx: null,
      refY: y + 20,
      fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      display: 'block',
      class: 'aim-portal-chevron',
    },
  };
}

/**
 * Computes X6 attribute dictionary for the Portuguese Bicolor Seam & Portal Door.
 * If data.href is absent or empty, or isActive is false, persona, door, seam and chevron are hidden (dormant by default).
 * When awakened (isActive = true), the node raises the flag of Portugal (CR055):
 * - Left hemisphere (Persona, the hoist): Bandeira Verde wash.
 * - Vertical gold seam (Cascais Net Gold, stroke-width: 1.5) down the center meridian.
 * - Right hemisphere (Portal, the fly): Bandeira Vermelho wash and doorway chevron '›'.
 * - For person ('per'), both washes contour strictly to the head semi-circles and torso arcs.
 */
export function computePortalDoorAttrs(data: RaidNodeData, isActive = false) {
  const hasPortal = Boolean(data.href && data.href.trim().length > 0);
  if (!hasPortal || !isActive) {
    return {
      persona: {
        d: '',
        display: 'none',
      },
      door: {
        d: '',
        display: 'none',
      },
      seam: {
        display: 'none',
      },
      chevron: {
        display: 'none',
      },
    };
  }

  const figure = shapeFigureOf(data);
  if (figure) return shapeFigurePortalAttrs(figure, data);

  const w = data.bounds.width;
  const h = data.bounds.height;
  const midX = Math.round(w / 2);

  if (data.kind === 'per') {
    const cx = Math.round(w / 2);
    const headRight = `M ${cx} 8 A 12 12 0 0 1 ${cx} 32 Z`;
    const torsoRight = `M ${cx} 38 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 H ${cx} Z`;
    // The whole flag on the human figure too (Koyo), at card-level subtlety so the head reads as tinted, not cut
    const personRight = `${headRight} ${torsoRight}`;
    return {
      persona: personaWash(personRight, cx),
      door: {
        d: personRight,
        display: 'block',
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: 8,
        x2: cx,
        y2: 54,
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        display: 'block',
        class: 'aim-portal-chevron',
      },
    };
  }

  if ((data as any).kind === 'Class' || ((data as any).isBoundary && (data as any).kind !== 'Package')) {
    const r = 8;
    const pathD = `M ${midX} 0 H ${w - r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} H ${midX} Z`;
    return {
      persona: personaWash(pathD, midX),
      door: {
        d: pathD,
        display: 'block',
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        class: 'aim-portal-door',
      },
      seam: {
        x1: midX,
        y1: 0,
        x2: midX,
        y2: h,
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 1,
        refDx: -20,
        refY: 20,
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        display: 'block',
        class: 'aim-portal-chevron',
      },
    };
  }

  let pathD = `M ${midX} 0 H ${w} v ${h} H ${midX} Z`;
  if (data.kind === 'uc') {
    const rx = Math.round(w / 2);
    const ry = Math.round(h / 2);
    pathD = `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${rx} ${h} Z`;
  } else if (data.kind === 'act') {
    const r = 12;
    pathD = `M ${midX} 0 H ${w - r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} H ${midX} Z`;
  }

  // An Object card's door stops at the folded corner. The Persona mirrors the plain half: the left corner is square.
  const doorD = data.kind === 'obj' ? `M ${midX} 0 H ${w - OBJECT_FOLD} L ${w} ${OBJECT_FOLD} V ${h} H ${midX} Z` : pathD;

  return {
    persona: personaWash(pathD, midX),
    door: {
      d: doorD,
      display: 'block',
      fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
      class: 'aim-portal-door',
    },
    seam: {
      x1: midX,
      y1: 0,
      x2: midX,
      y2: h,
      stroke: CascaisPalette.NetGoldStroke,
      strokeWidth: 1.5,
      display: 'block',
      class: 'aim-portal-seam',
    },
    chevron: {
      text: '›',
      refX: 1,
      refDx: -12,
      refY: 0.5,
      fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      display: 'block',
      class: 'aim-portal-chevron',
    },
  };
}

/**
 * Activates or deactivates Duality Mode (bicolor seam & portal door) on an X6 Node instance.
 */
export function setNodeDualityActive(node: Node, active: boolean): void {
  const data = node.getData<RaidNodeData>();
  if (!data?.href && (data as any)?.kind !== 'Class') {
    return;
  }
  const opt = { ignoreHistory: true };
  const attrs = computePortalDoorAttrs(data, active);
  const persona = attrs.persona as { d: string; display: string; transform?: string; fill?: string; fillRule?: string };
  node.setAttrByPath('persona/d', persona.d, opt);
  node.setAttrByPath('persona/display', persona.display, opt);
  if (persona.transform) node.setAttrByPath('persona/transform', persona.transform, opt);
  if (persona.fill) node.setAttrByPath('persona/fill', persona.fill, opt);
  if (persona.fillRule) {
    node.setAttrByPath('persona/fillRule', persona.fillRule, opt);
    node.setAttrByPath('persona/fill-rule', persona.fillRule, opt);
  }
  node.setAttrByPath('door/d', attrs.door.d, opt);
  node.setAttrByPath('door/display', attrs.door.display, opt);
  // A Shape's two halves are its one outline, placed and clipped at the seam.
  if ((attrs.door as any).transform) node.setAttrByPath('door/transform', (attrs.door as any).transform, opt);
  if ((attrs.door as any).style) node.setAttrByPath('door/style', (attrs.door as any).style, opt);
  if ((attrs.persona as any).style) node.setAttrByPath('persona/style', (attrs.persona as any).style, opt);
  if ((attrs.door as any).fill) {
    node.setAttrByPath('door/fill', (attrs.door as any).fill, opt);
  }
  if ((attrs.door as any).fillRule) {
    node.setAttrByPath('door/fillRule', (attrs.door as any).fillRule, opt);
    node.setAttrByPath('door/fill-rule', (attrs.door as any).fillRule, opt);
  }
  if (attrs.seam.display === 'block') {
    node.setAttrByPath('seam/x1', (attrs.seam as any).x1, opt);
    node.setAttrByPath('seam/y1', (attrs.seam as any).y1, opt);
    node.setAttrByPath('seam/x2', (attrs.seam as any).x2, opt);
    node.setAttrByPath('seam/y2', (attrs.seam as any).y2, opt);
  }
  node.setAttrByPath('seam/display', attrs.seam.display, opt);
  if (attrs.chevron.display === 'block') {
    if ((attrs.chevron as any).refX !== undefined) node.setAttrByPath('chevron/refX', (attrs.chevron as any).refX, opt);
    if ((attrs.chevron as any).refDx !== undefined) node.setAttrByPath('chevron/refDx', (attrs.chevron as any).refDx, opt);
    if ((attrs.chevron as any).refY !== undefined) node.setAttrByPath('chevron/refY', (attrs.chevron as any).refY, opt);
    if ((attrs.chevron as any).fontSize !== undefined) node.setAttrByPath('chevron/fontSize', (attrs.chevron as any).fontSize, opt);
    if ((attrs.chevron as any).fill) node.setAttrByPath('chevron/fill', (attrs.chevron as any).fill, opt);
  }
  node.setAttrByPath('chevron/display', attrs.chevron.display, opt);
}

/**
 * Computes X6 attribute dictionary for Stereotype Icons (OTW & Vasco v1.3).
 * When a node carries a recognized stereotype (Stage, Venue, Bar, Headliner, AI):
 * - Renders vector icon in Left Hemisphere (Persona/Anchor) for structured cards.
 * - Adorns head/shoulder for Person glyph.
 * - Preserves visibility in both dormant and awakened Duality states.
 */
export function computeStereotypeIconAttrs(data: RaidNodeData) {
  const figure = shapeFigureOf(data);
  if (figure) return shapeFigureIconAttrs(figure, data);

  const resolved = resolveStereotype(data.stereotype, data.kind);
  if (!resolved) {
    return {
      iconFill: { d: '', display: 'none' },
      iconStroke: { d: '', display: 'none' },
      iconPin: { d: '', display: 'none' },
      iconAccent: { d: '', display: 'none' },
    };
  }

  const paths = getStereotypePaths(resolved);
  const w = data.bounds.width;
  const h = data.bounds.height;
  const isInitiating = isInitiatingStereotype(data.stereotype);
  const strokeColor = isInitiating ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;

  if (data.kind === 'per') {
    const cx = Math.round(w / 2);
    if (resolved === 'customer') {
      return {
        iconFill: {
          d: paths.fillD,
          transform: `translate(${cx - 12}, -7)`,
          fill: CascaisPalette.NetGold,
          stroke: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-fill',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${cx - 12}, -7)`,
          stroke: CascaisPalette.NetGoldStroke,
          strokeWidth: 1.2,
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconPin: { d: '', display: 'none' },
        iconAccent: {
          d: paths.accentFillD ?? '',
          transform: `translate(${cx - 12}, -7)`,
          fill: CascaisPalette.ChalkWhite,
          stroke: 'none',
          display: paths.accentFillD ? 'block' : 'none',
          class: 'aim-stereotype-icon-accent',
        },
      };
    }
    if (resolved === 'lead') {
      // Sketch Offset (Δ = 45.0°) Helmsman Rudder Wheel (media_1790622846477.png)
      // Hub at (cx - 12, 58). Wheel clipped at torso horizon y=54.
      // Right arm clasp meets 30° peg at (cx + 8, 47).
      const hasHeadliner = hasStereotype(data.stereotype, 'headliner');
      return {
        iconFill: {
          d: paths.fillD,
          transform: `translate(${cx - 12}, 58)`,
          fill: CascaisPalette.NetGold,
          stroke: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-fill',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${cx - 12}, 58)`,
          stroke: CascaisPalette.NetGoldStroke,
          strokeWidth: 2.0,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconPin: {
          d: '',
          display: 'none',
        },
        iconAccent: {
          d: (hasHeadliner && paths.starsD) ? paths.starsD : '',
          transform: `translate(${cx - 12}, 58)`,
          fill: CascaisPalette.ChalkWhite,
          stroke: CascaisPalette.NetGoldStroke,
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          display: hasHeadliner ? 'block' : 'none',
          class: 'aim-stereotype-icon-accent aim-lead-lapel-star',
        },
      };
    }
    if (resolved === 'headliner') {
      // 5-Point hollow Star on the chest (media_1789693770549.png)
      // Hollow so that the torso line and Duality emerald door fill are visible
      return {
        iconFill: {
          d: '',
          display: 'none',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${cx - 8}, 38.5)`,
          stroke: CascaisPalette.NetGoldStroke,
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconPin: { d: '', display: 'none' },
        iconAccent: {
          d: '',
          display: 'none',
        },
      };
    }
    if (resolved === 'observer') {
      // 9. Observer / True Cyclops in Head (ADR-0008, Option 1B: 85% scale centered at cx, cy=20)
      const cyclopsTransform = `translate(${cx}, 20) scale(0.85) translate(-12, -9.5)`;
      return {
        iconFill: {
          d: paths.fillD,
          transform: cyclopsTransform,
          fill: strokeColor,
          stroke: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-fill aim-observer-pupil',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: cyclopsTransform,
          stroke: strokeColor,
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke aim-observer-contour',
        },
        iconPin: { d: '', display: 'none' },
        iconAccent: {
          d: paths.accentFillD ?? '',
          transform: cyclopsTransform,
          fill: CascaisPalette.NetGold,
          stroke: 'none',
          display: paths.accentFillD ? 'block' : 'none',
          class: 'aim-stereotype-icon-accent aim-observer-glint',
        },
      };
    }
    if (resolved === 'ai') {
      return {
        iconFill: {
          d: paths.fillD,
          transform: `translate(${cx - 12}, 8)`,
          fill: strokeColor,
          opacity: 0.15,
          stroke: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-fill',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${cx - 12}, 8)`,
          stroke: strokeColor,
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconPin: { d: '', display: 'none' },
        iconAccent: {
          d: paths.accentFillD ?? '',
          transform: `translate(${cx - 12}, 8)`,
          fill: strokeColor,
          stroke: 'none',
          display: paths.accentFillD ? 'block' : 'none',
          class: 'aim-stereotype-icon-accent',
        },
      };
    }
    return {
      iconFill: { d: '', display: 'none' },
      iconStroke: { d: '', display: 'none' },
      iconPin: { d: '', display: 'none' },
      iconAccent: { d: '', display: 'none' },
    };
  }

  // Structured cards: act, obj, uc, cls, rol
  const iconX = 12;
  const iconY = Math.max(6, Math.round((h - paths.height) / 2));

  let cardStrokeColor: string = CascaisPalette.WarmGraphite;
  let cardFillColor: string = CascaisPalette.WarmGraphite;
  let cardAccentColor: string = CascaisPalette.NetGold;

  if (resolved === 'stage') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.WarmGraphite;
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'venue') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.WarmGraphite;
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'bar') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.NetGold;
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'customer') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.NetGold;
    cardAccentColor = CascaisPalette.ChalkWhite;
  } else if (resolved === 'lead') {
    cardStrokeColor = CascaisPalette.NetGoldStroke;
    cardFillColor = CascaisPalette.NetGold;
    cardAccentColor = CascaisPalette.ChalkWhite;
  } else if (resolved === 'headliner') {
    cardStrokeColor = CascaisPalette.NetGoldStroke;
    cardFillColor = 'none';
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'ai') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.WarmGraphite;
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'initiates') {
    cardStrokeColor = CascaisPalette.NetGoldStroke;
    cardFillColor = 'none';
    cardAccentColor = CascaisPalette.NetGold;
  }

  return {
    iconFill: {
      d: paths.fillD,
      transform: `translate(${iconX}, ${iconY})`,
      fill: cardFillColor,
      stroke: 'none',
      display: paths.fillD ? 'block' : 'none',
      class: 'aim-stereotype-icon-fill',
    },
    iconStroke: {
      d: paths.strokeD,
      transform: `translate(${iconX}, ${iconY})`,
      stroke: cardStrokeColor,
      strokeWidth: 1.3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      fill: 'none',
      display: paths.strokeD ? 'block' : 'none',
      class: 'aim-stereotype-icon-stroke',
    },
    iconAccent: {
      d: paths.starsD ?? paths.accentFillD ?? '',
      transform: `translate(${iconX}, ${iconY})`,
      fill: cardAccentColor,
      stroke: 'none',
      display: paths.starsD || paths.accentFillD ? 'block' : 'none',
      class: 'aim-stereotype-icon-accent',
    },
  };
}

/**
 * Configure an AntV X6 Graph instance with default AOAIM canvas settings:
 * Manhattan routing, orthogonal connection rules, port hover visibility.
 */
export function configureAimGraph(graph: Graph): void {
  registerAimShapes();

  // Show ports on node mouseenter, hide on mouseleave
  graph.on('node:mouseenter', ({ node }) => {
    const ports = node.getPorts();
    for (const port of ports) {
      if (port.id) {
        node.portProp(port.id, 'attrs/portBody/style/visibility', 'visible');
      }
    }
  });

  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    for (const port of ports) {
      if (port.id) {
        node.portProp(port.id, 'attrs/portBody/style/visibility', 'hidden');
      }
    }
  });

  // Re-center person head and torso dynamically if resized, and update portal door
  graph.on('node:change:size', ({ node, current }) => {
    if (node.shape === 'aim-per' && current?.width) {
      const cx = Math.round(current.width / 2);
      const nodeData = node.getData<RaidNodeData>();
      const isLead = resolveStereotype(nodeData?.stereotype) === 'lead';
      const torsoD = isLead
        ? `M ${cx - 21} 54 v -6 a 10 10 0 0 1 10 -10 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 L ${cx + 8} 47`
        : `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`;
      node.setAttrByPath('torso/d', torsoD);
      node.setAttrByPath('head/cx', cx);
    }
    const nodeData = node.getData<RaidNodeData>();
    if (nodeData?.href && current?.width && current?.height) {
      const updatedData: RaidNodeData = {
        ...nodeData,
        bounds: {
          ...nodeData.bounds,
          width: current.width,
          height: current.height,
        },
      };
      const isCurrentlyActive = node.getAttrByPath('door/display') === 'block';
      node.setData(updatedData, { overwrite: true });
      // Re-derives persona, door, seam and chevron for the new size (CR055: the persona must follow too)
      setNodeDualityActive(node, isCurrentlyActive);
    }
  });
}

/**
 * Factory creating an AntV X6 Node model from a RaidNodeData specification.
 */
export function wrapDescription(text: string, columns: number = 40): string {
  const limit = Number.isFinite(columns) ? Math.max(32, Math.min(50, Math.round(columns))) : 40;
  return wrapAimText(text, limit).split('\n').flatMap(line => {
    const characters = Array.from(line);
    if (!characters.length) return [''];
    const chunks: string[] = [];
    for (let i = 0; i < characters.length; i += limit) chunks.push(characters.slice(i, i + limit).join(''));
    return chunks;
  }).join('\n');
}

export function layoutDescription(data: RaidNodeData): RaidNodeData {
  if (data.kind !== 'obj' || !data.description) return data;
  const columns = Math.max(32, Math.min(50, data.descriptionWidth ?? 40));
  const lines = wrapDescription(data.description, columns).split('\n').length;
  return { ...data, bounds: { ...data.bounds, width: columns * 7.5 + 28, height: 68 + lines * 18 } };
}

/**
 * Factory creating an AntV X6 Node model representing a UML Subject / Scope Boundary Box.
 */
export function createAimBoundary(data: RaidBoundaryData): NodeMetadata {
  registerAimShapes();
  const isPackage = (data.kind ?? '').toLowerCase() === 'package';
  const shapeName = isPackage ? 'aim-boundary-package' : 'aim-boundary-class';
  const primaryColor = isPackage ? '#1E293B' : CascaisPalette.NetGoldStroke;
  const label = `${data.kind || (isPackage ? 'Package' : 'Class')}: ${data.name || data.id}`;

  if (isPackage) {
    const tabWidth = Math.max(140, Math.min(data.bounds.width * 0.55, label.length * 7.5 + 36));
    const tabPath = `M 0 26 L 0 6 A 6 6 0 0 1 6 0 L ${tabWidth - 18} 0 L ${tabWidth} 26 Z`;

    return {
      id: data.id,
      shape: shapeName,
      zIndex: 0,
      x: data.bounds.x,
      y: data.bounds.y,
      width: data.bounds.width,
      height: data.bounds.height,
      data: {
        ...data,
        displayName: data.name || data.id,
        isBoundary: true,
      },
      attrs: {
        body: {
          stroke: primaryColor,
        },
        folderTab: {
          d: tabPath,
          fill: CascaisPalette.ChalkWhite,
          stroke: primaryColor,
        },
        headerText: {
          text: label,
          fill: '#1E293B',
        },
      },
    };
  }

  const href = data.href || `/classes?select=${encodeURIComponent(data.name || data.id)}`;

  return {
    id: data.id,
    shape: shapeName,
    zIndex: 0,
    x: data.bounds.x,
    y: data.bounds.y,
    width: data.bounds.width,
    height: data.bounds.height,
    data: {
      ...data,
      displayName: data.name || data.id,
      href,
      isBoundary: true,
    },
    attrs: {
      body: {
        stroke: primaryColor,
        strokeDasharray: '6,4',
      },
      headerBg: {
        display: 'none',
        fill: 'none',
        stroke: 'none',
      },
      headerText: {
        text: label,
        fill: CascaisPalette.WarmGraphite,
      },
      persona: {
        display: 'none',
        fill: HeraldicWash.verde(DualityWashStrength.verde),
        class: 'aim-portal-persona',
      },
      door: {
        d: '',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.vermelho),
        class: 'aim-portal-door',
      },
      seam: {
        display: 'none',
        stroke: CascaisPalette.NetGoldStroke,
        strokeWidth: 1.5,
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        display: 'none',
        fill: HeraldicWash.vermelho(DualityWashStrength.chevron),
        fontSize: 18,
        fontWeight: 'bold',
        class: 'aim-portal-chevron',
      },
    },
  };
}

/**
 * Formats a stereotype list as its UML guillemet line, e.g. `['Lead', 'Customer']` → `«Lead, Customer»`.
 */
export function formatStereotypeLabel(stereotype: RaidNodeData['stereotype']): string {
  if (!stereotype) return '';
  const items = (Array.isArray(stereotype) ? stereotype.map(String) : String(stereotype).split(','))
    .map((s) => s.replace(/[«»"]/g, '').trim())
    .filter(Boolean);
  return items.length > 0 ? `«${items.join(', ')}»` : '';
}

/**
 * CR053 — X6 attributes for the pictogram image slots (`glyph`, `glyph2` … `glyph5`).
 *
 * Positions are anchored with `refX` / `refY` against the node box, so a pictogram keeps its place
 * (centred, beside the left or right edge) while the node is resized, without recomputing attrs.
 * Unused slots are hidden; with no known glyph the node renders exactly as before.
 */
export function computeStereotypeGlyphAttrs(
  data: RaidNodeData,
  width: number = data.bounds.width,
  height: number = data.bounds.height,
  frameless = false,
): Record<(typeof GLYPH_SELECTORS)[number], Record<string, any>> {
  const entries = resolveStereotypeGlyphs(data.stereotypeGlyph);
  const placements = computeStereotypeGlyphLayout(data.kind, width, height, entries.length, { frameless });
  const attrs = {} as Record<(typeof GLYPH_SELECTORS)[number], Record<string, any>>;
  GLYPH_SELECTORS.forEach((selector, i) => {
    const entry = entries[i];
    const p = placements[i];
    const href = entry ? getStereotypeGlyphUrl(entry.file) : undefined;
    if (!entry || !p || !href) {
      attrs[selector] = { display: 'none', href: '', xlinkHref: '' };
      return;
    }
    const fx = p.anchorX === 'middle' ? 0.5 : p.anchorX === 'end' ? '100%' : 0;
    const fy = p.anchorY === 'middle' ? 0.5 : 0;
    attrs[selector] = {
      ...(fx === 0 ? { x: p.x } : { refX: fx, x: p.x - (fx === 0.5 ? width / 2 : width) }),
      ...(fy === 0 ? { y: p.y } : { refY: fy, y: p.y - height / 2 }),
      width: p.width,
      height: p.height,
      href,
      xlinkHref: href,
      preserveAspectRatio: 'xMidYMid meet',
      display: 'block',
      pointerEvents: 'none',
      opacity: data.unbound === true ? 0.7 : 1,
      class: `aim-stereotype-glyph aim-stereotype-glyph-${p.mode}`,
      'aim-stereotype-glyph': entry.file,
    };
  });
  return attrs;
}

export function createAimNode(data: RaidNodeData): NodeMetadata {
  registerAimShapes();
  data = layoutDescription(data);

  const resolvedStereotype = resolveStereotype(data.stereotype, data.kind);
  // Frameless Place glyphs (Venue, Stage, Bar) match the stature of the Actor glyph (~120x110).
  const figure = shapeFigureOf(data);
  const isFramelessPlc = figure !== undefined;
  // CR053: a known pictogram takes the place of the built-in stereotype icon (badge on cards,
  // silhouette on actors). A frameless Place keeps its Stage, Venue or Bar and shows pictograms as
  // badges beside it. Unknown names fall back silently.
  const hasGlyph = resolveStereotypeGlyph(data.stereotypeGlyph) !== undefined;
  const glyphReplacesIcon = hasGlyph && !isFramelessPlc;
  const hasStereotypeIcon = hasGlyph || Boolean(resolvedStereotype && resolvedStereotype !== 'initiates');
  const stereoAttrs: Record<string, any> = glyphReplacesIcon
    ? {
        iconFill: { d: '', display: 'none' },
        iconStroke: { d: '', display: 'none' },
        iconAccent: { d: '', display: 'none' },
        iconPin: { d: '', display: 'none' },
      }
    : computeStereotypeIconAttrs(data);

  // A role circle has one size. Nodes cannot be resized by hand, so any other size is left over from a
  // file saved when a role was still a card; the circle is drawn at its own size on that box's centre.
  const isRoleCircle = data.kind === 'rol' || data.kind === 'rf';
  const roleCircle = getDefaultNodeBounds(data.kind);
  const effectiveWidth = isFramelessPlc
    ? shapeNodeWidth(data.bounds.width)
    : isRoleCircle ? roleCircle.width : data.bounds.width;
  const effectiveHeight = isFramelessPlc
    ? (data.bounds.height < 110 ? 110 : data.bounds.height)
    : isRoleCircle ? roleCircle.height : data.bounds.height;
  const glyphAttrs = computeStereotypeGlyphAttrs(data, effectiveWidth, effectiveHeight, isFramelessPlc);

  const shapeName = `aim-${data.kind}`;
  const baseMetadata: NodeMetadata = {
    id: data.id,
    shape: shapeName,
    x: isRoleCircle ? Math.round(data.bounds.x + (data.bounds.width - effectiveWidth) / 2) : data.bounds.x,
    y: isRoleCircle ? Math.round(data.bounds.y + (data.bounds.height - effectiveHeight) / 2) : data.bounds.y,
    width: effectiveWidth,
    height: effectiveHeight,
    data,
  };

  const isInstance = isInstanceNode(data);
  // 1UCC role slot: role name prominent, `: <Class>` quiet below, never underlined, no ring
  const isSlot = data.slot === true
    && (data.kind === 'per' || data.kind === 'obj' || data.kind === 'plc')
    && !(data.kind === 'obj' && data.description);
  const boxWidth = effectiveWidth;
  const fontSize = data.kind === 'uc' || data.kind === 'act' ? 13 : 12;
  const availableTextWidth = (hasStereotypeIcon && data.kind !== 'per' && data.kind !== 'plc')
    ? Math.max(40, boxWidth - 52)
    : (data.kind === 'per' || isFramelessPlc ? Math.max(boxWidth, 180) : boxWidth);
  const maxLineLength = computeMaxLineLength(availableTextWidth, fontSize);

  const isUnbound = data.unbound === true;
  const rawDisplayName = isUnbound && !data.displayName.startsWith('[') && !data.displayName.endsWith(']')
    ? `[${data.displayName}]`
    : data.displayName;
  const hasQualifier = !isSlot && Boolean(data.qualifier && data.qualifier.trim().length > 0);
  const wrappedQualifier = hasQualifier ? wrapAimText(data.qualifier!, maxLineLength) : '';
  const wrappedName = wrapAimText(rawDisplayName, maxLineLength);
  const portalAttrs = computePortalDoorAttrs(data);

  const cardTextRefX = hasStereotypeIcon && data.kind !== 'plc' ? 0.62 : 0.5;

  const qualifierText: string = hasQualifier
    ? wrappedQualifier
    : (!isSlot && !hasStereotypeIcon && data.stereotype ? (Array.isArray(data.stereotype) ? data.stereotype.join(', ') : String(data.stereotype)) : '');
  const labelText = wrappedName;

  // Archetype-specific customization
  const resultMetadata: NodeMetadata = (() => {
    // A node that stands as a Shape is the same element whatever its archetype: the Shape on its
    // invisible box, the Class and the name beneath it.
    if (figure) {
      const below = shapeFigurePlacement(figure, data.bounds.width);
      const qualifierY = below.y + below.height + 10;
      const qualifierLines = qualifierText ? qualifierText.split('\n').length : 0;
      return {
        ...baseMetadata,
        markup: SHAPE_FIGURE_MARKUP,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          body: {
            fill: 'transparent',
            stroke: 'none',
            strokeWidth: 0,
            pointerEvents: 'all',
            style: { fill: 'transparent', stroke: 'none', strokeWidth: 0, pointerEvents: 'all' },
            class: `aim-node aim-${data.kind} aim-frameless`,
          },
          qualifier: { text: qualifierText, fontStyle: 'italic', textDecoration: 'none', refX: 0.5, refY: qualifierY },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: qualifierLines > 0 ? qualifierY + qualifierLines * 18 : below.y + below.height + 18,
          },
        },
      };
    }

    switch (data.kind) {
      case 'uc': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          qualifier: {
            text: qualifierText,
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: cardTextRefX,
            refY: 0.35,
          },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: cardTextRefX,
            refY: hasQualifier ? 0.65 : 0.5,
          },
        },
      };
    }

    case 'act': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          body: {
            fill: CascaisPalette.ChalkWhite,
            stroke: CascaisPalette.CascaisRed,
            strokeWidth: 2,
            rx: 12,
            ry: 12,
            class: 'aim-node aim-act',
          },
          qualifier: {
            text: qualifierText,
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: cardTextRefX,
            refY: 0.35,
          },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: cardTextRefX,
            refY: hasQualifier ? 0.65 : 0.5,
          },
        },
      };
    }

    case 'cls':
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          title: {
            text: data.displayName,
            textDecoration: isInstance ? 'underline' : 'none',
          },
          attributes: {
            text: classAttributeLines(data).join('\n'),
          },
          methods: {
            text: data.methods && data.methods.length > 0 ? data.methods.join('\n') : '',
          },
        },
      };

    case 'obj': {
      if (data.description) {
        const prose = wrapDescription(data.description, data.descriptionWidth);
        return { ...baseMetadata, markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'path', selector: 'fold' }, { tagName: 'text', selector: 'label' }, { tagName: 'text', selector: 'description' }], attrs: { body: { fill: CascaisPalette.ChalkWhite, stroke: '#CBD5E1', strokeWidth: 1.5, refWidth: '100%', refHeight: '100%', style: { clipPath: OBJECT_CARD_CLIP } }, fold: { d: objectFoldFlap(boxWidth), stroke: '#CBD5E1' }, label: { text: data.displayName, refX: 0.5, refY: 22, textAnchor: 'middle', textDecoration: 'underline', fontSize: 13 }, description: { text: prose, refX: 14, refY: 50, textAnchor: 'start', textVerticalAnchor: 'top', fontSize: 12, lineHeight: 18, fill: '#475569' } } };
      }
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          // The archetype mark of an Object: its card has a folded corner
          body: { style: { clipPath: OBJECT_CARD_CLIP } },
          fold: { d: objectFoldFlap(boxWidth) },
          qualifier: {
            text: qualifierText,
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: cardTextRefX,
            refY: 0.35,
          },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: cardTextRefX,
            refY: hasQualifier ? 0.65 : 0.5,
          },
        },
      };
    }

    case 'per': {
      const isInitiating = isInitiatingStereotype(data.stereotype);
      const isSystem = resolvedStereotype === 'system';
      const isLead = resolvedStereotype === 'lead';
      // CR053: a pictogram silhouette replaces the stick figure in the same 58 px band, so labels stay put.
      const showFigure = !isSystem && !hasGlyph;
      // Decouple Tinctures: Lead role restores WarmGraphite to human actor head & torso lines
      const strokeColor = (isInitiating && !isLead) ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
      const cx = Math.round(boxWidth / 2);
      const qualifierLines = qualifierText ? qualifierText.split('\n').length : 0;
      const labelRefY = qualifierLines > 0 ? 66 + qualifierLines * 18 : 74;
      // When Lead: right arm reaches from elbow (cx+21, 54) to 30° peg at (cx+8, 47)
      const torsoD = isLead
        ? `M ${cx - 21} 54 v -6 a 10 10 0 0 1 10 -10 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 L ${cx + 8} 47`
        : `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`;
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          ...glyphAttrs,
          torso: {
            d: torsoD,
            stroke: strokeColor,
            strokeWidth: 2.2,
            display: showFigure ? 'block' : 'none',
          },
          head: {
            cx,
            cy: 20,
            r: 12,
            stroke: strokeColor,
            strokeWidth: 2.2,
            display: showFigure ? 'block' : 'none',
          },
          qualifier: {
            text: qualifierText,
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: 0.5,
            refY: 66,
          },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: labelRefY,
          },
        },
      };
    }

    // A Place always stands as a Shape (its pin, a Stage or a Bar), so it never reaches this switch.

    case 'rol':
    case 'rf': {
      return {
        ...baseMetadata,
        attrs: {
          body: { fill: data.kind === 'rf' ? String(data.properties?.color ?? CascaisPalette.AccentBlue) : CascaisPalette.ChalkWhite },
          label: { text: data.displayName, textDecoration: isInstance ? 'underline' : 'none', refX: 0.5, refY: -14 },
        },
      };
    }

    default:
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
        },
      };
    }
  })();

  if (isSlot && resultMetadata.attrs) {
    const attrs = resultMetadata.attrs as Record<string, any>;
    const tag = restrictionTag(data.restriction) ?? '';
    const nameLines = labelText.split('\n').length;
    const label = attrs.label ?? {};
    if (data.kind === 'per') {
      // Top-anchored label under the figure: the tag follows the last name line
      attrs.qualifier = { ...attrs.qualifier, text: tag, refY: label.refY, refY2: nameLines * SLOT_LINE_HEIGHT + 2 };
    } else {
      // Middle-anchored label: on a card the name and tag share the centre line
      const centred = typeof label.refY === 'number' && label.refY <= 1;
      const shift = tag && centred ? -SLOT_LINE_HEIGHT / 2 : 0;
      attrs.label = { ...label, refY2: shift };
      attrs.qualifier = {
        ...attrs.qualifier,
        text: tag,
        refY: label.refY,
        refY2: shift + ((nameLines + 1) * SLOT_LINE_HEIGHT) / 2,
      };
    }
  }

  if (isUnbound && resultMetadata.attrs) {
    const attrs = resultMetadata.attrs as Record<string, any>;
    attrs.body = {
      ...(attrs.body ?? {}),
      strokeDasharray: '5,4',
      opacity: 0.70,
    };
    if (attrs.head) {
      attrs.head.strokeDasharray = '5,4';
      attrs.head.opacity = 0.70;
    }
    if (attrs.torso) {
      attrs.torso.strokeDasharray = '5,4';
      attrs.torso.opacity = 0.70;
    }
    if (attrs.iconStroke) {
      attrs.iconStroke.strokeDasharray = '5,4';
      attrs.iconStroke.opacity = 0.70;
    }
    if (attrs.label) {
      attrs.label.fill = CascaisPalette.GraphiteMuted;
    }
    if (attrs.title) {
      attrs.title.fill = CascaisPalette.GraphiteMuted;
    }
  }

  return resultMetadata;
}

/**
 * Configures the router and connector for an X6 Edge based on AimRoutingMode.
 * - 'manhattan': Obstacle-avoiding 90° orthogonal router with rounded corners (radius: 8).
 * - 'normal': Direct straight line point-to-point connection.
 * - 'smooth': Curved cubic bezier spline between ports.
 */
export function applyEdgeRouting(edge: Edge, routing: AimRoutingMode = 'manhattan'): void {
  switch (routing) {
    case 'normal':
      edge.setRouter('normal');
      edge.setConnector('normal');
      break;
    case 'smooth':
      edge.setRouter('normal');
      edge.setConnector('smooth');
      break;
    case 'manhattan':
    default:
      edge.setRouter('manhattan', {
        padding: 20,
        startDirections: ['top', 'right', 'bottom', 'left'],
        endDirections: ['top', 'right', 'bottom', 'left'],
      });
      edge.setConnector('rounded', { radius: 8 });
      break;
  }
}

/**
 * Computed color styling for edge AST expression capsules.
 */
export interface ExpressionPillColors {
  pillBg: string;
  pillBorder: string;
  pillText: string;
}

/**
 * Computes background, border, and text colors for an edge AST expression capsule.
 * Supports Cascais Green, Cascais Red, Cascais Anthracite, and semantic evaluation states.
 */
export function computeExpressionPillColors(
  expressionColor?: string,
  satisfied?: boolean | null,
): ExpressionPillColors {
  const normalized = expressionColor?.trim().toLowerCase();

  if (normalized === 'green' || normalized === CascaisPalette.TelemetryGreen) {
    return {
      pillBg: CascaisPalette.EmeraldMist,
      pillBorder: CascaisPalette.TelemetryGreen,
      pillText: CascaisPalette.EmeraldInk,
    };
  }

  if (normalized === 'red' || normalized === CascaisPalette.CascaisRed) {
    return {
      pillBg: '#FEF2F2',
      pillBorder: CascaisPalette.CascaisRed,
      pillText: '#991B1B',
    };
  }

  if (
    normalized === 'anthracite' ||
    normalized === 'antracit' ||
    normalized === '#1f2937' ||
    normalized === 'graphite'
  ) {
    return {
      pillBg: '#F3F4F6',
      pillBorder: CascaisPalette.WarmGraphite,
      pillText: '#111827',
    };
  }

  // Fallback to satisfied semantic evaluation state if expressionColor is not specified
  if (satisfied === true) {
    return {
      pillBg: CascaisPalette.EmeraldMist,
      pillBorder: CascaisPalette.EmeraldLine,
      pillText: CascaisPalette.EmeraldInk,
    };
  }
  if (satisfied === false) {
    return {
      pillBg: '#FFFBEB',
      pillBorder: '#FDE68A',
      pillText: '#92400E',
    };
  }

  return {
    pillBg: '#F1F5F9',
    pillBorder: '#CBD5E1',
    pillText: '#475569',
  };
}

/**
 * Factory creating an AntV X6 Edge model from a RaidEdgeData specification.
 */
export function createAimEdge(data: RaidEdgeData, showExpressions = true): EdgeMetadata {
  registerAimShapes();

  const isDirected = data.directed !== false;
  const isObserves = Boolean(
    (data.label && String(data.label).toLowerCase().includes('observes')) ||
    (data.stereotype && String(data.stereotype).toLowerCase().includes('observes'))
  );
  const baseEdgeStyling = getEdgeStyling(data.kind);
  const edgeAttrs: Record<string, unknown> = {
    ...baseEdgeStyling,
    ...(isDirected ? {} : { targetMarker: null }),
    ...(isObserves
      ? {
          strokeDasharray: '6,3,2,3', // Supervisory monitoring telemetry line (ADR-0008)
          strokeWidth: 1.5,
          stroke: CascaisPalette.WarmGraphite,
        }
      : {}),
  };
  const routing = data.routing ?? 'manhattan';

  let routerConfig: EdgeMetadata['router'] = {
    name: 'manhattan',
    args: {
      padding: 20,
      startDirections: ['top', 'right', 'bottom', 'left'],
      endDirections: ['top', 'right', 'bottom', 'left'],
    },
  };
  let connectorConfig: EdgeMetadata['connector'] = {
    name: 'rounded',
    args: { radius: 8 },
  };

  if (routing === 'normal') {
    routerConfig = { name: 'normal' };
    connectorConfig = { name: 'normal' };
  } else if (routing === 'smooth') {
    routerConfig = { name: 'normal' };
    connectorConfig = { name: 'smooth' };
  }

  return {
    id: data.id,
    shape: isDirected ? 'aim-arrow' : 'aim-edge',
    router: routerConfig,
    connector: connectorConfig,
    source: {
      cell: data.sourceId,
      ...(data.sourcePort !== undefined ? { port: data.sourcePort } : {}),
    },
    target: {
      cell: data.targetId,
      ...(data.targetPort !== undefined ? { port: data.targetPort } : {}),
    },
    vertices: (data.bendPoints ?? []).map((pt) => ({ x: pt.x, y: pt.y })),
    labels: (() => {
      const edgeLabels: any[] = [];
      const hasExpression = Boolean(showExpressions && data.expression && data.expression.trim().length > 0);

      if (data.label) {
        edgeLabels.push({
          attrs: {
            text: {
              text: data.label,
              fill: CascaisPalette.TextSecondary,
              fontSize: 11,
            },
          },
          position: hasExpression ? { distance: 0.5, offset: -20 } : 0.5,
        });
      }

      if (hasExpression) {
        const { pillBg, pillBorder, pillText } = computeExpressionPillColors(
          data.expressionColor,
          data.satisfied,
        );

        // Compose tooltip: "Label: expression" or just expression
        const tooltipText = data.label
          ? `${data.label}: ${data.expression}`
          : data.expression!;

        edgeLabels.push({
          markup: [
            {
              tagName: 'rect',
              selector: 'pillBg',
            },
            {
              tagName: 'text',
              selector: 'pillText',
            },
            {
              tagName: 'title',
              selector: 'pillTitle',
            },
          ],
          attrs: {
            pillBg: {
              fill: pillBg,
              stroke: pillBorder,
              strokeWidth: 1,
              rx: 8,
              ry: 8,
              ref: 'pillText',
              refX: -6,
              refY: -3,
              refWidth2: 12,
              refHeight2: 6,
              cursor: 'pointer',
              class: 'aim-expression-pill',
            },
            pillText: {
              text: data.expression!,
              fill: pillText,
              fontSize: 10,
              fontWeight: 'bold',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
              class: 'aim-expression-text',
            },
            pillTitle: {
              text: tooltipText,
            },
          },
          position: 0.5,
        });
      }

      // CR053: edge pictogram on a chalk backing at the midpoint, stacked above the label / pill.
      const glyphEntry = resolveStereotypeGlyph(data.stereotypeGlyph);
      const glyphHref = glyphEntry ? getStereotypeGlyphUrl(glyphEntry.file) : undefined;
      if (glyphEntry && glyphHref) {
        const stacked = (data.label ? 1 : 0) + (hasExpression ? 1 : 0);
        const half = GLYPH_EDGE_SIZE / 2;
        edgeLabels.push({
          markup: [
            { tagName: 'rect', selector: 'glyphBg' },
            { tagName: 'image', selector: 'glyph' },
            { tagName: 'title', selector: 'glyphTitle' },
          ],
          attrs: {
            // Edge.defaultLabel styles every label <rect> with `ref: 'label'`; without an own `ref`
            // X6 throws "reference does not exist" and the glyph never renders. Hug the image instead.
            glyphBg: {
              ref: 'glyph',
              refX: -2,
              refY: -2,
              refWidth2: 4,
              refHeight2: 4,
              rx: 4,
              ry: 4,
              fill: CascaisPalette.ChalkWhite,
              fillOpacity: 0.9,
              stroke: 'none',
            },
            glyph: {
              x: -half,
              y: -half,
              width: GLYPH_EDGE_SIZE,
              height: GLYPH_EDGE_SIZE,
              href: glyphHref,
              xlinkHref: glyphHref,
              preserveAspectRatio: 'xMidYMid meet',
              class: 'aim-stereotype-glyph aim-stereotype-glyph-edge',
              'aim-stereotype-glyph': glyphEntry.file,
            },
            glyphTitle: { text: glyphEntry.label },
          },
          position: stacked === 0 ? 0.5 : { distance: 0.5, offset: stacked === 1 ? -21 : -40 },
        });
      }

      return edgeLabels.length > 0 ? edgeLabels : undefined;
    })(),
    attrs: {
      line: edgeAttrs,
    },
    data,
  };
}

/**
 * Returns SVG path stroke and marker attributes based on AimEdgeKind.
 */
function getEdgeStyling(kind: AimEdgeKind): Record<string, unknown> {
  switch (kind) {
    case 'dependency':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        strokeDasharray: '5,5',
        targetMarker: {
          name: 'block',
          args: {
            size: 8,
            open: true,
          },
        },
      };

    case 'generalization':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
      };

    case 'realization':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        strokeDasharray: '5,5',
        targetMarker: {
          name: 'classic',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
      };

    case 'aggregation':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        sourceMarker: {
          name: 'diamond',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
        targetMarker: null,
      };

    case 'composition':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        sourceMarker: {
          name: 'diamond',
          size: 10,
          fill: CascaisPalette.WarmGraphite,
        },
        targetMarker: null,
      };

    case 'association':
    default:
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 7,
        },
      };
  }
}

/**
 * Returns default Cartesian bounds for an instantiated AOAIM archetype.
 */
export function getDefaultNodeBounds(
  kind: AimOntologyKind | string,
  x: number = 100,
  y: number = 100,
): Bounds {
  switch (kind) {
    case 'uc':
      return { x, y, width: 140, height: 70 };
    case 'act':
      return { x, y, width: 150, height: 60 };
    case 'cls':
      return { x, y, width: 180, height: 110 };
    case 'obj':
      return { x, y, width: 160, height: 80 };
    case 'per':
      return { x, y, width: 120, height: 110 };
    case 'plc':
      return { x, y, width: 120, height: 110 };
    case 'rol':
      // The Generic Role stands as tall as the Person's whole bust (head top to shoulder line).
      return { x, y, width: 46, height: 46 };
    case 'rf':
      return { x, y, width: 22, height: 22 };
    default:
      return { x, y, width: 140, height: 60 };
  }
}

/**
 * Returns a canonical default display name for an instantiated AOAIM archetype.
 */
export function getDefaultNodeName(kind: AimOntologyKind | string): string {
  switch (kind) {
    case 'uc':
      return 'New UseCase';
    case 'act':
      return 'New Activity';
    case 'cls':
      return 'NewClass';
    case 'obj':
      return 'new Object';
    case 'per':
      return 'Actor';
    case 'plc':
      return 'Place';
    case 'rol':
      return 'Role';
    case 'rf':
      return 'RoleFiller';
    default:
      return 'Entity';
  }
}

