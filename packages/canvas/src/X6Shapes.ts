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
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 2,
        class: 'aim-node aim-uc',
      },
      label: {
        text: 'UseCase',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 2. AimActivityNode ('act') — Rounded rectangle with Heraldic Green border & underlined label
  Shape.Rect.define({
    shape: 'aim-act',
    overwrite: true,
    width: 150,
    height: 60,
    attrs: {
      body: {
        fill: CascaisPalette.CanvasCream,
        stroke: CascaisPalette.HeraldicGreen,
        strokeWidth: 2,
        rx: 12,
        ry: 12,
        class: 'aim-node aim-act',
      },
      label: {
        text: 'Activity',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'underline',
        textWrap: {
          width: -16,
          breakWord: true,
        },
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
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        class: 'aim-node aim-cls',
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

  // 4. AimObjectNode ('obj') — Instance card with underlined title
  Shape.Rect.define({
    shape: 'aim-obj',
    overwrite: true,
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.SilverLineDark,
        strokeWidth: 1.5,
        class: 'aim-node aim-obj',
      },
      label: {
        text: 'instance: Type',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        textDecoration: 'underline',
        textWrap: {
          width: -16,
          breakWord: true,
        },
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
        tagName: 'text',
        selector: 'label',
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
      label: {
        text: 'Actor',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        refX: 0.5,
        refY: 62,
        textWrap: {
          width: -10,
          breakWord: true,
        },
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 6. AimEdge — Orthogonal Manhattan edge with rounded corners
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

  // Archetype-specific customization
  switch (data.kind) {
    case 'uc': {
      const wrappedName = wrapAimText(data.displayName);
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName,
          },
        },
      };
    }

    case 'act': {
      const wrappedName = wrapAimText(data.displayName);
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName,
            textDecoration: 'underline',
          },
        },
      };
    }

    case 'cls':
      return {
        ...baseMetadata,
        attrs: {
          title: {
            text: data.displayName,
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
      const wrappedName = wrapAimText(data.displayName);
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName,
            textDecoration: 'underline',
          },
        },
      };
    }

    case 'per': {
      const isInitiating = data.stereotype?.toLowerCase().includes('initiates') ?? false;
      const strokeColor = isInitiating ? CascaisPalette.NetGold : CascaisPalette.WarmGraphite;
      const wrappedName = wrapAimText(data.displayName, 14);
      const text = data.stereotype ? `${data.stereotype}\n${wrappedName}` : wrappedName;
      return {
        ...baseMetadata,
        attrs: {
          torso: {
            stroke: strokeColor,
          },
          head: {
            stroke: strokeColor,
          },
          label: {
            text,
          },
        },
      };
    }

    default:
      return baseMetadata;
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
    default:
      return 'Entity';
  }
}

