import { classAttributeLines } from './RoleModel.js';
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

import { Graph, Shape, Node, Edge } from '@antv/x6';
import type {
  AimOntologyKind,
  AimEdgeKind,
  AimRoutingMode,
  RaidNodeData,
  RaidEdgeData,
  OrthogonalPortId,
  Bounds,
} from './types.js';
import {
  resolveStereotype,
  isInitiatingStereotype,
  getStereotypePaths,
} from './StereotypeIcons.js';

/**
 * Cascais Heraldry color palette constants.
 */
export const CascaisPalette = {
  NetGold: '#F59E0B',
  HeraldicGreen: '#10B981',
  CascaisRed: '#EF4444',
  WarmGraphite: '#1F2937',
  GraphiteMuted: '#4B5563',
  SilverLine: '#E5E7EB',
  SilverLineDark: '#D1D5DB',
  ChalkWhite: '#FFFFFF',
  CanvasCream: '#F8FAFC',
  AccentBlue: '#3B82F6',
  TextPrimary: '#111827',
  TextSecondary: '#4B5563',
} as const;

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
        stroke: CascaisPalette.NetGold,
        strokeWidth: 2,
        class: 'aim-node aim-uc',
      },
      door: {
        fill: 'rgba(16, 185, 129, 0.10)',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.70)',
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
      door: {
        fill: 'rgba(16, 185, 129, 0.10)',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.70)',
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
      door: {
        fill: 'rgba(16, 185, 129, 0.10)',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.70)',
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
      door: {
        fill: 'rgba(16, 185, 129, 0.10)',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.70)',
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
      door: {
        fill: 'rgba(16, 185, 129, 0.25)',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.75)',
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
      door: {
        fill: 'rgba(16, 185, 129, 0.10)',
        fillRule: 'evenodd',
        display: 'none',
        class: 'aim-portal-door',
      },
      seam: {
        stroke: CascaisPalette.NetGold,
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
        fill: 'rgba(16, 185, 129, 0.70)',
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
    Shape.Circle.define({
      shape: `aim-${kind}`, overwrite: true, width: 22, height: 22,
      markup: [{ tagName: 'circle', selector: 'body' }, { tagName: 'text', selector: 'label' }],
      attrs: {
        body: { refCx: '50%', refCy: '50%', refR: '50%', stroke: '#334155', strokeWidth: 2, fill: kind === 'rf' ? '#2563EB' : '#FFFFFF' },
        label: { refX: 0.5, refY: -14, textAnchor: 'middle', textVerticalAnchor: 'middle', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', fill: '#1F2937' },
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

  shapesRegistered = true;
}

/**
 * Computes X6 attribute dictionary for the Portuguese Bicolor Seam & Portal Door.
 * If data.href is absent or empty, or isActive is false, door, seam and chevron are hidden (dormant by default).
 * When awakened (isActive = true):
 * - Reveals vertical gold seam (Cascais Net Gold, stroke-width: 1.5) down the center meridian.
 * - Reveals right-hemisphere green wash (Cascais Heraldic Green with alpha).
 * - For person ('per'), green wash contours strictly to right head semi-circle and right torso arc.
 * - Reveals doorway chevron '›'.
 */
export function computePortalDoorAttrs(data: RaidNodeData, isActive = false) {
  const hasPortal = Boolean(data.href && data.href.trim().length > 0);
  if (!hasPortal || !isActive) {
    return {
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

  const w = data.bounds.width;
  const h = data.bounds.height;
  const midX = Math.round(w / 2);

  const resolvedStereotype = resolveStereotype(data.stereotype);

  if (data.kind === 'per') {
    const cx = Math.round(w / 2);
    if (resolvedStereotype === 'system') {
      // Dual-chassis server rack right half: top chassis, connecting neck, bottom chassis
      const systemRightHalf = `M ${cx} 11 H ${cx + 16} A 4 4 0 0 1 ${cx + 20} 15 V 23 A 4 4 0 0 1 ${cx + 16} 27 H ${cx + 9} V 33 H ${cx + 16} A 4 4 0 0 1 ${cx + 20} 37 V 45 A 4 4 0 0 1 ${cx + 16} 49 H ${cx} Z`;
      return {
        door: {
          d: systemRightHalf,
          display: 'block',
          fill: 'rgba(16, 185, 129, 0.25)',
          class: 'aim-portal-door',
        },
        seam: {
          x1: cx,
          y1: 11,
          x2: cx,
          y2: 49,
          stroke: CascaisPalette.NetGold,
          strokeWidth: 1.5,
          display: 'block',
          class: 'aim-portal-seam',
        },
        chevron: {
          text: '›',
          refX: 0.5,
          refDx: 32,
          refY: 30,
          fill: 'rgba(16, 185, 129, 0.75)',
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
    const headRight = `M ${cx} 8 A 12 12 0 0 1 ${cx} 32 Z`;
    const torsoRight = `M ${cx} 38 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 H ${cx} Z`;
    return {
      door: {
        d: `${headRight} ${torsoRight}`,
        display: 'block',
        fill: 'rgba(16, 185, 129, 0.25)',
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: 8,
        x2: cx,
        y2: 54,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 1,
        refDx: -12,
        refY: 0.5,
        fill: 'rgba(16, 185, 129, 0.75)',
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

  if (data.kind === 'plc' && resolvedStereotype === 'venue') {
    const effectiveW = w > 140 ? 120 : (w < 120 ? 120 : w);
    const cx = Math.round(effectiveW / 2);
    const iconY = 6;
    // Right half of teardrop pin with inner aperture cutout (fill-rule evenodd) scaled to 45x54
    const pinRightHalf = `M ${cx} 9 A 13.5 13.5 0 0 1 ${cx + 13.5} 22.5 C ${cx + 13.5} 32.25 ${cx + 7.5} 39.75 ${cx} 49.5 Z M ${cx} 27.75 A 5.25 5.25 0 0 0 ${cx} 17.25 Z`;
    return {
      door: {
        d: pinRightHalf,
        display: 'block',
        fill: 'rgba(16, 185, 129, 0.25)',
        fillRule: 'evenodd',
        'fill-rule': 'evenodd',
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: iconY,
        x2: cx,
        y2: iconY + 54,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 0.5,
        refDx: 34,
        refY: 26,
        fill: 'rgba(16, 185, 129, 0.75)',
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

  if (data.kind === 'plc' && resolvedStereotype === 'stage') {
    const effectiveW = w > 140 ? 120 : (w < 120 ? 120 : w);
    const cx = Math.round(effectiveW / 2);
    const iconY = 6;
    // Outer bounds right half: canopy roof slope + right truss tower + stage pad + centerline seam
    const stageRightHalf = `M ${cx} ${iconY + 2.6} H ${cx + 14.4} L ${cx + 20.5} ${iconY + 9.6} V ${iconY + 40.2} H ${cx} Z`;
    return {
      door: {
        d: stageRightHalf,
        display: 'block',
        fill: 'rgba(16, 185, 129, 0.25)',
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: iconY + 2.6,
        x2: cx,
        y2: iconY + 40.2,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 0.5,
        refDx: 34,
        refY: 26,
        fill: 'rgba(16, 185, 129, 0.75)',
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

  if (data.kind === 'plc' && resolvedStereotype === 'bar') {
    const effectiveW = w > 140 ? 120 : (w < 120 ? 120 : w);
    const cx = Math.round(effectiveW / 2);
    const iconY = 6;
    // Right half of the glass: V-bowl right half from rim to stem vertex
    const barRightHalf = `M ${cx} ${iconY + 8} H ${cx + 15} L ${cx} ${iconY + 28} Z`;
    return {
      door: {
        d: barRightHalf,
        display: 'block',
        fill: 'rgba(16, 185, 129, 0.40)',
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: iconY + 8,
        x2: cx,
        y2: iconY + 44,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        refX: 0.5,
        refDx: 32,
        refY: 26,
        fill: 'rgba(16, 185, 129, 0.75)',
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

  let pathD = `M ${midX} 0 H ${w} v ${h} H ${midX} Z`;
  if (data.kind === 'uc') {
    const rx = Math.round(w / 2);
    const ry = Math.round(h / 2);
    pathD = `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${rx} ${h} Z`;
  } else if (data.kind === 'act') {
    const r = 12;
    pathD = `M ${midX} 0 H ${w - r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} H ${midX} Z`;
  }

  return {
    door: {
      d: pathD,
      display: 'block',
      fill: 'rgba(16, 185, 129, 0.10)',
      class: 'aim-portal-door',
    },
    seam: {
      x1: midX,
      y1: 0,
      x2: midX,
      y2: h,
      stroke: CascaisPalette.NetGold,
      strokeWidth: 1.5,
      display: 'block',
      class: 'aim-portal-seam',
    },
    chevron: {
      text: '›',
      refX: 1,
      refDx: -12,
      refY: 0.5,
      fill: 'rgba(16, 185, 129, 0.70)',
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
  if (!data?.href) {
    return;
  }
  const opt = { ignoreHistory: true };
  const attrs = computePortalDoorAttrs(data, active);
  node.setAttrByPath('door/d', attrs.door.d, opt);
  node.setAttrByPath('door/display', attrs.door.display, opt);
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
  const resolved = resolveStereotype(data.stereotype);
  if (!resolved) {
    return {
      iconFill: { d: '', display: 'none' },
      iconStroke: { d: '', display: 'none' },
      iconAccent: { d: '', display: 'none' },
    };
  }

  const paths = getStereotypePaths(resolved);
  const w = data.bounds.width;
  const h = data.bounds.height;
  const isInitiating = isInitiatingStereotype(data.stereotype);
  const strokeColor = isInitiating ? CascaisPalette.NetGold : CascaisPalette.WarmGraphite;

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
          stroke: CascaisPalette.NetGold,
          strokeWidth: 1.2,
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
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
          stroke: CascaisPalette.NetGold,
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconAccent: {
          d: '',
          display: 'none',
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
    if (resolved === 'system') {
      return {
        iconFill: {
          d: paths.fillD,
          transform: `translate(${cx - 22}, 8)`,
          fill: CascaisPalette.ChalkWhite,
          stroke: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-fill',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${cx - 22}, 8)`,
          stroke: strokeColor,
          strokeWidth: 2.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: 'block',
          class: 'aim-stereotype-icon-stroke',
        },
        iconAccent: {
          d: paths.accentFillD ?? '',
          transform: `translate(${cx - 22}, 8)`,
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
      iconAccent: { d: '', display: 'none' },
    };
  }

  if (data.kind === 'plc') {
    const isFrameless = ['venue', 'stage', 'bar'].includes(resolved ?? '');
    if (isFrameless) {
      const effectiveW = (w > 140) ? 120 : (w < 120 ? 120 : w);
      const cx = Math.round(effectiveW / 2);
      const iconX = cx - Math.round(paths.width / 2);
      const iconY = 6;

      // Universal Initiator rule: With «initiates», Net Gold (#F59E0B); Without «initiates», WarmGraphite (#1F2937)
      let fillColor: string = CascaisPalette.ChalkWhite;
      let accentColor: string = strokeColor;

      if (resolved === 'bar') {
        fillColor = CascaisPalette.ChalkWhite;
        accentColor = strokeColor; // olive dot in pristine original stroke color
      } else if (resolved === 'stage') {
        fillColor = CascaisPalette.ChalkWhite;
        accentColor = strokeColor; // stars on canopy
      } else if (resolved === 'venue') {
        fillColor = CascaisPalette.ChalkWhite;
        accentColor = strokeColor;
      }

      return {
        iconFill: {
          d: paths.fillD,
          transform: `translate(${iconX}, ${iconY})`,
          fill: fillColor,
          fillRule: 'evenodd',
          'fill-rule': 'evenodd',
          stroke: 'none',
          display: paths.fillD ? 'block' : 'none',
          class: 'aim-stereotype-icon-fill',
        },
        iconStroke: {
          d: paths.strokeD,
          transform: `translate(${iconX}, ${iconY})`,
          stroke: strokeColor,
          strokeWidth: resolved === 'venue' ? 1.8 : 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          display: paths.strokeD ? 'block' : 'none',
          class: 'aim-stereotype-icon-stroke',
        },
        iconAccent: {
          d: paths.starsD ?? paths.accentFillD ?? '',
          transform: `translate(${iconX}, ${iconY})`,
          fill: accentColor,
          stroke: 'none',
          display: (paths.starsD || paths.accentFillD) ? 'block' : 'none',
          class: 'aim-stereotype-icon-accent',
        },
      };
    }
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
  } else if (resolved === 'headliner') {
    cardStrokeColor = CascaisPalette.NetGold;
    cardFillColor = 'none';
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'ai') {
    cardStrokeColor = CascaisPalette.WarmGraphite;
    cardFillColor = CascaisPalette.WarmGraphite;
    cardAccentColor = CascaisPalette.NetGold;
  } else if (resolved === 'initiates') {
    cardStrokeColor = CascaisPalette.NetGold;
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
      node.setAttrByPath('torso/d', `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`);
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
      node.setData(updatedData);
      const isCurrentlyActive = node.getAttrByPath('door/display') === 'block';
      const portalAttrs = computePortalDoorAttrs(updatedData, isCurrentlyActive);
      node.setAttrByPath('door/d', portalAttrs.door.d);
      node.setAttrByPath('door/display', portalAttrs.door.display);
      if (portalAttrs.seam.display === 'block') {
        node.setAttrByPath('seam/x1', (portalAttrs.seam as any).x1);
        node.setAttrByPath('seam/y1', (portalAttrs.seam as any).y1);
        node.setAttrByPath('seam/x2', (portalAttrs.seam as any).x2);
        node.setAttrByPath('seam/y2', (portalAttrs.seam as any).y2);
      }
      node.setAttrByPath('seam/display', portalAttrs.seam.display);
      node.setAttrByPath('chevron/display', portalAttrs.chevron.display);
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

export function createAimNode(data: RaidNodeData): Node.Metadata {
  registerAimShapes();
  data = layoutDescription(data);

  const resolvedStereotype = resolveStereotype(data.stereotype);
  const hasStereotypeIcon = Boolean(resolvedStereotype && resolvedStereotype !== 'initiates');
  const stereoAttrs = computeStereotypeIconAttrs(data);

  // Frameless Place glyphs (Venue, Stage, Bar) match the stature of the Actor glyph (~120x110)
  const isFramelessPlc = data.kind === 'plc' && ['venue', 'stage', 'bar'].includes(resolvedStereotype ?? '');
  const effectiveWidth = isFramelessPlc
    ? (data.bounds.width > 140 ? 120 : data.bounds.width)
    : data.bounds.width;
  const effectiveHeight = isFramelessPlc
    ? (data.bounds.height < 110 ? 110 : data.bounds.height)
    : data.bounds.height;

  const shapeName = `aim-${data.kind}`;
  const baseMetadata: Node.Metadata = {
    id: data.id,
    shape: shapeName,
    x: data.bounds.x,
    y: data.bounds.y,
    width: effectiveWidth,
    height: effectiveHeight,
    data,
  };

  const isInstance = data.instance === true || data.kind === 'obj' || data.kind === 'rf';
  const boxWidth = effectiveWidth;
  const fontSize = data.kind === 'uc' || data.kind === 'act' ? 13 : 12;
  const availableTextWidth = (hasStereotypeIcon && data.kind !== 'per' && data.kind !== 'plc')
    ? Math.max(40, boxWidth - 52)
    : (data.kind === 'per' || isFramelessPlc ? Math.max(boxWidth, 180) : boxWidth);
  const maxLineLength = computeMaxLineLength(availableTextWidth, fontSize);

  const hasQualifier = Boolean(data.qualifier && data.qualifier.trim().length > 0);
  const wrappedQualifier = hasQualifier ? wrapAimText(data.qualifier!, maxLineLength) : '';
  const wrappedName = wrapAimText(data.displayName, maxLineLength);
  const portalAttrs = computePortalDoorAttrs(data);

  const cardTextRefX = hasStereotypeIcon && data.kind !== 'plc' ? 0.62 : 0.5;

  const qualifierText: string = hasQualifier
    ? wrappedQualifier
    : (!hasStereotypeIcon && data.stereotype ? (Array.isArray(data.stereotype) ? data.stereotype.join(', ') : String(data.stereotype)) : '');
  const labelText = wrappedName;

  // Archetype-specific customization
  switch (data.kind) {
    case 'uc': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
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
        return { ...baseMetadata, markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'text', selector: 'label' }, { tagName: 'text', selector: 'description' }], attrs: { body: { fill: '#FFFFFF', stroke: '#CBD5E1', strokeWidth: 1.5, refWidth: '100%', refHeight: '100%' }, label: { text: data.displayName, refX: 0.5, refY: 22, textAnchor: 'middle', textDecoration: 'underline', fontSize: 13 }, description: { text: prose, refX: 14, refY: 50, textAnchor: 'start', textVerticalAnchor: 'top', fontSize: 12, lineHeight: 18, fill: '#475569' } } };
      }
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
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
      const strokeColor = isInitiating ? CascaisPalette.NetGold : CascaisPalette.WarmGraphite;
      const cx = Math.round(boxWidth / 2);
      const qualifierLines = qualifierText ? qualifierText.split('\n').length : 0;
      const labelRefY = qualifierLines > 0 ? 66 + qualifierLines * 18 : 74;
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
          torso: {
            d: `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`,
            stroke: strokeColor,
            strokeWidth: 2.2,
            display: isSystem ? 'none' : 'block',
          },
          head: {
            cx,
            cy: 20,
            r: 12,
            stroke: strokeColor,
            strokeWidth: 2.2,
            display: isSystem ? 'none' : 'block',
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

    case 'plc': {
      if (isFramelessPlc) {
        // Venue, Stage, Bar: strictly frameless with glyph in Net Gold (#F59E0B)
        const qualifierLines = qualifierText ? qualifierText.split('\n').length : 0;
        const labelRefY = qualifierLines > 0 ? 66 + qualifierLines * 18 : 74;
        return {
          ...baseMetadata,
          attrs: {
            ...portalAttrs,
            ...stereoAttrs,
            body: {
              fill: 'transparent',
              stroke: 'none',
              strokeWidth: 0,
              pointerEvents: 'all',
              style: { fill: 'transparent', stroke: 'none', strokeWidth: 0, pointerEvents: 'all' },
              class: 'aim-node aim-plc aim-frameless',
            },
            header: {
              display: 'none',
              height: 0,
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
              refY: qualifierLines > 0 ? labelRefY : 84,
            },
          },
        };
      }

      if (hasStereotypeIcon) {
        // Other framed Place with Stereotype
        return {
          ...baseMetadata,
          attrs: {
            ...portalAttrs,
            ...stereoAttrs,
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
            qualifier: {
              text: qualifierText,
              fontStyle: 'italic',
              textDecoration: 'none',
              refX: 0.5,
              refY: 42,
            },
            label: {
              text: labelText,
              textDecoration: isInstance ? 'underline' : 'none',
              refX: 0.5,
              refY: 58,
            },
          },
        };
      }

      // Unstereotyped Place card
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          ...stereoAttrs,
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
          qualifier: {
            text: qualifierText,
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: 0.5,
            refY: 0.38,
          },
          label: {
            text: labelText,
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: hasQualifier ? 0.65 : 0.5,
          },
        },
      };
    }

    case 'rol':
    case 'rf': {
      return {
        ...baseMetadata,
        attrs: {
          body: { fill: data.kind === 'rf' ? String(data.properties?.color ?? '#2563EB') : '#FFFFFF' },
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
 * Factory creating an AntV X6 Edge model from a RaidEdgeData specification.
 */
export function createAimEdge(data: RaidEdgeData): Edge.Metadata {
  registerAimShapes();

  const isDirected = data.directed !== false;
  const edgeAttrs = { ...getEdgeStyling(data.kind), ...(isDirected ? {} : { targetMarker: null }) };
  const routing = data.routing ?? 'manhattan';

  let routerConfig: Edge.Metadata['router'] = {
    name: 'manhattan',
    args: {
      padding: 20,
      startDirections: ['top', 'right', 'bottom', 'left'],
      endDirections: ['top', 'right', 'bottom', 'left'],
    },
  };
  let connectorConfig: Edge.Metadata['connector'] = {
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
    labels: data.label
      ? [
          {
            attrs: {
              text: {
                text: data.label,
                fill: CascaisPalette.TextSecondary,
                fontSize: 11,
              },
            },
            position: 0.5,
          },
        ]
      : undefined,
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

