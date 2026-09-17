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

/**
 * Cascais Heraldry color palette constants.
 */
export const CascaisPalette = {
  NetGold: '#F59E0B',
  HeraldicGreen: '#10B981',
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
        fill: CascaisPalette.CanvasCream,
        stroke: CascaisPalette.HeraldicGreen,
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
    width: 90,
    height: 90,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
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
        class: 'aim-node aim-per',
      },
      torso: {
        d: 'M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4',
        fill: 'none',
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      head: {
        cx: 45,
        cy: 22,
        r: 8,
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 2,
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.75)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
        refY: 60,
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
        refY: 62,
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
        selector: 'door',
      },
      {
        tagName: 'line',
        selector: 'seam',
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
        class: 'aim-node aim-plc',
      },
      header: {
        fill: '#3B82F6',
        height: 6,
        refWidth: '100%',
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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

  // 7. AimRoleNode ('rol') — Structural Role / KL-ONE constraint card
  Shape.Rect.define({
    shape: 'aim-rol',
    overwrite: true,
    width: 140,
    height: 50,
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
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        strokeDasharray: '4,3',
        class: 'aim-node aim-rol',
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
      chevron: {
        text: '›',
        fill: 'rgba(16, 185, 129, 0.70)',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
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
        refY: 0.35,
      },
      label: {
        text: 'Role',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        refX: 0.5,
        refY: 0.65,
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 8. AimEdge — Orthogonal Manhattan edge with rounded corners
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
        targetMarker: {
          name: 'classic',
          size: 7,
        },
        class: 'aim-edge',
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

  if (data.kind === 'per') {
    const cx = Math.round(w / 2);
    const headRight = `M ${cx} 14 A 8 8 0 0 1 ${cx} 30 Z`;
    const torsoRight = `M ${cx} 42 H ${cx + 8} a 8 8 0 0 1 8 8 v 4 H ${cx} Z`;
    return {
      door: {
        d: `${headRight} ${torsoRight}`,
        display: 'block',
        fill: 'rgba(16, 185, 129, 0.25)',
        class: 'aim-portal-door',
      },
      seam: {
        x1: cx,
        y1: 14,
        x2: cx,
        y2: 54,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 1.5,
        display: 'block',
        class: 'aim-portal-seam',
      },
      chevron: {
        text: '›',
        x: cx + 24,
        y: 32,
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
      x: w - 14,
      y: Math.round(h / 2),
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
  const attrs = computePortalDoorAttrs(data, active);
  node.setAttrByPath('door/d', attrs.door.d);
  node.setAttrByPath('door/display', attrs.door.display);
  if (attrs.seam.display === 'block') {
    node.setAttrByPath('seam/x1', (attrs.seam as any).x1);
    node.setAttrByPath('seam/y1', (attrs.seam as any).y1);
    node.setAttrByPath('seam/x2', (attrs.seam as any).x2);
    node.setAttrByPath('seam/y2', (attrs.seam as any).y2);
  }
  node.setAttrByPath('seam/display', attrs.seam.display);
  if (attrs.chevron.display === 'block') {
    node.setAttrByPath('chevron/x', (attrs.chevron as any).x);
    node.setAttrByPath('chevron/y', (attrs.chevron as any).y);
  }
  node.setAttrByPath('chevron/display', attrs.chevron.display);
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
      node.setAttrByPath('torso/d', `M ${cx + 16} 50 v -4 a 8 8 0 0 0 -8 -8 H ${cx - 8} a 8 8 0 0 0 -8 8 v 4`);
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
      if (portalAttrs.chevron.display === 'block') {
        node.setAttrByPath('chevron/x', (portalAttrs.chevron as any).x);
        node.setAttrByPath('chevron/y', (portalAttrs.chevron as any).y);
      }
      node.setAttrByPath('chevron/display', portalAttrs.chevron.display);
    }
  });
}

/**
 * Factory creating an AntV X6 Node model from a RaidNodeData specification.
 */
export function createAimNode(data: RaidNodeData): Node.Metadata {
  registerAimShapes();

  const shapeName = `aim-${data.kind}`;
  const baseMetadata: Node.Metadata = {
    id: data.id,
    shape: shapeName,
    x: data.bounds.x,
    y: data.bounds.y,
    width: data.bounds.width,
    height: data.bounds.height,
    data,
  };

  const isInstance = data.instance === true;
  const boxWidth = data.bounds.width;
  const fontSize = data.kind === 'uc' || data.kind === 'act' ? 13 : 12;
  const maxLineLength = computeMaxLineLength(boxWidth, fontSize);

  const hasQualifier = Boolean(data.qualifier && data.qualifier.trim().length > 0);
  const wrappedQualifier = hasQualifier ? wrapAimText(data.qualifier!, maxLineLength) : '';
  const wrappedName = wrapAimText(data.displayName, maxLineLength);
  const portalAttrs = computePortalDoorAttrs(data);

  // Archetype-specific customization
  switch (data.kind) {
    case 'uc': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refY: 0.35,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
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
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refY: 0.35,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
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
          title: {
            text: data.displayName,
            textDecoration: isInstance ? 'underline' : 'none',
          },
          attributes: {
            text: data.attributes && data.attributes.length > 0 ? data.attributes.join('\n') : '',
          },
          methods: {
            text: data.methods && data.methods.length > 0 ? data.methods.join('\n') : '',
          },
        },
      };

    case 'obj': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refY: 0.35,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
            refY: hasQualifier ? 0.65 : 0.5,
          },
        },
      };
    }

    case 'per': {
      const isInitiating = data.stereotype?.toLowerCase().includes('initiates') ?? false;
      const strokeColor = isInitiating ? CascaisPalette.NetGold : CascaisPalette.WarmGraphite;
      const cx = Math.round(boxWidth / 2);
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          torso: {
            d: `M ${cx + 16} 50 v -4 a 8 8 0 0 0 -8 -8 H ${cx - 8} a 8 8 0 0 0 -8 8 v 4`,
            stroke: strokeColor,
          },
          head: {
            cx,
            cy: 22,
            stroke: strokeColor,
          },
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: 0.5,
            refY: 60,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: hasQualifier ? 75 : 62,
          },
        },
      };
    }

    case 'plc': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: 0.5,
            refY: 0.38,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: 0.62,
          },
        },
      };
    }

    case 'rol': {
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
          qualifier: {
            text: hasQualifier ? (data.stereotype ? `${data.stereotype}\n${wrappedQualifier}` : wrappedQualifier) : '',
            fontStyle: 'italic',
            textDecoration: 'none',
            refX: 0.5,
            refY: 0.35,
          },
          label: {
            text: hasQualifier ? wrappedName : (data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName),
            textDecoration: isInstance ? 'underline' : 'none',
            refX: 0.5,
            refY: 0.65,
          },
        },
      };
    }

    default:
      return {
        ...baseMetadata,
        attrs: {
          ...portalAttrs,
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

  const edgeAttrs = getEdgeStyling(data.kind);
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
    shape: 'aim-edge',
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
    vertices: data.bendPoints.map((pt) => ({ x: pt.x, y: pt.y })),
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
      return { x, y, width: 90, height: 90 };
    case 'plc':
      return { x, y, width: 160, height: 70 };
    case 'rol':
      return { x, y, width: 140, height: 50 };
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
    default:
      return 'Entity';
  }
}

